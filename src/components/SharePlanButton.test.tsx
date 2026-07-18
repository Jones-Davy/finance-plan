import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SharePlanButton } from './SharePlanButton'
import { createBudgetState } from '../test/fixtures'

const defaultProps = {
  state: createBudgetState(),
  roomId: null,
  roomName: '',
  cloudAvailable: false,
  onRoomNameChange: vi.fn(),
  onCreateRoom: vi.fn().mockResolvedValue('00000000-0000-4000-8000-000000000001'),
  onCreateNewRoom: vi.fn().mockResolvedValue('00000000-0000-4000-8000-000000000002'),
}

describe('SharePlanButton', () => {
  it('opens popover and copies current URL in legacy mode', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })

    render(<SharePlanButton {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: 'Комната' }))
    expect(screen.getByText(/Облако не настроено/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Копировать ссылку' }))
    expect(writeText).toHaveBeenCalled()
  })

  it('shows cloud room actions when Supabase is available', async () => {
    const user = userEvent.setup()
    const onCreateRoom = vi.fn().mockResolvedValue('00000000-0000-4000-8000-000000000001')
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })

    render(
      <SharePlanButton
        {...defaultProps}
        cloudAvailable
        onCreateRoom={onCreateRoom}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Комната' }))
    await user.type(screen.getByPlaceholderText('Например, Семейный бюджет'), 'Семья')
    await user.click(screen.getByRole('button', { name: 'Создать общую комнату' }))

    expect(onCreateRoom).toHaveBeenCalled()
    expect(writeText).toHaveBeenCalled()
  })

  it('offers new room button when already in a room', async () => {
    const user = userEvent.setup()

    render(
      <SharePlanButton
        {...defaultProps}
        cloudAvailable
        roomId="00000000-0000-4000-8000-000000000001"
        roomName="Семья"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Комната' }))
    expect(screen.getByRole('button', { name: 'Создать новую комнату' })).toBeInTheDocument()
  })
})
