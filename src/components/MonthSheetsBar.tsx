import { useEffect, useId, useRef, useState } from 'react'
import { formatSheetLabel } from '../utils/dates'
import { RussianMonthInput } from './RussianMonthInput'

interface Props {
  monthKeys: string[]
  value: string
  onChange: (monthKey: string) => void
}

export function MonthSheetsBar({ monthKeys, value, onChange }: Props) {
  const addId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)
  const [addOpen, setAddOpen] = useState(false)

  useEffect(() => {
    activeRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [value])

  useEffect(() => {
    if (!addOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const root = rootRef.current
      if (!root || root.contains(event.target as Node)) return
      setAddOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [addOpen])

  return (
    <div className="month-sheets" ref={rootRef} role="tablist" aria-label="Листы по месяцам">
      <div className="month-sheets__tabs">
        {monthKeys.map((monthKey) => {
          const active = monthKey === value
          return (
            <button
              key={monthKey}
              ref={active ? activeRef : undefined}
              type="button"
              role="tab"
              aria-selected={active}
              className={['month-sheets__tab', active && 'month-sheets__tab--active']
                .filter(Boolean)
                .join(' ')}
              onClick={() => onChange(monthKey)}
            >
              {formatSheetLabel(monthKey)}
            </button>
          )
        })}
      </div>

      <div className="month-sheets__add">
        <button
          type="button"
          className="month-sheets__tab month-sheets__tab--add"
          aria-expanded={addOpen}
          aria-controls={`${addId}-picker`}
          aria-label="Добавить лист месяца"
          onClick={() => setAddOpen((current) => !current)}
        >
          +
        </button>

        {addOpen && (
          <div className="month-sheets__popover card" id={`${addId}-picker`} role="dialog">
            <p className="month-sheets__popover-title">Новый лист</p>
            <RussianMonthInput
              value={value}
              popoverLayout="inline"
              defaultOpen
              onChange={(monthKey) => {
                onChange(monthKey)
                setAddOpen(false)
              }}
              className="month-sheets__picker"
            />
          </div>
        )}
      </div>
    </div>
  )
}
