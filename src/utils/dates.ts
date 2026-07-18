const RU_LOCALE = 'ru-RU'

export function getTodayISO(date = new Date()): string {
  return toISODate(date)
}

export function getMonthKey(date = new Date()): string {
  return getTodayISO(date).slice(0, 7)
}

/** 2026-07 → «07.26» для вкладки-листа */
export function formatSheetLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  return `${month}.${year.slice(-2)}`
}

export function defaultGoalDeadline(from = new Date()): string {
  const date = new Date(from.getFullYear(), from.getMonth() + 6, from.getDate())
  return toISODate(date)
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function toISOMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function parseISOMonth(isoMonth: string): { year: number; month: number } {
  const [year, month] = isoMonth.split('-').map(Number)
  return { year, month }
}

/** 2026-07-18 → 18.07.2026 */
export function formatRuDate(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ''
  const [year, month, day] = iso.split('-')
  return `${day}.${month}.${year}`
}

/** 18.07.2026 → 2026-07-18 */
export function parseRuDate(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)
  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return null

  const iso = toISODate(new Date(year, month - 1, day))
  const parsed = parseISODate(iso)
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null
  }

  return iso
}

/** 2026-07 → «июль 2026 г.» */
export function formatRuMonth(isoMonth: string): string {
  const { year, month } = parseISOMonth(isoMonth)
  return new Intl.DateTimeFormat(RU_LOCALE, { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1),
  )
}

/** 2026-07 → 07.2026 */
export function formatRuMonthInput(isoMonth: string): string {
  if (!isoMonth || !/^\d{4}-\d{2}$/.test(isoMonth)) return ''
  const [year, month] = isoMonth.split('-')
  return `${month}.${year}`
}

/** 07.2026, 7/2026, «июль 2026» → 2026-07 */
export function parseRuMonthInput(value: string): string | null {
  const trimmed = value.trim().toLowerCase().replace(/\s*г\.?\s*$/, '')
  if (!trimmed) return null

  const numeric = trimmed.match(/^(\d{1,2})[./-](\d{4})$/)
  if (numeric) {
    const month = Number(numeric[1])
    const year = Number(numeric[2])
    if (month >= 1 && month <= 12) return toISOMonth(year, month)
  }

  const monthLabels = getRuMonthLabels()
  for (let index = 0; index < monthLabels.length; index += 1) {
    const label = monthLabels[index].toLowerCase()
    if (trimmed.startsWith(label)) {
      const yearMatch = trimmed.match(/(\d{4})/)
      if (yearMatch) return toISOMonth(Number(yearMatch[1]), index + 1)
    }
  }

  return null
}

/** 2026-07-18 → «18 июл.» */
export function formatRuShortDate(iso: string): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(RU_LOCALE, {
    day: 'numeric',
    month: 'short',
  }).format(parseISODate(iso))
}

/** 2026-07-18 → «18 июля 2026 г.» */
export function formatRuLongDate(iso: string): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(RU_LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parseISODate(iso))
}

export function getRuWeekdayLabels(): string[] {
  const formatter = new Intl.DateTimeFormat(RU_LOCALE, { weekday: 'short' })
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(2024, 0, 1 + index)
    return formatter.format(date).replace('.', '')
  })
}

export function getRuMonthLabels(): string[] {
  return Array.from({ length: 12 }, (_, index) =>
    new Intl.DateTimeFormat(RU_LOCALE, { month: 'long' }).format(new Date(2024, index, 1)),
  )
}

export function getRuMonthShortLabels(): string[] {
  return Array.from({ length: 12 }, (_, index) =>
    new Intl.DateTimeFormat(RU_LOCALE, { month: 'short' })
      .format(new Date(2024, index, 1))
      .replace(/\.$/, ''),
  )
}

export function capitalizeRu(value: string): string {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function isISOInRange(date: string, min?: string, max?: string): boolean {
  if (min && date < min) return false
  if (max && date > max) return false
  return true
}

export interface CalendarDay {
  iso: string
  day: number
  inMonth: boolean
}

export function buildCalendarDays(year: number, month: number): CalendarDay[] {
  const startOffset = (new Date(year, month - 1, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month, 0).getDate()
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate()
  const days: CalendarDay[] = []

  for (let index = startOffset - 1; index >= 0; index -= 1) {
    const day = daysInPrevMonth - index
    const date = new Date(year, month - 2, day)
    days.push({ iso: toISODate(date), day, inMonth: false })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({ iso: toISODate(new Date(year, month - 1, day)), day, inMonth: true })
  }

  let day = 1
  while (days.length % 7 !== 0) {
    days.push({ iso: toISODate(new Date(year, month, day)), day, inMonth: false })
    day += 1
  }

  return days
}
