import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RussianDateInput } from './RussianDateInput'
import { RussianMonthInput } from './RussianMonthInput'

describe('RussianDateInput', () => {
  it('shows Russian date format and opens calendar', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<RussianDateInput value="2026-07-18" onChange={onChange} />)

    expect(screen.getByDisplayValue('18.07.2026')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Открыть календарь' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/июл/i)).toBeInTheDocument()
  })

  it('selects date from calendar', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<RussianDateInput value="2026-07-18" onChange={onChange} min="2026-07-01" max="2026-07-31" />)

    await user.click(screen.getByRole('button', { name: 'Открыть календарь' }))
    await user.click(screen.getByRole('button', { name: '20' }))
    expect(onChange).toHaveBeenCalledWith('2026-07-20')
  })
})

describe('RussianMonthInput', () => {
  it('shows Russian month format and opens month picker', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<RussianMonthInput value="2026-07" onChange={onChange} />)

    expect(screen.getByDisplayValue('07.2026')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Открыть выбор месяца' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('2026')).toBeInTheDocument()
  })

  it('selects month from picker grid', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<RussianMonthInput value="2026-07" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Открыть выбор месяца' }))
    await user.click(screen.getByRole('button', { name: 'Авг' }))
    expect(onChange).toHaveBeenCalledWith('2026-08')
  })
})
