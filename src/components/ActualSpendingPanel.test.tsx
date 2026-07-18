import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ActualSpendingPanel } from './ActualSpendingPanel'
import { createTransaction } from '../test/fixtures'

describe('ActualSpendingPanel', () => {
  it('renders empty state for month without transactions', () => {
    render(
      <ActualSpendingPanel
        monthKey="2026-07"
        transactions={[]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    )

    expect(screen.getByText(/Фактические траты/i)).toBeInTheDocument()
    expect(screen.getByText(/записано/i)).toBeInTheDocument()
  })

  it('lists transactions for selected month', () => {
    render(
      <ActualSpendingPanel
        monthKey="2026-07"
        transactions={[createTransaction(), createTransaction({ id: 'tx-2', name: 'Кофе', amount: 300 })]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    )

    expect(screen.getByText('Хлеб')).toBeInTheDocument()
    expect(screen.getByText('Кофе')).toBeInTheDocument()
  })

  it('submits valid transaction', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()

    render(
      <ActualSpendingPanel
        monthKey="2026-07"
        transactions={[]}
        onAdd={onAdd}
        onRemove={vi.fn()}
      />,
    )

    await user.type(screen.getByPlaceholderText('Что купили?'), 'Обед')
    await user.type(screen.getByPlaceholderText('0'), '450')
    await user.click(screen.getByRole('button', { name: 'Добавить' }))

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Обед',
        amount: 450,
        date: expect.stringMatching(/^2026-07-/),
      }),
    )
  })

  it('shows validation error for empty form', async () => {
    const user = userEvent.setup()

    render(
      <ActualSpendingPanel
        monthKey="2026-07"
        transactions={[]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Добавить' }))
    expect(screen.getByText('Укажите описание траты')).toBeInTheDocument()
  })

  it('removes transaction on delete click', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()

    render(
      <ActualSpendingPanel
        monthKey="2026-07"
        transactions={[createTransaction()]}
        onAdd={vi.fn()}
        onRemove={onRemove}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Удалить трату' }))
    expect(onRemove).toHaveBeenCalledWith('tx-1')
  })
})
