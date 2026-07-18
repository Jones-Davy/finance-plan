import { formatMoney, formatPercent } from '../utils/format'
import type { BudgetSummary } from '../utils/calculations'

interface Props {
  income: number
  summary: BudgetSummary
  onIncomeChange: (value: number) => void
}

export function SummaryCards({ income, summary, onIncomeChange }: Props) {
  const isOverPlan = summary.remaining < 0
  const isOverActual = summary.actualRemaining < 0

  return (
    <section className="summary">
      <div className="summary__income card">
        <label className="field-label" htmlFor="income">
          Доход в месяц
        </label>
        <div className="income-input">
          <input
            id="income"
            type="number"
            min={0}
            step={1000}
            value={income || ''}
            placeholder="0"
            onChange={(e) => onIncomeChange(Number(e.target.value) || 0)}
          />
          <span className="income-input__suffix">₽</span>
        </div>
      </div>

      <div className="summary__grid">
        <article className={`stat-card ${isOverPlan ? 'stat-card--danger' : ''}`}>
          <span className="stat-card__label">План трат</span>
          <strong className="stat-card__value">{formatMoney(summary.totalExpenses)}</strong>
          <span className="stat-card__hint">
            обязательные {formatMoney(summary.essentialExpenses)}
          </span>
        </article>

        <article className={`stat-card ${summary.actualTotal > 0 ? (isOverActual ? 'stat-card--danger' : 'stat-card--accent') : ''}`}>
          <span className="stat-card__label">Факт трат</span>
          <strong className="stat-card__value">{formatMoney(summary.actualTotal)}</strong>
          <span className="stat-card__hint">
            {summary.actualTotal > 0
              ? `остаток ${formatMoney(summary.actualRemaining)}`
              : 'добавьте траты'}
          </span>
        </article>

        <article className={`stat-card ${summary.remaining >= 0 ? 'stat-card--success' : 'stat-card--danger'}`}>
          <span className="stat-card__label">План. остаток</span>
          <strong className="stat-card__value">{formatMoney(summary.remaining)}</strong>
          <span className="stat-card__hint">
            {income > 0 ? formatPercent(summary.savingsRate) + ' от дохода' : 'укажите доход'}
          </span>
        </article>

        <article className="stat-card">
          <span className="stat-card__label">На неделю</span>
          <strong className="stat-card__value">{formatMoney(summary.weeklyBudget)}</strong>
          <span className="stat-card__hint">
            жизнь: {formatMoney(summary.weeklyEssential)}
          </span>
        </article>
      </div>
    </section>
  )
}
