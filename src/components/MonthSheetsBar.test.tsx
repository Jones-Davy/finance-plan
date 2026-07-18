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

  it('copies plan from one month to another', async () => {
    const user = userEvent.setup()
    const onCopyPlan = vi.fn().mockReturnValue(true)
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))

    render(
      <MonthSheetsBar
        monthKeys={['2026-07', '2026-08']}
        value="2026-08"
        onChange={vi.fn()}
        onCopyPlan={onCopyPlan}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Скопировать план месяца' }))
    await user.selectOptions(screen.getByRole('combobox'), '2026-07')
    await user.click(screen.getByRole('button', { name: 'Перезаписать' }))

    expect(onCopyPlan).toHaveBeenCalledWith('2026-07', '2026-08', { includeIncome: true })
  })
})
