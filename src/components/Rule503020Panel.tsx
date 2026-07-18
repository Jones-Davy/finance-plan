import { useState } from 'react'
import type { BudgetSummary } from '../utils/calculations'
import { formatMoney, formatPercent } from '../utils/format'

interface Props {
  income: number
  summary: BudgetSummary
}

export function Rule503020Panel({ income, summary }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <section className={`panel card rule-panel${expanded ? ' rule-panel--expanded' : ''}`}>
      <header className="panel__header">
        <div>
          <h2>Правило 50/30/20</h2>
          <p className="panel__subtitle">
            50% — необходимое, 30% — желания, 20% — накопления и долги
          </p>
        </div>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'Свернуть' : 'Показать'}
        </button>
      </header>

      {expanded && (
        <>
          {income <= 0 ? (
            <div className="empty-state compact">
              <p>Укажите доход, чтобы увидеть целевое распределение.</p>
            </div>
          ) : (
            <div className="rule-list">
              {summary.rule503020.map((row) => {
                const isOver = row.bucket !== 'savings' && row.actualAmount > row.targetAmount
                const isUnderSaved = row.bucket === 'savings' && row.actualAmount < row.targetAmount

                return (
                  <article key={row.bucket} className="rule-card">
                    <div className="rule-card__header">
                      <span>{row.label}</span>
                      <span className="rule-card__target">
                        цель {row.targetPercent}% · {formatMoney(row.targetAmount)}
                      </span>
                    </div>

                    <div className="rule-card__bar">
                      <div
                        className={`rule-card__fill ${isOver || isUnderSaved ? 'rule-card__fill--warn' : ''}`}
                        style={{
                          width: `${Math.min(100, row.actualPercent)}%`,
                        }}
                      />
                      <div
                        className="rule-card__marker"
                        style={{ left: `${row.targetPercent}%` }}
                        title={`Цель ${row.targetPercent}%`}
                      />
                    </div>

                    <div className="rule-card__footer">
                      <span>
                        Факт: {formatMoney(row.actualAmount)} ({formatPercent(row.actualPercent)})
                      </span>
                      <span className={row.diff >= 0 ? 'text-success' : 'text-danger'}>
                        {row.bucket === 'savings'
                          ? row.diff >= 0
                            ? `+${formatMoney(row.diff)} к цели`
                            : `${formatMoney(row.diff)} до цели`
                          : row.diff >= 0
                            ? `запас ${formatMoney(row.diff)}`
                            : `лишнее ${formatMoney(Math.abs(row.diff))}`}
                      </span>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          <p className="panel-note">
            Правило помогает быстро проверить баланс: не съедают ли обязательные траты больше
            половины дохода, есть ли место для желаний и откладываете ли вы минимум 20%.
          </p>
        </>
      )}
    </section>
  )
}
