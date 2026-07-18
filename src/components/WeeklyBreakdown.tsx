import { useMemo, useState } from 'react'
import type { ActualTransaction, Expense, ExpenseCategory } from '../types'
import { CATEGORY_LABELS } from '../types'
import type { BudgetSummary } from '../utils/calculations'
import { formatMoney } from '../utils/format'

interface Props {
  summary: BudgetSummary
  expenses: Expense[]
  transactions: ActualTransaction[]
}

const WEEKLY_CATEGORIES = (
  Object.entries(CATEGORY_LABELS) as [ExpenseCategory, string][]
).filter(([category]) => category !== 'savings')

export function WeeklyBreakdown({ summary, expenses, transactions }: Props) {
  const [category, setCategory] = useState<ExpenseCategory>('food')

  const { plannedTotal, actualTotal } = useMemo(() => {
    const plannedTotal = expenses
      .filter((expense) => expense.category === category)
      .reduce((sum, expense) => sum + (expense.amount || 0), 0)

    const actualTotal = transactions
      .filter((transaction) => transaction.category === category && transaction.amount > 0)
      .reduce((sum, transaction) => sum + transaction.amount, 0)

    return { plannedTotal, actualTotal }
  }, [category, expenses, transactions])

  const rows = [
    {
      label: 'План',
      weekly: plannedTotal / 4.33,
      daily: plannedTotal / 30,
      hint: CATEGORY_LABELS[category],
    },
    {
      label: 'Факт',
      weekly: actualTotal / 4.33,
      daily: actualTotal / 30,
      hint: 'по выбранной категории',
    },
  ]

  return (
    <section className="panel card">
      <header className="panel__header panel__header--wrap">
        <div>
          <h2>Недельный план</h2>
          <p className="panel__subtitle">План и факт по категории, месяц ≈ 4,33 недели</p>
        </div>
        <label className="field weekly-breakdown__filter">
          <span className="field__label">Категория</span>
          <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
            {WEEKLY_CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="weekly-grid">
        {rows.map((row) => (
          <article key={row.label} className="weekly-card">
            <span className="weekly-card__label">{row.label}</span>
            <div className="weekly-card__amounts">
              <div>
                <span className="weekly-card__period">в неделю</span>
                <strong>{formatMoney(row.weekly)}</strong>
              </div>
              <div>
                <span className="weekly-card__period">в день</span>
                <strong>{formatMoney(row.daily)}</strong>
              </div>
            </div>
            <p className="weekly-card__hint">{row.hint}</p>
          </article>
        ))}
      </div>

      {summary.actualTotal > 0 && (
        <div className="weekly-note">
          <span>Всего факт за месяц</span>
          <strong>{formatMoney(summary.actualTotal)}</strong>
        </div>
      )}
    </section>
  )
}
