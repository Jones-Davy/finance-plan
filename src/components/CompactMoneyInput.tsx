import { useState } from 'react'
import { formatCompactMoney, parseCompactMoney } from '../utils/format'

interface Props {
  value: number
  onChange: (value: number) => void
  className?: string
  placeholder?: string
  min?: number
}

export function CompactMoneyInput({
  value,
  onChange,
  className,
  placeholder = '0',
  min = 0,
}: Props) {
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState('')

  const displayValue = focused
    ? draft
    : value
      ? formatCompactMoney(value)
      : ''

  return (
    <input
      className={className}
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      value={displayValue}
      onFocus={() => {
        setFocused(true)
        setDraft(value ? String(value) : '')
      }}
      onChange={(e) => {
        const next = e.target.value
        setDraft(next)
        onChange(Math.max(min, parseCompactMoney(next)))
      }}
      onBlur={() => {
        setFocused(false)
        setDraft('')
        onChange(Math.max(min, parseCompactMoney(draft)))
      }}
    />
  )
}
