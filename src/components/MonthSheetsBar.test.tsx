import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MonthSheetsBar } from './MonthSheetsBar'

describe('MonthSheetsBar', () => {
  it('renders month tabs and switches active sheet', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <MonthSheetsBar
        monthKeys={['2026-07', '2026-08']}
        value="2026-07"
        onChange={onChange}
      />,
    )

    expect(screen.getByRole('tab', { name: '07.26' })).toHaveAttribute('aria-selected', 'true')

    await user.click(screen.getByRole('tab', { name: '08.26' }))
    expect(onChange).toHaveBeenCalledWith('2026-08')
  })
})
