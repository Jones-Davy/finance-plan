import { useEffect, useState } from 'react'
import type { ActualTransaction, ExpenseCategory, SpendingBucket } from '../types'
import {
  BUCKET_SHORT_LABELS,
  CATEGORY_BUCKET,
  CATEGORY_LABELS,
} from '../types'
import {
  defaultDateForMonth,
  formatMonthLabel,
  isDateInMonth,
  lastDayOfMonth,
} from '../utils/calculations'
import { formatMoney } from '../utils/format'
import { formatRuShortDate } from '../utils/dates'
import { RussianDateInput } from './RussianDateInput'

interface Props {
  monthKey: string
  transactions: ActualTransaction[]
  onAdd: (data: Omit<ActualTransaction, 'id'>) => void
  onRemove: (id: string) => void
}

const categories = Object.entries(CATEGORY_LABELS) as [ExpenseCategory, string][]
const buckets = Object.entries(BUCKET_SHORT_LABELS) as [SpendingBucket, string][]

export function ActualSpendingPanel({ monthKey, transactions, onAdd, onRemove }: Props) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => defaultDateForMonth(monthKey))
  const [category, setCategory] = useState<ExpenseCategory>('food')
  const [bucket, setBucket] = useState<SpendingBucket>(CATEGORY_BUCKET.food)
  const [formError, setFormError] = useState('')
  const [justAdded, setJustAdded] = useState(false)

  useEffect(() => {
    setDate(defaultDateForMonth(monthKey))
  }, [monthKey])

  const handleCategoryChange = (value: ExpenseCategory) => {
    setCategory(value)
    setBucket(CATEGORY_BUCKET[value])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    const parsedAmount = Number(amount)
    if (!name.trim()) {
      setFormError('Укажите описание траты')
      return
    }
    if (!parsedAmount || parsedAmount <= 0) {
      setFormError('Укажите сумму больше 0')
      return
    }
    if (!isDateInMonth(date, monthKey)) {
      setFormError(`Дата должна быть в ${formatMonthLabel(monthKey)}`)
      return
    }

    onAdd({
      name: name.trim(),
      amount: parsedAmount,
      date,
      category,
      bucket,
    })

    setName('')
    setAmount('')
    setDate(defaultDateForMonth(monthKey))
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 2000)
  }

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date))
  const total = transactions.reduce((sum, t) => sum + t.amount, 0)

  return (
    <section className="panel card">
      <header className="panel__header">
        <div>
          <h2>Фактические траты</h2>
          <p className="panel__subtitle">
            {formatMonthLabel(monthKey)} · записано {formatMoney(total)}
          </p>
        </div>
        {justAdded && <span className="badge badge--success">Добавлено</span>}
      </header>

      <form className="transaction-form" onSubmit={handleSubmit}>
        <label className="field field--wide">
          <span className="field__label">Описание</span>
          <input
            type="text"
            placeholder="Что купили?"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="field field--amount">
          <span className="field__label">Сумма</span>
          <input
            type="number"
            min={0}
            step={1}
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <label className="field field--date">
          <span className="field__label">Дата</span>
          <RussianDateInput
            value={date}
            min={`${monthKey}-01`}
            max={lastDayOfMonth(monthKey)}
            onChange={setDate}
          />
        </label>
        <label className="field field--category">
          <span className="field__label">Категория</span>
          <select value={category} onChange={(e) => handleCategoryChange(e.target.value as ExpenseCategory)}>
            {categories.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field field--bucket">
          <span className="field__label">Тип</span>
          <select value={bucket} onChange={(e) => setBucket(e.target.value as SpendingBucket)}>
            {buckets.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <span className="field__hint">
            {bucket === 'savings'
              ? 'Учитывается в накоплениях (50/30/20) и в строке «Накопления» в план vs факт. Больше плана — это плюс, не перерасход.'
              : bucket === 'need'
                ? 'Необходимая трата — попадает в категорию и в блок «Необходимое» (50%).'
                : 'Желание — попадает в категорию и в блок «Желания» (30%).'}
          </span>
        </label>
        <button type="submit" className="btn btn--primary transaction-form__submit">
          Добавить
        </button>
      </form>

      {formError && <p className="form-error">{formError}</p>}

      {sorted.length === 0 ? (
        <div className="empty-state compact">
          <p>Записывайте траты за {formatMonthLabel(monthKey)} — они появятся в списке и в «Факт трат».</p>
        </div>
      ) : (
        <div className="transaction-list">
          {sorted.map((t) => (
            <div key={t.id} className="transaction-row">
              <strong className="transaction-row__name">{t.name}</strong>
              <span className="transaction-row__meta">
                {formatRuShortDate(t.date)} · {CATEGORY_LABELS[t.category]} ·{' '}
                {BUCKET_SHORT_LABELS[t.bucket]}
              </span>
              <strong className="transaction-row__amount">{formatMoney(t.amount)}</strong>
              <button
                type="button"
                className="btn btn--icon transaction-row__delete"
                aria-label="Удалить трату"
                onClick={() => onRemove(t.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
