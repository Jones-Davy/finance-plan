import { describe, expect, it, vi } from 'vitest'
import {
  buildBudgetSummary,
  buildPlanVsActual,
  buildRule503020,
  calcGoalsMonthlyNeed,
  defaultDateForMonth,
  filterTransactionsByMonth,
  formatMonthLabel,
  getMonthKey,
  goalProgress,
  groupByCategory,
  isDateInMonth,
  lastDayOfMonth,
  sumEssential,
  sumExpenses,
  sumTransactions,
} from './calculations'
import { getIncomeForMonth } from './income'
import { createBudgetState, createExpense, createGoal, createTransaction } from '../test/fixtures'

describe('calculations: dates', () => {
  it('getMonthKey returns YYYY-MM', () => {
    expect(getMonthKey(new Date(2026, 6, 18))).toBe('2026-07')
  })

  it('defaultDateForMonth uses today for current month', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 18))

    expect(defaultDateForMonth('2026-07')).toBe('2026-07-18')
    expect(defaultDateForMonth('2026-08')).toBe('2026-08-01')
    expect(defaultDateForMonth('2026-06')).toBe('2026-06-30')

    vi.useRealTimers()
  })

  it('isDateInMonth checks month prefix', () => {
    expect(isDateInMonth('2026-07-18', '2026-07')).toBe(true)
    expect(isDateInMonth('2026-08-01', '2026-07')).toBe(false)
  })

  it('lastDayOfMonth handles different month lengths', () => {
    expect(lastDayOfMonth('2026-02')).toBe('2026-02-28')
    expect(lastDayOfMonth('2026-07')).toBe('2026-07-31')
  })

  it('formatMonthLabel returns localized month name', () => {
    expect(formatMonthLabel('2026-07')).toContain('2026')
  })
})

describe('calculations: expenses', () => {
  it('sumExpenses totals planned amounts', () => {
    const state = createBudgetState()
    expect(sumExpenses(state.expensesByMonth['2026-07'] ?? [])).toBe(20000)
  })

  it('sumEssential counts only essential items', () => {
    const state = createBudgetState()
    expect(sumEssential(state.expensesByMonth['2026-07'] ?? [])).toBe(15000)
  })

  it('groupByCategory aggregates and sorts by amount', () => {
    const grouped = groupByCategory(createBudgetState().expensesByMonth['2026-07'] ?? [])
    expect(grouped[0].category).toBe('food')
    expect(grouped[0].amount).toBe(15000)
  })
})

describe('calculations: transactions', () => {
  it('filterTransactionsByMonth keeps only selected month', () => {
    const state = createBudgetState()
    const july = filterTransactionsByMonth(state.transactions, '2026-07')
    expect(july).toHaveLength(2)
    expect(sumTransactions(july)).toBe(900)
  })

  it('buildPlanVsActual compares categories', () => {
    const state = createBudgetState()
    const rows = buildPlanVsActual(state.expensesByMonth['2026-07'] ?? [], filterTransactionsByMonth(state.transactions, '2026-07'))
    const food = rows.find((row) => row.category === 'food')

    expect(food?.planned).toBe(15000)
    expect(food?.actual).toBe(100)
    expect(food?.diff).toBe(14900)
  })

  it('buildPlanVsActual puts savings bucket into savings row, not category', () => {
    const transactions = [
      createTransaction({ category: 'food', bucket: 'need', amount: 100 }),
      createTransaction({ id: 'tx-savings', category: 'food', bucket: 'savings', amount: 500 }),
    ]
    const rows = buildPlanVsActual([], transactions)
    const food = rows.find((row) => row.category === 'food')
    const savings = rows.find((row) => row.category === 'savings')

    expect(food?.actual).toBe(100)
    expect(savings?.actual).toBe(500)
  })

  it('buildPlanVsActual treats savings above plan as positive diff', () => {
    const rows = buildPlanVsActual(
      [createExpense({ category: 'savings', amount: 100 })],
      [createTransaction({ category: 'other', bucket: 'savings', amount: 200 })],
    )
    const savings = rows.find((row) => row.category === 'savings')

    expect(savings?.planned).toBe(100)
    expect(savings?.actual).toBe(200)
    expect(savings?.diff).toBe(100)
  })
})

describe('calculations: budget summary', () => {
  it('buildBudgetSummary calculates plan and fact for month', () => {
    const summary = buildBudgetSummary(createBudgetState(), '2026-07')

    expect(summary.totalExpenses).toBe(20000)
    expect(summary.actualTotal).toBe(900)
    expect(summary.remaining).toBe(80000)
    expect(summary.actualRemaining).toBe(99100)
    expect(summary.weeklyBudget).toBeCloseTo(20000 / 4.33, 2)
  })

  it('buildRule503020 splits income into 50/30/20 targets', () => {
    const state = createBudgetState()
    const rules = buildRule503020(
      getIncomeForMonth(state, '2026-07'),
      filterTransactionsByMonth(state.transactions, '2026-07'),
    )

    expect(rules[0].targetAmount).toBe(50000)
    expect(rules[1].targetAmount).toBe(30000)
    expect(rules[2].targetAmount).toBe(20000)
    expect(rules[0].actualAmount).toBe(100)
    expect(rules[1].actualAmount).toBe(800)
  })
})

describe('calculations: goals', () => {
  it('calcGoalsMonthlyNeed estimates monthly savings', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 18))

    const need = calcGoalsMonthlyNeed([createGoal()])
    expect(need).toBeGreaterThan(0)
  })

  it('goalProgress caps at 100%', () => {
    expect(goalProgress(createGoal({ savedAmount: 200000, targetAmount: 100000 }))).toBe(100)
    expect(goalProgress(createGoal({ savedAmount: 25000, targetAmount: 100000 }))).toBe(25)
  })
})
