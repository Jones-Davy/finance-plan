import { describe, expect, it, vi } from 'vitest'
import {
  buildCalendarDays,
  defaultGoalDeadline,
  formatRuDate,
  formatRuLongDate,
  formatRuMonth,
  formatRuMonthInput,
  formatRuShortDate,
  formatSheetLabel,
  getTodayISO,
  getMonthKey,
  parseRuDate,
  parseRuMonthInput,
} from './dates'

describe('dates utils', () => {
  it('getTodayISO returns local today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 18))

    expect(getTodayISO()).toBe('2026-07-18')
    expect(getMonthKey()).toBe('2026-07')

    vi.useRealTimers()
  })

  it('defaultGoalDeadline adds six months in local time', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 18))

    expect(defaultGoalDeadline()).toBe('2027-01-18')

    vi.useRealTimers()
  })

  it('formatRuDate and parseRuDate roundtrip', () => {
    expect(formatRuDate('2026-07-18')).toBe('18.07.2026')
    expect(parseRuDate('18.07.2026')).toBe('2026-07-18')
    expect(parseRuDate('18/07/2026')).toBe('2026-07-18')
  })

  it('formatRuMonthInput and parseRuMonthInput roundtrip', () => {
    expect(formatRuMonthInput('2026-07')).toBe('07.2026')
    expect(parseRuMonthInput('07.2026')).toBe('2026-07')
    expect(parseRuMonthInput('июль 2026')).toBe('2026-07')
  })

  it('formatSheetLabel returns short tab label', () => {
    expect(formatSheetLabel('2026-07')).toBe('07.26')
    expect(formatSheetLabel('2026-12')).toBe('12.26')
  })

  it('formatRuMonth returns localized month label', () => {
    expect(formatRuMonth('2026-07')).toMatch(/2026/)
    expect(formatRuMonth('2026-07')).toMatch(/июл/i)
  })

  it('formatRuShortDate and formatRuLongDate use Russian locale', () => {
    expect(formatRuShortDate('2026-07-18')).toMatch(/18/)
    expect(formatRuLongDate('2026-07-18')).toMatch(/2026/)
  })

  it('buildCalendarDays returns full weeks', () => {
    const days = buildCalendarDays(2026, 7)
    expect(days.length % 7).toBe(0)
    expect(days.some((day) => day.inMonth && day.iso === '2026-07-18')).toBe(true)
  })
})
