import { describe, expect, it } from 'vitest'
import { formatDate, formatMoney, formatPercent, formatCompactMoney, parseCompactMoney } from './format'

describe('format utils', () => {
  it('formatMoney formats rubles without decimals', () => {
    expect(formatMoney(100000)).toMatch(/100/)
    expect(formatMoney(100000)).toMatch(/₽|RUB/)
  })

  it('formatPercent converts 0-100 to percent string', () => {
    expect(formatPercent(20)).toMatch(/20/)
  })

  it('formatDate returns dash for empty value', () => {
    expect(formatDate('')).toBe('—')
  })

  it('formatDate formats valid ISO date', () => {
    expect(formatDate('2026-07-18')).toContain('2026')
  })

  it('formatCompactMoney shortens thousands and millions', () => {
    expect(formatCompactMoney(100000)).toBe('100к')
    expect(formatCompactMoney(1500)).toBe('1,5к')
    expect(formatCompactMoney(500)).toBe('500')
    expect(formatCompactMoney(1_500_000)).toBe('1,5м')
  })

  it('parseCompactMoney reads compact and plain values', () => {
    expect(parseCompactMoney('100к')).toBe(100000)
    expect(parseCompactMoney('1,5к')).toBe(1500)
    expect(parseCompactMoney('2м')).toBe(2_000_000)
    expect(parseCompactMoney('20000')).toBe(20000)
  })
})
