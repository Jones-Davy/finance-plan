import { useEffect, useId, useRef, useState } from 'react'
import { formatMonthLabel } from '../utils/calculations'
import { formatSheetLabel } from '../utils/dates'
import type { CopyMonthPlanOptions } from '../utils/monthPlan'
import { RussianMonthInput } from './RussianMonthInput'

interface Props {
  monthKeys: string[]
  value: string
  onChange: (monthKey: string) => void
  onCopyPlan?: (
    sourceMonthKey: string,
    targetMonthKey: string,
    options?: CopyMonthPlanOptions,
  ) => boolean
}

function pickDefaultSourceMonth(monthKeys: string[], targetMonthKey: string): string {
  const index = monthKeys.indexOf(targetMonthKey)
  if (index > 0) return monthKeys[index - 1]

  return monthKeys.find((monthKey) => monthKey !== targetMonthKey) ?? targetMonthKey
}

export function MonthSheetsBar({ monthKeys, value, onChange, onCopyPlan }: Props) {
  const addId = useId()
  const copyId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [copyOpen, setCopyOpen] = useState(false)
  const [sourceMonth, setSourceMonth] = useState(value)
  const [targetMonth, setTargetMonth] = useState(value)
  const [includeIncome, setIncludeIncome] = useState(true)
  const [copyError, setCopyError] = useState('')

  useEffect(() => {
    activeRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [value])

  useEffect(() => {
    if (!addOpen && !copyOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const root = rootRef.current
      if (!root || root.contains(event.target as Node)) return
      setAddOpen(false)
      setCopyOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [addOpen, copyOpen])

  useEffect(() => {
    if (!copyOpen) return
    setCopyError('')
    setTargetMonth(value)
    setSourceMonth(pickDefaultSourceMonth(monthKeys, value))
    setIncludeIncome(true)
  }, [copyOpen, value, monthKeys])

  const handleCopyPlan = () => {
    setCopyError('')

    if (sourceMonth === targetMonth) {
      setCopyError('Выберите разные месяцы')
      return
    }

    if (
      !confirm(
        `Перезаписать план ${formatMonthLabel(targetMonth)} данными из ${formatMonthLabel(sourceMonth)}?`,
      )
    ) {
      return
    }

    const copied = onCopyPlan?.(sourceMonth, targetMonth, { includeIncome })
    if (!copied) {
      setCopyError('Не удалось скопировать — проверьте исходный месяц')
      return
    }

    setCopyOpen(false)
  }

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

      <div className="month-sheets__actions">
        {onCopyPlan && (
          <div className="month-sheets__copy">
            <button
              type="button"
              className="month-sheets__tab month-sheets__tab--utility"
              aria-expanded={copyOpen}
              aria-controls={`${copyId}-popover`}
              aria-label="Скопировать план месяца"
              title="Скопировать план"
              onClick={() => {
                setAddOpen(false)
                setCopyOpen((current) => !current)
              }}
            >
              ⧉
            </button>

            {copyOpen && (
              <div className="month-sheets__popover card" id={`${copyId}-popover`} role="dialog">
                <p className="month-sheets__popover-title">Копировать план</p>
                <p className="month-sheets__popover-text">
                  Статьи расходов и, при необходимости, доход будут перезаписаны в целевом месяце.
                </p>

                <label className="field month-sheets__field">
                  <span className="field__label">Из месяца</span>
                  <select
                    value={sourceMonth}
                    onChange={(event) => setSourceMonth(event.target.value)}
                  >
                    {monthKeys.map((monthKey) => (
                      <option key={monthKey} value={monthKey}>
                        {formatMonthLabel(monthKey)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field month-sheets__field">
                  <span className="field__label">В месяц</span>
                  <RussianMonthInput
                    value={targetMonth}
                    popoverLayout="inline"
                    onChange={setTargetMonth}
                    className="month-sheets__picker"
                  />
                </label>

                <label className="month-sheets__option">
                  <input
                    type="checkbox"
                    checked={includeIncome}
                    onChange={(event) => setIncludeIncome(event.target.checked)}
                  />
                  <span>Копировать доход</span>
                </label>

                <button type="button" className="btn btn--primary btn--full" onClick={handleCopyPlan}>
                  Перезаписать
                </button>

                {copyError && <p className="month-sheets__error">{copyError}</p>}
              </div>
            )}
          </div>
        )}

        <div className="month-sheets__add">
          <button
            type="button"
            className="month-sheets__tab month-sheets__tab--add"
            aria-expanded={addOpen}
            aria-controls={`${addId}-picker`}
            aria-label="Добавить лист месяца"
            onClick={() => {
              setCopyOpen(false)
              setAddOpen((current) => !current)
            }}
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
    </div>
  )
}
