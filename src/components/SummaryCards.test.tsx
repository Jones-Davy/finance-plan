import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SummaryCards } from './SummaryCards'
import { buildBudgetSummary } from '../utils/calculations'
import { createBudgetState } from '../test/fixtures'

describe('SummaryCards', () => {
  it('updates income value', async () => {
    const user = userEvent.setup()
    const onIncomeChange = vi.fn()
    const summary = buildBudgetSummary(createBudgetState(), '2026-07')

    render(<SummaryCards income={100000} summary={summary} onIncomeChange={onIncomeChange} />)

    await user.clear(screen.getByLabelText('Доход в месяц'))
    await user.type(screen.getByLabelText('Доход в месяц'), '120000')
    expect(onIncomeChange).toHaveBeenCalled()
  })

  it('shows actual spending stats for selected month', () => {
    const summary = buildBudgetSummary(createBudgetState(), '2026-07')

    render(<SummaryCards income={100000} summary={summary} onIncomeChange={vi.fn()} />)

    expect(screen.getByText('Факт трат')).toBeInTheDocument()
    expect(screen.getByText('План трат')).toBeInTheDocument()
  })
})
