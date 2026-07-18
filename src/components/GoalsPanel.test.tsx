import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GoalsPanel } from './GoalsPanel'
import { createGoal } from '../test/fixtures'

describe('GoalsPanel', () => {
  it('shows empty state and creates first goal', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()

    render(
      <GoalsPanel
        goals={[]}
        goalsMonthlyNeed={0}
        onAdd={onAdd}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Создать первую цель' }))
    expect(onAdd).toHaveBeenCalled()
  })

  it('renders goal progress', () => {
    render(
      <GoalsPanel
        goals={[createGoal()]}
        goalsMonthlyNeed={10000}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
      />,
    )

    expect(screen.getByDisplayValue('Отпуск')).toBeInTheDocument()
    expect(screen.getByText('17%')).toBeInTheDocument()
  })
})
