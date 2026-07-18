import type { BudgetState } from '../types'
import { cloneExpenses } from './expenses'
import { getIncomeForMonth } from './income'

const MONTH_KEY_PATTERN = /^\d{4}-\d{2}$/

export interface CopyMonthPlanOptions {
  includeIncome?: boolean
}

export function isValidMonthKey(monthKey: string): boolean {
  return MONTH_KEY_PATTERN.test(monthKey)
}

export function canCopyMonthPlan(
  state: Pick<BudgetState, 'expensesByMonth'>,
  sourceMonthKey: string,
): boolean {
  if (!isValidMonthKey(sourceMonthKey)) return false
  return (state.expensesByMonth[sourceMonthKey]?.length ?? 0) > 0
}

export function copyMonthPlan(
  state: BudgetState,
  sourceMonthKey: string,
  targetMonthKey: string,
  options: CopyMonthPlanOptions = {},
): BudgetState | null {
  if (!isValidMonthKey(sourceMonthKey) || !isValidMonthKey(targetMonthKey)) {
    return null
  }
  if (sourceMonthKey === targetMonthKey) return null

  const sourceExpenses = state.expensesByMonth[sourceMonthKey]
  if (!sourceExpenses?.length) return null

  const includeIncome = options.includeIncome ?? true
  const next: BudgetState = {
    ...state,
    expensesByMonth: {
      ...state.expensesByMonth,
      [targetMonthKey]: cloneExpenses(sourceExpenses),
    },
  }

  if (includeIncome) {
    next.incomeByMonth = {
      ...(state.incomeByMonth ?? {}),
      [targetMonthKey]: getIncomeForMonth(state, sourceMonthKey),
    }
  }

  return next
}
