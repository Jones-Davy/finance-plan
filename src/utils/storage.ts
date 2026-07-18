import type { BudgetState } from '../types'
import { defaultGoalDeadline, getMonthKey, getTodayISO, parseISODate } from './dates'
import { createDefaultExpenses, migrateExpensesByMonth } from './expenses'

const STORAGE_KEY = 'finance-budget-v1'
const VIEW_MONTH_KEY = 'finance-budget-view-month'
const LAST_VISIT_KEY = 'finance-budget-last-visit'

const MONTH_KEY_PATTERN = /^\d{4}-\d{2}$/

export function createDefaultState(): BudgetState {
  const monthKey = getMonthKey()
  return {
    monthlyIncome: 0,
    expensesByMonth: { [monthKey]: createDefaultExpenses() },
    goals: [],
    transactions: [],
  }
}

export function loadBudget(): BudgetState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultState()
    const parsed = JSON.parse(raw) as BudgetState & { expenses?: BudgetState['expensesByMonth'][string] }
    return {
      monthlyIncome: parsed.monthlyIncome ?? 0,
      expensesByMonth: migrateExpensesByMonth(parsed, getMonthKey()),
      goals: (parsed.goals ?? []).map((goal) => ({
        ...goal,
        deadline: goal.deadline || defaultGoalDeadline(),
      })),
      transactions: parsed.transactions ?? [],
    }
  } catch {
    return createDefaultState()
  }
}

export function saveBudget(state: BudgetState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function loadViewMonthKey(reference = new Date()): string {
  const current = getMonthKey(reference)

  try {
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY)
    localStorage.setItem(LAST_VISIT_KEY, getTodayISO(reference))

    if (!lastVisit || getMonthKey(parseISODate(lastVisit)) !== current) {
      localStorage.setItem(VIEW_MONTH_KEY, current)
      return current
    }

    const saved = localStorage.getItem(VIEW_MONTH_KEY)
    if (saved && MONTH_KEY_PATTERN.test(saved)) {
      return saved
    }
  } catch {
    // ignore storage errors
  }

  return current
}

export function saveViewMonthKey(monthKey: string): void {
  if (!MONTH_KEY_PATTERN.test(monthKey)) return
  localStorage.setItem(VIEW_MONTH_KEY, monthKey)
}
