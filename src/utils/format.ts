import { formatRuLongDate } from './dates'

export function formatMoney(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatCompactUnit(value: number): string {
  if (value >= 100) return String(Math.round(value))
  const rounded = Math.round(value * 10) / 10
  if (Number.isInteger(rounded)) return String(rounded)
  return rounded.toFixed(1).replace('.', ',')
}

/** Короткий формат для узких полей: 100000 → «100к», 1500 → «1,5к» */
export function formatCompactMoney(value: number): string {
  if (!Number.isFinite(value) || value === 0) return ''

  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (abs >= 1_000_000) {
    return `${sign}${formatCompactUnit(abs / 1_000_000)}м`
  }
  if (abs >= 1_000) {
    return `${sign}${formatCompactUnit(abs / 1_000)}к`
  }

  return String(Math.round(value))
}

/** Парсит «100к», «1,5к», «2м» и обычные числа */
export function parseCompactMoney(input: string): number {
  const trimmed = input.trim().replace(/\s/g, '').replace(',', '.')
  if (!trimmed) return 0

  const match = trimmed.match(/^(-?\d+(?:\.\d+)?)([кkmм])?$/i)
  if (!match) {
    const digits = trimmed.replace(/[^\d.-]/g, '')
    const num = Number(digits)
    return Number.isFinite(num) ? Math.max(0, Math.round(num)) : 0
  }

  let num = Number(match[1])
  const suffix = match[2]?.toLowerCase()
  if (suffix === 'к' || suffix === 'k') num *= 1_000
  if (suffix === 'м' || suffix === 'm') num *= 1_000_000

  return Math.max(0, Math.round(num))
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(value / 100)
}

export function formatDate(dateStr: string): string {
  return formatRuLongDate(dateStr)
}
