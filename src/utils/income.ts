import type { BudgetState } from '../types'

export function getIncomeForMonth(state: BudgetState, monthKey: string): number {
  const fromMonth = state.incomeByMonth?.[monthKey]
  if (typeof fromMonth === 'number') return fromMonth
  return state.monthlyIncome ?? 0
}

export function migrateIncomeByMonth(
  parsed: Partial<BudgetState>,
  fallbackMonthKey: string,
): Record<string, number> {
  if (parsed.incomeByMonth && Object.keys(parsed.incomeByMonth).length > 0) {
    return parsed.incomeByMonth
  }

  if (typeof parsed.monthlyIncome === 'number') {
    return { [fallbackMonthKey]: parsed.monthlyIncome }
  }

  return {}
}
