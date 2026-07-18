import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { WeeklyBreakdown } from './WeeklyBreakdown'
import { buildBudgetSummary } from '../utils/calculations'
import { createBudgetState, createTransaction } from '../test/fixtures'

describe('WeeklyBreakdown', () => {
  it('shows weekly plan and fact for selected category', async () => {
    const user = userEvent.setup()
    const state = createBudgetState()
    const summary = buildBudgetSummary(state, '2026-07')

    render(
      <WeeklyBreakdown
        summary={summary}
        expenses={state.expensesByMonth['2026-07'] ?? []}
        transactions={[
          createTransaction({ category: 'food', amount: 430 }),
          createTransaction({ id: 'tx-food-2', category: 'transport', amount: 1000 }),
        ]}
      />,
    )

    expect(screen.getByText('Недельный план')).toBeInTheDocument()
    expect(screen.getByText('План')).toBeInTheDocument()
    expect(screen.getByText('Факт')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveValue('food')

    await user.selectOptions(screen.getByRole('combobox'), 'transport')
    expect(screen.getByRole('combobox')).toHaveValue('transport')
  })
})
