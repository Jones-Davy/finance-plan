import type { BudgetSummary } from '../utils/calculations'
import { formatMoney } from '../utils/format'

interface Props {
  summary: BudgetSummary
}

export function PlanVsActualPanel({ summary }: Props) {
  if (summary.planVsActual.length === 0 && summary.actualTotal === 0) {
    return (
      <section className="panel card">
        <header className="panel__header">
          <div>
            <h2>План vs факт</h2>
            <p className="panel__subtitle">Сравнение появится после заполнения плана и трат</p>
          </div>
        </header>
      </section>
    )
  }

  const overBudget = summary.actualTotal > summary.totalExpenses

  return (
    <section className="panel card">
      <header className="panel__header panel__header--wrap">
        <div>
          <h2>План vs факт</h2>
          <p className="panel__subtitle">
            План {formatMoney(summary.totalExpenses)} · факт {formatMoney(summary.actualTotal)}
          </p>
        </div>
        <span className={`badge ${overBudget ? 'badge--danger' : 'badge--success'}`}>
          {overBudget ? 'Перерасход' : 'В рамках плана'}
        </span>
      </header>

      <div className="compare-table">
        <div className="compare-table__head">
          <span className="compare-table__category">Категория</span>
          <span className="compare-table__value">План</span>
          <span className="compare-table__value">Факт</span>
          <span className="compare-table__value">Разница</span>
        </div>
        {summary.planVsActual.map((row) => (
          <div key={row.category} className="compare-table__row">
            <span className="compare-table__category">{row.label}</span>
            <span className="compare-table__value" data-label="План">
              {formatMoney(row.planned)}
            </span>
            <span className="compare-table__value" data-label="Факт">
              {formatMoney(row.actual)}
            </span>
            <span
              className={`compare-table__value ${row.diff < 0 ? 'text-danger' : row.diff > 0 ? 'text-success' : ''}`}
              data-label="Разница"
            >
              {row.diff >= 0 ? '+' : ''}
              {formatMoney(row.diff)}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
