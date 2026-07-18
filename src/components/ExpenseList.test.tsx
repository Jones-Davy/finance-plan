import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ExpenseList } from './ExpenseList'
import { createExpense } from '../test/fixtures'

describe('ExpenseList', () => {
  it('renders planned expenses and updates values', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()

    render(
      <ExpenseList
        monthKey="2026-07"
        expenses={[createExpense()]}
        onUpdate={onUpdate}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    )

    expect(screen.getByDisplayValue('Продукты')).toBeInTheDocument()
    expect(screen.getByDisplayValue('15к')).toBeInTheDocument()

    const amountInput = screen.getByDisplayValue('15к')
    await user.click(amountInput)
    await user.clear(screen.getByDisplayValue('15000'))
    await user.type(amountInput, '20000')
    expect(onUpdate).toHaveBeenCalled()
  })

  it('adds new expense article', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()

    render(
      <ExpenseList
        monthKey="2026-07"
        expenses={[createExpense()]}
        onUpdate={vi.fn()}
        onAdd={onAdd}
        onRemove={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: '+ Статья' }))
    expect(onAdd).toHaveBeenCalledWith('other', true)
  })
})
