import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlanVsActualPanel } from './PlanVsActualPanel'
import { buildBudgetSummary } from '../utils/calculations'
import { createBudgetState } from '../test/fixtures'

describe('PlanVsActualPanel', () => {
  it('shows placeholder when there is no data', () => {
    const summary = buildBudgetSummary(
      createBudgetState({ monthlyIncome: 0, expensesByMonth: {}, transactions: [] }),
      '2026-07',
    )

    render(<PlanVsActualPanel summary={summary} />)
    expect(screen.getByText(/Сравнение появится/i)).toBeInTheDocument()
  })

  it('shows overbudget badge when fact exceeds plan', () => {
    const summary = buildBudgetSummary(createBudgetState(), '2026-07')
    const inflated = {
      ...summary,
      totalExpenses: 1000,
      actualTotal: 5000,
      planVsActual: summary.planVsActual,
    }

    render(<PlanVsActualPanel summary={inflated} />)
    expect(screen.getByText('Перерасход')).toBeInTheDocument()
    expect(screen.getByText('Еда')).toBeInTheDocument()
  })
})
