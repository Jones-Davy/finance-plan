import { v4 as uuidv4 } from 'uuid'
import type { ActualTransaction, Expense } from '../types'
import { DEFAULT_EXPENSES } from '../types'
import { getMonthKey } from './dates'

export function collectMonthKeys(
  expensesByMonth: Record<string, Expense[]>,
  transactions: ActualTransaction[],
  activeMonthKey: string,
): string[] {
  const keys = new Set<string>([activeMonthKey, getMonthKey()])

  for (const [key, expenses] of Object.entries(expensesByMonth)) {
    if (expenses.length > 0) keys.add(key)
  }

  for (const transaction of transactions) {
    keys.add(transaction.date.slice(0, 7))
  }

  return Array.from(keys).sort()
}

export function createDefaultExpenses(): Expense[] {
  return DEFAULT_EXPENSES.map((expense) => ({ ...expense, id: uuidv4() }))
}

export function cloneExpenses(expenses: Expense[]): Expense[] {
  return expenses.map((expense) => ({ ...expense, id: uuidv4() }))
}

export function getExpensesForMonth(
  expensesByMonth: Record<string, Expense[]>,
  monthKey: string,
): Expense[] {
  return expensesByMonth[monthKey] ?? []
}

export function resolveSourceMonthKey(
  expensesByMonth: Record<string, Expense[]>,
  monthKey: string,
): string | null {
  const keys = Object.keys(expensesByMonth)
    .filter((key) => (expensesByMonth[key]?.length ?? 0) > 0)
    .sort()

  if (keys.length === 0) return null

  const earlier = keys.filter((key) => key <= monthKey)
  if (earlier.length > 0) return earlier[earlier.length - 1]

  return keys[0]
}

export function ensureMonthExpenses(
  expensesByMonth: Record<string, Expense[]>,
  monthKey: string,
): Record<string, Expense[]> {
  if (expensesByMonth[monthKey]?.length) {
    return expensesByMonth
  }

  return {
    ...expensesByMonth,
    [monthKey]: createDefaultExpenses(),
  }
}

export function migrateExpensesByMonth(
  parsed: {
    expensesByMonth?: Record<string, Expense[]>
    expenses?: Expense[]
  },
  fallbackMonthKey: string,
): Record<string, Expense[]> {
  if (parsed.expensesByMonth && Object.keys(parsed.expensesByMonth).length > 0) {
    return parsed.expensesByMonth
  }

  if (parsed.expenses?.length) {
    return { [fallbackMonthKey]: parsed.expenses }
  }

  return { [fallbackMonthKey]: createDefaultExpenses() }
}
