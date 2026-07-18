import type { BudgetState, Expense } from '../types'
import { defaultGoalDeadline, getMonthKey } from './dates'
import { migrateExpensesByMonth } from './expenses'

const SHARE_VERSION = 1
const HASH_PREFIX = '#p='

export interface ShareOptions {
  includeGoals?: boolean
  includeTransactions?: boolean
}

export interface SharedPlanPayload {
  v: number
  monthlyIncome: number
  expenses?: Expense[]
  expensesByMonth?: Record<string, Expense[]>
  goals?: BudgetState['goals']
  transactions?: BudgetState['transactions']
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function buildSharePayload(
  state: BudgetState,
  options: ShareOptions = {},
): SharedPlanPayload {
  const { includeGoals = true, includeTransactions = false } = options

  const payload: SharedPlanPayload = {
    v: SHARE_VERSION,
    monthlyIncome: state.monthlyIncome,
    expensesByMonth: state.expensesByMonth,
  }

  if (includeGoals) payload.goals = state.goals
  if (includeTransactions) payload.transactions = state.transactions

  return payload
}

export function encodeSharePlan(state: BudgetState, options?: ShareOptions): string {
  return toBase64Url(JSON.stringify(buildSharePayload(state, options)))
}

export function decodeSharePlan(encoded: string): SharedPlanPayload | null {
  try {
    const parsed = JSON.parse(fromBase64Url(encoded)) as SharedPlanPayload
    if (parsed.v !== SHARE_VERSION) return null
    if (typeof parsed.monthlyIncome !== 'number') return null
    if (!parsed.expensesByMonth && !Array.isArray(parsed.expenses)) return null
    return parsed
  } catch {
    return null
  }
}

export function readSharePlanFromUrl(): SharedPlanPayload | null {
  if (typeof window === 'undefined') return null

  const hashValue = window.location.hash.startsWith(HASH_PREFIX)
    ? window.location.hash.slice(HASH_PREFIX.length)
    : null
  const queryValue = new URLSearchParams(window.location.search).get('p')
  const encoded = hashValue || queryValue

  if (!encoded) return null
  return decodeSharePlan(encoded)
}

export function createShareUrl(state: BudgetState, options?: ShareOptions): string {
  const encoded = encodeSharePlan(state, options)
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = `${HASH_PREFIX}${encoded}`
  return url.toString()
}

export const DEFAULT_URL_SHARE_OPTIONS: ShareOptions = {
  includeGoals: true,
  includeTransactions: true,
}

export function syncSharePlanToUrl(
  state: BudgetState,
  options: ShareOptions = DEFAULT_URL_SHARE_OPTIONS,
): void {
  if (typeof window === 'undefined') return

  const nextHash = `${HASH_PREFIX}${encodeSharePlan(state, options)}`
  if (window.location.hash === nextHash) return

  const url = new URL(window.location.href)
  url.search = ''
  url.hash = nextHash
  window.history.replaceState(null, '', url.toString())
}

export function clearSharePlanFromUrl(): void {
  if (typeof window === 'undefined') return
  if (!window.location.hash.startsWith(HASH_PREFIX) && !new URLSearchParams(window.location.search).has('p')) {
    return
  }

  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  window.history.replaceState(null, '', url.toString())
}

export function sharedPlanToState(
  payload: SharedPlanPayload,
  localTransactions: BudgetState['transactions'] = [],
): BudgetState {
  return {
    monthlyIncome: payload.monthlyIncome,
    expensesByMonth: migrateExpensesByMonth(payload, getMonthKey()),
    goals: (payload.goals ?? []).map((goal) => ({
      ...goal,
      deadline: goal.deadline || defaultGoalDeadline(),
    })),
    transactions: payload.transactions ?? localTransactions,
  }
}

export async function copyShareLink(state: BudgetState, options?: ShareOptions): Promise<string> {
  const url = createShareUrl(state, options)
  await navigator.clipboard.writeText(url)
  return url
}
