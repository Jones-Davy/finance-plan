import { useEffect, useId, useRef, useState } from 'react'
import {
  buildCalendarDays,
  capitalizeRu,
  formatRuDate,
  formatRuMonth,
  getRuWeekdayLabels,
  getTodayISO,
  isISOInRange,
  parseISOMonth,
  parseRuDate,
  toISOMonth,
} from '../utils/dates'

interface Props {
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  className?: string
  placeholder?: string
  id?: string
}

export function RussianDateInput({
  value,
  onChange,
  min,
  max,
  className,
  placeholder = 'ДД.ММ.ГГГГ',
  id,
}: Props) {
  const fallbackId = useId()
  const inputId = id ?? fallbackId
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [focused, setFocused] = useState(false)

  const effectiveValue =
    value ||
    (min && max && isISOInRange(getTodayISO(), min, max)
      ? getTodayISO()
      : !min && !max
        ? getTodayISO()
        : '')

  const visibleMonth = effectiveValue
    ? parseISOMonth(effectiveValue.slice(0, 7))
    : parseISOMonth(getTodayISO().slice(0, 7))

  const [viewYear, setViewYear] = useState(visibleMonth.year)
  const [viewMonth, setViewMonth] = useState(visibleMonth.month)

  useEffect(() => {
    if (!effectiveValue) {
      const today = parseISOMonth(getTodayISO().slice(0, 7))
      setViewYear(today.year)
      setViewMonth(today.month)
      return
    }

    const { year, month } = parseISOMonth(effectiveValue.slice(0, 7))
    setViewYear(year)
    setViewMonth(month)
  }, [effectiveValue])

  useEffect(() => {
    if (value || !effectiveValue) return
    onChange(effectiveValue)
  }, [value, effectiveValue, onChange])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      const root = rootRef.current
      if (!root || root.contains(event.target as Node)) return
      setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  const displayValue = focused ? draft : formatRuDate(effectiveValue)
  const weekdays = getRuWeekdayLabels()
  const days = buildCalendarDays(viewYear, viewMonth)

  const selectDate = (iso: string) => {
    if (!isISOInRange(iso, min, max)) return
    onChange(iso)
    setDraft(formatRuDate(iso))
    setOpen(false)
    setFocused(false)
  }

  const shiftMonth = (delta: number) => {
    const date = new Date(viewYear, viewMonth - 1 + delta, 1)
    setViewYear(date.getFullYear())
    setViewMonth(date.getMonth() + 1)
  }

  const syncCalendarView = () => {
    const month = effectiveValue
      ? parseISOMonth(effectiveValue.slice(0, 7))
      : parseISOMonth(getTodayISO().slice(0, 7))
    setViewYear(month.year)
    setViewMonth(month.month)
  }

  const toggleCalendar = () => {
    if (!open) syncCalendarView()
    setOpen((current) => !current)
  }

  return (
    <div className={`ru-date-field ${className ?? ''}`.trim()} ref={rootRef}>
      <input
        id={inputId}
        className="ru-date-field__input"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={displayValue}
        onFocus={() => {
          setFocused(true)
          setDraft(formatRuDate(effectiveValue))
        }}
        onChange={(event) => {
          const next = event.target.value
          setDraft(next)
          const parsed = parseRuDate(next)
          if (parsed && isISOInRange(parsed, min, max)) {
            onChange(parsed)
          }
        }}
        onBlur={() => {
          setFocused(false)
          const parsed = parseRuDate(draft)
          if (parsed && isISOInRange(parsed, min, max)) {
            onChange(parsed)
          }
          setDraft('')
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur()
          }
        }}
      />
      <button
        type="button"
        className="ru-date-field__trigger"
        aria-label="Открыть календарь"
        aria-expanded={open}
        aria-controls={`${inputId}-calendar`}
        onClick={toggleCalendar}
      >
        <span className="ru-date-field__icon" aria-hidden="true" />
      </button>

      {open && (
        <div className="ru-date-field__popover card" id={`${inputId}-calendar`} role="dialog">
          <div className="ru-calendar__nav">
            <button type="button" className="btn btn--icon" aria-label="Предыдущий месяц" onClick={() => shiftMonth(-1)}>
              ‹
            </button>
            <strong>{capitalizeRu(formatRuMonth(toISOMonth(viewYear, viewMonth)))}</strong>
            <button type="button" className="btn btn--icon" aria-label="Следующий месяц" onClick={() => shiftMonth(1)}>
              ›
            </button>
          </div>

          <div className="ru-calendar__weekdays">
            {weekdays.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="ru-calendar__days">
            {days.map((day) => {
              const disabled = !isISOInRange(day.iso, min, max)
              const selected = effectiveValue === day.iso
              return (
                <button
                  key={`${day.iso}-${day.inMonth ? 'in' : 'out'}`}
                  type="button"
                  className={[
                    'ru-calendar__day',
                    !day.inMonth && 'ru-calendar__day--muted',
                    selected && 'ru-calendar__day--selected',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  disabled={disabled}
                  onClick={() => selectDate(day.iso)}
                >
                  {day.day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
