import { describe, expect, it } from 'vitest'
import { createExpense, createTransaction } from '../test/fixtures'
import {
  cloneExpenses,
  collectMonthKeys,
  ensureMonthExpenses,
  getExpensesForMonth,
  migrateExpensesByMonth,
  resolveSourceMonthKey,
} from './expenses'

describe('expenses utils', () => {
  it('migrateExpensesByMonth supports legacy expenses array', () => {
    const migrated = migrateExpensesByMonth(
      { expenses: [createExpense()] },
      '2026-07',
    )

    expect(migrated['2026-07']).toHaveLength(1)
  })

  it('collectMonthKeys merges plans, transactions and active month', () => {
    const keys = collectMonthKeys(
      { '2026-07': [createExpense()] },
      [createTransaction({ date: '2026-08-02' })],
      '2026-06',
    )

    expect(keys).toEqual(expect.arrayContaining(['2026-06', '2026-07', '2026-08']))
    expect(keys).toEqual([...keys].sort())
  })

  it('ensureMonthExpenses creates fresh default plan for new month', () => {
    const base = {
      '2026-07': [createExpense({ amount: 1000 })],
    }

    const next = ensureMonthExpenses(base, '2026-08')
    expect(getExpensesForMonth(next, '2026-08')).toHaveLength(8)
    expect(getExpensesForMonth(next, '2026-08')[0].amount).toBe(0)
    expect(getExpensesForMonth(next, '2026-08')[0].id).not.toBe(base['2026-07'][0].id)
  })

  it('resolveSourceMonthKey prefers latest month before target', () => {
    const map = {
      '2026-05': [createExpense()],
      '2026-07': [createExpense({ id: 'exp-2' })],
    }

    expect(resolveSourceMonthKey(map, '2026-08')).toBe('2026-07')
    expect(resolveSourceMonthKey(map, '2026-06')).toBe('2026-05')
  })

  it('cloneExpenses creates new ids', () => {
    const source = [createExpense({ id: 'same' })]
    const cloned = cloneExpenses(source)

    expect(cloned[0].amount).toBe(source[0].amount)
    expect(cloned[0].id).not.toBe('same')
  })
})
