import { describe, expect, it } from 'vitest'
import { createBudgetState, createExpense } from '../test/fixtures'
import { canCopyMonthPlan, copyMonthPlan } from './monthPlan'

describe('monthPlan', () => {
  it('copies expenses and income to another month', () => {
    const state = createBudgetState({
      incomeByMonth: { '2026-07': 100000, '2026-08': 50000 },
      expensesByMonth: {
        '2026-07': [createExpense({ amount: 15000 })],
        '2026-08': [createExpense({ id: 'exp-aug', amount: 1 })],
      },
    })

    const next = copyMonthPlan(state, '2026-07', '2026-08')
    expect(next?.expensesByMonth['2026-08'][0].amount).toBe(15000)
    expect(next?.expensesByMonth['2026-08'][0].id).not.toBe(state.expensesByMonth['2026-07'][0].id)
    expect(next?.incomeByMonth?.['2026-08']).toBe(100000)
  })

  it('can skip income copy', () => {
    const state = createBudgetState({
      incomeByMonth: { '2026-07': 100000, '2026-08': 50000 },
      expensesByMonth: {
        '2026-07': [createExpense()],
        '2026-08': [createExpense({ id: 'exp-aug' })],
      },
    })

    const next = copyMonthPlan(state, '2026-07', '2026-08', { includeIncome: false })
    expect(next?.incomeByMonth?.['2026-08']).toBe(50000)
  })

  it('returns null for same month or empty source', () => {
    const state = createBudgetState()
    expect(copyMonthPlan(state, '2026-07', '2026-07')).toBeNull()
    expect(copyMonthPlan(state, '2026-09', '2026-08')).toBeNull()
    expect(canCopyMonthPlan(state, '2026-09')).toBe(false)
  })
})
