import type { Goal } from '../types'
import { goalMonthsLeft, goalProgress } from '../utils/calculations'
import { formatDate, formatMoney } from '../utils/format'
import { RussianDateInput } from './RussianDateInput'

interface Props {
  goals: Goal[]
  goalsMonthlyNeed: number
  onAdd: () => void
  onUpdate: (id: string, patch: Partial<Goal>) => void
  onRemove: (id: string) => void
}

export function GoalsPanel({ goals, goalsMonthlyNeed, onAdd, onUpdate, onRemove }: Props) {
  return (
    <section className="panel card">
      <header className="panel__header">
        <div>
          <h2>Финансовые цели</h2>
          <p className="panel__subtitle">
            Отслеживайте накопления и закрывайте цели по срокам
          </p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={onAdd}>
          + Цель
        </button>
      </header>

      {goals.length === 0 ? (
        <div className="empty-state">
          <p>Добавьте цель — отпуск, подушка безопасности, крупная покупка.</p>
          <button type="button" className="btn btn--primary" onClick={onAdd}>
            Создать первую цель
          </button>
        </div>
      ) : (
        <>
          <div className="goals-summary">
            <span>Нужно откладывать в месяц:</span>
            <strong>{formatMoney(goalsMonthlyNeed)}</strong>
          </div>

          <div className="goals-list">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onUpdate={onUpdate}
                onRemove={onRemove}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function GoalCard({
  goal,
  onUpdate,
  onRemove,
}: {
  goal: Goal
  onUpdate: Props['onUpdate']
  onRemove: Props['onRemove']
}) {
  const progress = goalProgress(goal)
  const isComplete = progress >= 100
  const monthsLeft = goalMonthsLeft(goal)
  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount)
  const monthlyNeed = monthsLeft > 0 ? remaining / monthsLeft : remaining

  return (
    <article className={`goal-card ${isComplete ? 'goal-card--done' : ''}`}>
      <div className="goal-card__header">
        <input
          className="goal-card__name"
          type="text"
          placeholder="Название цели"
          value={goal.name}
          onChange={(e) => onUpdate(goal.id, { name: e.target.value })}
        />
        <button
          type="button"
          className="btn btn--icon"
          aria-label="Удалить цель"
          onClick={() => onRemove(goal.id)}
        >
          ×
        </button>
      </div>

      <div className="goal-card__fields">
        <label>
          <span>Цель</span>
          <input
            type="number"
            min={0}
            step={1000}
            value={goal.targetAmount || ''}
            onChange={(e) =>
              onUpdate(goal.id, { targetAmount: Number(e.target.value) || 0 })
            }
          />
        </label>
        <label>
          <span>Накоплено</span>
          <input
            type="number"
            min={0}
            step={1000}
            value={goal.savedAmount || ''}
            onChange={(e) =>
              onUpdate(goal.id, { savedAmount: Number(e.target.value) || 0 })
            }
          />
        </label>
        <label>
          <span>Дедлайн</span>
          <RussianDateInput value={goal.deadline} onChange={(deadline) => onUpdate(goal.id, { deadline })} />
        </label>
      </div>

      <div className="goal-card__progress">
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="goal-card__meta">
          <span>
            {formatMoney(goal.savedAmount)} / {formatMoney(goal.targetAmount)}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      <div className="goal-card__footer">
        {isComplete ? (
          <span className="badge badge--success">Цель достигнута</span>
        ) : (
          <>
            <span>
              Осталось {formatMoney(remaining)} · до {formatDate(goal.deadline)}
            </span>
            <strong>~{formatMoney(monthlyNeed)} / мес</strong>
          </>
        )}
      </div>
    </article>
  )
}
