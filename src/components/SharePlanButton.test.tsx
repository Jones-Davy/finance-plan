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
  savedRooms: [],
  onRoomNameChange: vi.fn(),
  onCreateRoom: vi.fn().mockResolvedValue('00000000-0000-4000-8000-000000000001'),
  onCreateNewRoom: vi.fn().mockResolvedValue('00000000-0000-4000-8000-000000000002'),
  onSwitchToLocal: vi.fn(),
  onSwitchRoom: vi.fn(),
  onAddSavedRoom: vi.fn().mockReturnValue(null),
  onRemoveSavedRoom: vi.fn(),
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
        savedRooms={[{ id: '00000000-0000-4000-8000-000000000001', name: 'Семья' }]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Комната' }))
    expect(screen.getByRole('button', { name: 'Создать новую комнату' })).toBeInTheDocument()
  })

  it('switches between saved rooms', async () => {
    const user = userEvent.setup()
    const onSwitchRoom = vi.fn()
    const onSwitchToLocal = vi.fn()

    render(
      <SharePlanButton
        {...defaultProps}
        cloudAvailable
        savedRooms={[
          { id: '00000000-0000-4000-8000-000000000001', name: 'Семья' },
          { id: '00000000-0000-4000-8000-000000000002', name: 'Работа' },
        ]}
        onSwitchRoom={onSwitchRoom}
        onSwitchToLocal={onSwitchToLocal}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Комната' }))
    await user.click(screen.getByRole('button', { name: 'Семья00000000…' }))
    expect(onSwitchRoom).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000001')

    await user.click(screen.getByRole('button', { name: /Локальный бюджет/i }))
    expect(onSwitchToLocal).toHaveBeenCalled()
  })

  it('adds room from pasted link', async () => {
    const user = userEvent.setup()
    const onAddSavedRoom = vi.fn().mockReturnValue('00000000-0000-4000-8000-000000000003')

    render(
      <SharePlanButton
        {...defaultProps}
        cloudAvailable
        onAddSavedRoom={onAddSavedRoom}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Комната' }))
    await user.type(
      screen.getByPlaceholderText('https://…/#room=…'),
      'https://example.com/#room=00000000-0000-4000-8000-000000000003',
    )
    await user.click(screen.getByRole('button', { name: 'Добавить' }))

    expect(onAddSavedRoom).toHaveBeenCalled()
  })
})
