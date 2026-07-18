import { describe, expect, it } from 'vitest'
import { createBudgetState } from '../test/fixtures'
import { getIncomeForMonth, migrateIncomeByMonth } from './income'

describe('income utils', () => {
  it('reads income for specific month', () => {
    const state = createBudgetState({ incomeByMonth: { '2026-07': 120000, '2026-08': 80000 } })
    expect(getIncomeForMonth(state, '2026-07')).toBe(120000)
    expect(getIncomeForMonth(state, '2026-08')).toBe(80000)
  })

  it('migrates legacy monthlyIncome', () => {
    expect(migrateIncomeByMonth({ monthlyIncome: 50000 }, '2026-07')).toEqual({
      '2026-07': 50000,
    })
  })
})
