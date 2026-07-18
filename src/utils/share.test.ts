import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_URL_SHARE_OPTIONS,
  buildSharePayload,
  decodeSharePlan,
  encodeSharePlan,
  readSharePlanFromUrl,
  sharedPlanToState,
  syncSharePlanToUrl,
} from './share'
import { createBudgetState, createTransaction } from '../test/fixtures'

const locationMock = vi.hoisted(() => ({
  href: 'http://localhost:5173/',
  hash: '',
  search: '',
}))

describe('share utils', () => {
  beforeEach(() => {
    locationMock.href = 'http://localhost:5173/'
    locationMock.hash = ''
    locationMock.search = ''
    vi.stubGlobal('location', locationMock)
    vi.stubGlobal('history', { replaceState: vi.fn() })
  })

  it('buildSharePayload includes plan and optional sections', () => {
    const state = createBudgetState()
    const full = buildSharePayload(state, { includeGoals: true, includeTransactions: true })
    const planOnly = buildSharePayload(state, { includeGoals: false, includeTransactions: false })

    expect(full.goals).toHaveLength(1)
    expect(full.transactions).toHaveLength(3)
    expect(planOnly.goals).toBeUndefined()
    expect(planOnly.transactions).toBeUndefined()
  })

  it('encodeSharePlan and decodeSharePlan roundtrip', () => {
    const state = createBudgetState()
    const encoded = encodeSharePlan(state, DEFAULT_URL_SHARE_OPTIONS)
    const decoded = decodeSharePlan(encoded)

    expect(decoded?.monthlyIncome).toBe(100000)
    expect(decoded?.expensesByMonth?.['2026-07']).toHaveLength(2)
    expect(decoded?.transactions).toHaveLength(3)
  })

  it('decodeSharePlan returns null for invalid payload', () => {
    expect(decodeSharePlan('not-valid')).toBeNull()
  })

  it('readSharePlanFromUrl reads hash payload', () => {
    const encoded = encodeSharePlan(createBudgetState())
    locationMock.hash = `#p=${encoded}`

    expect(readSharePlanFromUrl()?.monthlyIncome).toBe(100000)
  })

  it('sharedPlanToState prefers URL transactions over local', () => {
    const payload = buildSharePayload(createBudgetState(), { includeTransactions: true })
    const localTx = [createTransaction({ id: 'local', name: 'Local' })]

    const state = sharedPlanToState(payload, localTx)
    expect(state.transactions).toHaveLength(3)
  })

  it('sharedPlanToState falls back to local transactions', () => {
    const payload = buildSharePayload(createBudgetState(), { includeTransactions: false })
    const localTx = [createTransaction({ id: 'local', name: 'Local' })]

    const state = sharedPlanToState(payload, localTx)
    expect(state.transactions).toEqual(localTx)
  })

  it('syncSharePlanToUrl updates hash via history.replaceState', () => {
    syncSharePlanToUrl(createBudgetState())
    expect(history.replaceState).toHaveBeenCalledWith(null, '', expect.stringContaining('#p='))
  })

  it('syncSharePlanToUrl skips update when hash unchanged', () => {
    const state = createBudgetState()
    locationMock.hash = `#p=${encodeSharePlan(state, DEFAULT_URL_SHARE_OPTIONS)}`

    syncSharePlanToUrl(state)
    expect(history.replaceState).not.toHaveBeenCalled()
  })
})
