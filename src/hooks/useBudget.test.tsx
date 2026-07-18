import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useBudget } from './useBudget'
import { loadBudget } from '../utils/storage'
import { getIncomeForMonth } from '../utils/income'

describe('useBudget', () => {
  it('loads default state from localStorage', () => {
    const { result } = renderHook(() => useBudget())
    expect(Object.values(result.current.state.expensesByMonth).flat().length).toBeGreaterThan(0)
  })

  it('adds and removes actual transaction', () => {
    const { result } = renderHook(() => useBudget())

    act(() => {
      result.current.addTransaction({
        name: 'Такси',
        amount: 600,
        date: '2026-07-18',
        category: 'transport',
        bucket: 'need',
      })
    })

    expect(result.current.state.transactions).toHaveLength(1)
    expect(result.current.monthTransactions).toHaveLength(1)

    const id = result.current.state.transactions[0].id
    act(() => {
      result.current.removeTransaction(id)
    })

    expect(result.current.state.transactions).toHaveLength(0)
  })

  it('updates planned expense and income', () => {
    const { result } = renderHook(() => useBudget())
    const expenseId = result.current.monthExpenses[0].id

    act(() => {
      result.current.setIncome(150000)
      result.current.updateExpense(expenseId, { amount: 25000 })
    })

    expect(getIncomeForMonth(result.current.state, result.current.monthKey)).toBe(150000)
    expect(result.current.monthExpenses[0].amount).toBe(25000)
    expect(result.current.summary.totalExpenses).toBeGreaterThan(0)
  })

  it('filters transactions by selected month', () => {
    const { result } = renderHook(() => useBudget())

    act(() => {
      result.current.addTransaction({
        name: 'Июль',
        amount: 100,
        date: '2026-07-10',
        category: 'food',
        bucket: 'need',
      })
      result.current.addTransaction({
        name: 'Август',
        amount: 200,
        date: '2026-08-03',
        category: 'food',
        bucket: 'need',
      })
      result.current.setMonthKey('2026-08')
    })

    expect(result.current.monthTransactions).toHaveLength(1)
    expect(result.current.monthTransactions[0].name).toBe('Август')
  })

  it('keeps separate expense plans per month', () => {
    const { result } = renderHook(() => useBudget())

    act(() => {
      result.current.setMonthKey('2026-07')
    })

    const julyExpenseId = result.current.monthExpenses[0]?.id
    expect(julyExpenseId).toBeTruthy()

    act(() => {
      result.current.updateExpense(julyExpenseId, { amount: 111 })
      result.current.setMonthKey('2026-08')
    })

    const augustExpenseId = result.current.monthExpenses[0]?.id
    expect(augustExpenseId).toBeTruthy()

    act(() => {
      result.current.updateExpense(augustExpenseId, { amount: 222 })
      result.current.setMonthKey('2026-07')
    })

    expect(result.current.monthExpenses[0]?.amount).toBe(111)

    act(() => {
      result.current.setMonthKey('2026-08')
    })

    expect(result.current.monthExpenses[0]?.amount).toBe(222)
  })

  it('persists state to localStorage and syncs URL', async () => {
    vi.useFakeTimers()
    const replaceState = vi.spyOn(window.history, 'replaceState')

    const { result } = renderHook(() => useBudget())

    act(() => {
      result.current.setIncome(90000)
    })

    await act(async () => {
      vi.advanceTimersByTime(350)
    })

    const saved = loadBudget()
    expect(getIncomeForMonth(saved, result.current.monthKey)).toBe(90000)
    expect(replaceState).toHaveBeenCalled()
  })
})
