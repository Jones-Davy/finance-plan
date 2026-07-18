import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Rule503020Panel } from './Rule503020Panel'
import { buildBudgetSummary } from '../utils/calculations'
import { createBudgetState } from '../test/fixtures'

describe('Rule503020Panel', () => {
  it('is collapsed by default and expands on click', async () => {
    const user = userEvent.setup()
    const summary = buildBudgetSummary(createBudgetState(), '2026-07')

    render(<Rule503020Panel income={100000} summary={summary} />)

    expect(screen.queryByText('Необходимое')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Показать' }))
    expect(screen.getByText('Необходимое')).toBeInTheDocument()
  })

  it('asks for income when it is zero', async () => {
    const user = userEvent.setup()
    const summary = buildBudgetSummary(createBudgetState({ monthlyIncome: 0 }), '2026-07')

    render(<Rule503020Panel income={0} summary={summary} />)
    await user.click(screen.getByRole('button', { name: 'Показать' }))

    expect(screen.getByText(/Укажите доход/i)).toBeInTheDocument()
  })
})
