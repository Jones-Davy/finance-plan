import { useEffect, useId, useRef, useState } from 'react'
import {
  capitalizeRu,
  formatRuMonthInput,
  getMonthKey,
  getRuMonthShortLabels,
  parseISOMonth,
  parseRuMonthInput,
  toISOMonth,
} from '../utils/dates'

interface Props {
  value: string
  onChange: (value: string) => void
  className?: string
  id?: string
  placeholder?: string
  popoverLayout?: 'dropdown' | 'inline'
  defaultOpen?: boolean
}

export function RussianMonthInput({
  value,
  onChange,
  className,
  id,
  placeholder = 'ММ.ГГГГ',
  popoverLayout = 'dropdown',
  defaultOpen = false,
}: Props) {
  const fallbackId = useId()
  const inputId = id ?? fallbackId
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(defaultOpen)
  const [draft, setDraft] = useState('')
  const [focused, setFocused] = useState(false)
  const effectiveValue = /^\d{4}-\d{2}$/.test(value) ? value : getMonthKey()
  const { year } = parseISOMonth(effectiveValue)
  const [viewYear, setViewYear] = useState(year)
  const monthLabels = getRuMonthShortLabels()
  const currentMonthKey = getMonthKey()
  const inlinePopover = popoverLayout === 'inline'

  useEffect(() => {
    if (/^\d{4}-\d{2}$/.test(value)) return
    onChange(getMonthKey())
  }, [value, onChange])

  useEffect(() => {
    setViewYear(parseISOMonth(effectiveValue).year)
  }, [effectiveValue])

  useEffect(() => {
    if (!open || inlinePopover) return

    const handlePointerDown = (event: MouseEvent) => {
      const root = rootRef.current
      if (!root || root.contains(event.target as Node)) return
      setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open, inlinePopover])

  const displayValue = focused ? draft : formatRuMonthInput(effectiveValue)

  const applyMonth = (isoMonth: string) => {
    onChange(isoMonth)
    setDraft(formatRuMonthInput(isoMonth))
  }

  const togglePicker = () => {
    setViewYear(parseISOMonth(effectiveValue).year)
    setOpen((current) => !current)
  }

  const selectMonth = (nextMonth: number) => {
    applyMonth(toISOMonth(viewYear, nextMonth))
    setOpen(false)
    setFocused(false)
  }

  return (
    <div
      className={[
        'ru-date-field',
        inlinePopover && 'ru-date-field--inline',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      ref={rootRef}
    >
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
          setDraft(formatRuMonthInput(effectiveValue))
        }}
        onChange={(event) => {
          const next = event.target.value
          setDraft(next)
          const parsed = parseRuMonthInput(next)
          if (parsed) applyMonth(parsed)
        }}
        onBlur={() => {
          setFocused(false)
          const parsed = parseRuMonthInput(draft)
          if (parsed) applyMonth(parsed)
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
        aria-label="Открыть выбор месяца"
        aria-expanded={open}
        aria-controls={`${inputId}-month-picker`}
        onClick={togglePicker}
      >
        <span className="ru-date-field__icon" aria-hidden="true" />
      </button>

      {open && (
        <div className="ru-date-field__popover card" id={`${inputId}-month-picker`} role="dialog">
          <div className="ru-calendar__nav">
            <button
              type="button"
              className="btn btn--icon"
              aria-label="Предыдущий год"
              onClick={() => setViewYear((current) => current - 1)}
            >
              ‹
            </button>
            <strong>{viewYear}</strong>
            <button
              type="button"
              className="btn btn--icon"
              aria-label="Следующий год"
              onClick={() => setViewYear((current) => current + 1)}
            >
              ›
            </button>
          </div>

          <div className="ru-month-field__grid">
            {monthLabels.map((label, index) => {
              const monthNumber = index + 1
              const optionKey = toISOMonth(viewYear, monthNumber)
              const selected = optionKey === effectiveValue
              const isCurrent = optionKey === currentMonthKey
              return (
                <button
                  key={label}
                  type="button"
                  className={[
                    'ru-month-field__option',
                    selected && 'ru-month-field__option--selected',
                    isCurrent && 'ru-month-field__option--today',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => selectMonth(monthNumber)}
                >
                  {capitalizeRu(label)}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
