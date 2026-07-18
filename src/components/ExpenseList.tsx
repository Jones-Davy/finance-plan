import type { Expense } from '../types'
import { CATEGORY_LABELS, type ExpenseCategory } from '../types'
import { formatMonthLabel } from '../utils/calculations'
import { CompactMoneyInput } from './CompactMoneyInput'

interface Props {
  monthKey: string
  expenses: Expense[]
  onUpdate: (id: string, patch: Partial<Expense>) => void
  onAdd: (category?: ExpenseCategory, essential?: boolean) => void
  onRemove: (id: string) => void
}

const categories = Object.entries(CATEGORY_LABELS) as [ExpenseCategory, string][]

export function ExpenseList({ monthKey, expenses, onUpdate, onAdd, onRemove }: Props) {
  const essential = expenses.filter((e) => e.essential)
  const optional = expenses.filter((e) => !e.essential)

  return (
    <section className="panel card">
      <header className="panel__header">
        <div>
          <h2>План расходов</h2>
          <p className="panel__subtitle">План на {formatMonthLabel(monthKey)}</p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={() => onAdd('other', true)}>
          + Статья
        </button>
      </header>

      <ExpenseGroup
        title="Обязательные"
        items={essential}
        onUpdate={onUpdate}
        onRemove={onRemove}
      />

      {optional.length > 0 && (
        <ExpenseGroup
          title="Дополнительные"
          items={optional}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      )}

      <button type="button" className="btn btn--secondary btn--full" onClick={() => onAdd('entertainment', false)}>
        + Дополнительная трата
      </button>
    </section>
  )
}

function ExpenseGroup({
  title,
  items,
  onUpdate,
  onRemove,
}: {
  title: string
  items: Expense[]
  onUpdate: Props['onUpdate']
  onRemove: Props['onRemove']
}) {
  if (items.length === 0) return null

  return (
    <div className="expense-group">
      <h3 className="expense-group__title">{title}</h3>
      <div className="expense-list">
        {items.map((expense) => (
          <article key={expense.id} className="expense-row">
            <button
              type="button"
              className="btn btn--icon expense-row__delete"
              aria-label="Удалить"
              onClick={() => onRemove(expense.id)}
            >
              ×
            </button>

            <label className="expense-field expense-row__name-field">
              <span className="expense-field__label">Название</span>
              <input
                className="expense-row__name"
                type="text"
                placeholder="Например, продукты"
                value={expense.name}
                onChange={(e) => onUpdate(expense.id, { name: e.target.value })}
              />
            </label>

            <label className="expense-field expense-row__category-field">
              <span className="expense-field__label">Категория</span>
              <select
                className="expense-row__category"
                value={expense.category}
                onChange={(e) =>
                  onUpdate(expense.id, { category: e.target.value as ExpenseCategory })
                }
              >
                {categories.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <div className="expense-field expense-row__amount-field">
              <span className="expense-field__label">План, ₽</span>
              <CompactMoneyInput
                className="expense-row__amount-input"
                value={expense.amount}
                onChange={(amount) => onUpdate(expense.id, { amount })}
              />
            </div>

            <label className="expense-row__essential" title="Обязательная трата">
              <span>Обязательная трата</span>
              <input
                type="checkbox"
                checked={expense.essential}
                onChange={(e) => onUpdate(expense.id, { essential: e.target.checked })}
              />
            </label>
          </article>
        ))}
      </div>
    </div>
  )
}
