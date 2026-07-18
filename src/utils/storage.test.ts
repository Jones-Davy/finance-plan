import { describe, expect, it, vi } from 'vitest'
import { createDefaultState, loadBudget, loadViewMonthKey, saveBudget, saveViewMonthKey } from './storage'
import { createBudgetState } from '../test/fixtures'

describe('storage utils', () => {
  it('createDefaultState returns template expenses and empty collections', () => {
    const state = createDefaultState()
    expect(state.monthlyIncome).toBe(0)
    expect(Object.values(state.expensesByMonth).flat().length).toBeGreaterThan(0)
    expect(state.goals).toEqual([])
    expect(state.transactions).toEqual([])
  })

  it('saveBudget and loadBudget persist state in localStorage', () => {
    const state = createBudgetState()
    saveBudget(state)

    const loaded = loadBudget()
    expect(loaded.monthlyIncome).toBe(100000)
    expect(loaded.transactions).toHaveLength(3)
    expect(loaded.goals).toHaveLength(1)
  })

  it('loadBudget returns default state for invalid JSON', () => {
    localStorage.setItem('finance-budget-v1', '{broken')
    const loaded = loadBudget()
    expect(loaded.expensesByMonth['2026-07']?.length ?? Object.values(loaded.expensesByMonth)[0]?.length).toBeGreaterThan(0)
    expect(loaded.transactions).toEqual([])
  })

  it('loadViewMonthKey returns current month on first visit', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 18))

    expect(loadViewMonthKey()).toBe('2026-07')

    vi.useRealTimers()
  })

  it('loadViewMonthKey resets to current month on new calendar month', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 30))
    saveViewMonthKey('2026-06')
    localStorage.setItem('finance-budget-last-visit', '2026-06-30')

    vi.setSystemTime(new Date(2026, 6, 1))
    expect(loadViewMonthKey()).toBe('2026-07')

    vi.useRealTimers()
  })

  it('loadViewMonthKey keeps selected month during same calendar month', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 10))
    saveViewMonthKey('2026-06')
    localStorage.setItem('finance-budget-last-visit', '2026-07-10')

    expect(loadViewMonthKey()).toBe('2026-06')

    vi.useRealTimers()
  })
})
