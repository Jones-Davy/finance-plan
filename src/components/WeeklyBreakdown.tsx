import type { BudgetSummary } from '../utils/calculations'
import { formatMoney } from '../utils/format'

interface Props {
  summary: BudgetSummary
}

export function WeeklyBreakdown({ summary }: Props) {
  const rows = [
    {
      label: 'Все траты',
      weekly: summary.weeklyBudget,
      daily: summary.dailyBudget,
      hint: 'полный бюджет на жизнь',
    },
    {
      label: 'Обязательные',
      weekly: summary.weeklyEssential,
      daily: summary.essentialExpenses / 30,
      hint: 'минимум для выживания',
    },
    {
      label: 'Дополнительные',
      weekly: summary.weeklyOptional,
      daily: summary.optionalExpenses / 30,
      hint: 'развлечения и необязательное',
    },
  ]

  return (
    <section className="panel card">
      <header className="panel__header">
        <div>
          <h2>Недельный план</h2>
          <p className="panel__subtitle">
            Сколько можно тратить, если месяц ≈ 4,33 недели
          </p>
        </div>
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

      {summary.goalsMonthlyNeed > 0 && (
        <div className="weekly-note">
          <span>На цели нужно откладывать</span>
          <strong>{formatMoney(summary.goalsMonthlyNeed)} / мес</strong>
          <span className="weekly-note__sep">·</span>
          <span>свободно после целей</span>
          <strong className={summary.freeAfterGoals < 0 ? 'text-danger' : 'text-success'}>
            {formatMoney(summary.freeAfterGoals)}
          </strong>
        </div>
      )}
    </section>
  )
}
