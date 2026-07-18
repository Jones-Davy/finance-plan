import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { BudgetSummary } from '../utils/calculations'
import { CATEGORY_COLORS } from '../types'
import { formatMoney } from '../utils/format'

interface Props {
  summary: BudgetSummary
  income: number
}

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; color?: string }>
  label?: string
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  const item = payload[0]
  const title = label ?? item.name ?? 'Значение'

  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip__label">{title}</span>
      <strong className="chart-tooltip__value">{formatMoney(Number(item.value ?? 0))}</strong>
    </div>
  )
}

export function ExpenseChart({ summary, income }: Props) {
  const chartData = summary.byCategory.map((item) => ({
    ...item,
    color: CATEGORY_COLORS[item.category],
  }))

  const barData = [
    { name: 'Доход', value: income, fill: '#22c55e' },
    { name: 'Траты', value: summary.totalExpenses, fill: '#ef4444' },
    { name: 'Остаток', value: Math.max(0, summary.remaining), fill: '#6366f1' },
  ]

  if (summary.totalExpenses === 0 && income === 0) {
    return (
      <section className="panel card chart-panel">
        <header className="panel__header">
          <div>
            <h2>Диаграмма</h2>
            <p className="panel__subtitle">Заполните доход и траты для визуализации</p>
          </div>
        </header>
      </section>
    )
  }

  return (
    <section className="panel card chart-panel">
      <header className="panel__header">
        <div>
          <h2>Распределение бюджета</h2>
          <p className="panel__subtitle">Структура расходов по категориям</p>
        </div>
      </header>

      <div className="charts">
        {chartData.length > 0 && (
          <div className="chart-block">
            <h3 className="chart-block__title">По категориям</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="amount"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                  stroke="transparent"
                  activeShape={false}
                  isAnimationActive={false}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.category} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="legend">
              {chartData.map((item) => (
                <li key={item.category}>
                  <span className="legend__dot" style={{ background: item.color }} />
                  <span>{item.label}</span>
                  <strong>{formatMoney(item.amount)}</strong>
                </li>
              ))}
            </ul>
          </div>
        )}

        {income > 0 && (
          <div className="chart-block">
            <h3 className="chart-block__title">Доход vs траты</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis
                  type="number"
                  tick={{ fill: '#9aa3b5', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={72}
                  tick={{ fill: '#eef0f5', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: 'rgba(99, 102, 241, 0.08)', radius: 6 }}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 6, 6, 0]}
                  activeBar={false}
                  isAnimationActive={false}
                >
                  {barData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  )
}
