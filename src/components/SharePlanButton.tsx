import { useEffect, useRef, useState } from 'react'
import type { BudgetState } from '../types'
import {
  createShareUrl,
  DEFAULT_URL_SHARE_OPTIONS,
} from '../utils/share'
import { buildRoomUrl } from '../utils/roomUrl'

interface Props {
  state: BudgetState
  roomId: string | null
  roomName: string
  cloudAvailable: boolean
  onRoomNameChange: (name: string) => void
  onCreateRoom: (name?: string) => Promise<string>
  onCreateNewRoom: (name?: string) => Promise<string>
}

export function SharePlanButton({
  state,
  roomId,
  roomName,
  cloudAvailable,
  onRoomNameChange,
  onCreateRoom,
  onCreateNewRoom,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [includeGoals, setIncludeGoals] = useState(true)
  const [includeTransactions, setIncludeTransactions] = useState(true)
  const [draftRoomName, setDraftRoomName] = useState(roomName)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setDraftRoomName(roomName)
  }, [roomName])

  const usesDefaultUrl =
    includeGoals === DEFAULT_URL_SHARE_OPTIONS.includeGoals &&
    includeTransactions === DEFAULT_URL_SHARE_OPTIONS.includeTransactions

  const handleCopyLegacy = async () => {
    setError('')
    try {
      const url = usesDefaultUrl ? window.location.href : createShareUrl(state, { includeGoals, includeTransactions })
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setError('Не удалось скопировать ссылку')
    }
  }

  const handleCopyRoom = async () => {
    if (!roomId) return
    setError('')
    try {
      await navigator.clipboard.writeText(buildRoomUrl(roomId))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setError('Не удалось скопировать ссылку')
    }
  }

  const handleCreateRoom = async () => {
    setError('')
    setBusy(true)
    try {
      onRoomNameChange(draftRoomName)
      const id = await onCreateRoom(draftRoomName)
      await navigator.clipboard.writeText(buildRoomUrl(id))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setError('Не удалось создать общую комнату. Проверьте Supabase.')
    } finally {
      setBusy(false)
    }
  }

  const handleCreateNewRoom = async () => {
    setError('')
    if (!confirm('Создать новую комнату? Текущая ссылка перестанет открывать этот бюджет.')) {
      return
    }

    setBusy(true)
    try {
      const id = await onCreateNewRoom(draftRoomName)
      await navigator.clipboard.writeText(buildRoomUrl(id))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setError('Не удалось создать новую комнату.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      const root = rootRef.current
      if (!root || root.contains(event.target as Node)) return
      setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  return (
    <div className="share" ref={rootRef}>
      <button type="button" className="btn btn--secondary" onClick={() => setOpen((v) => !v)}>
        Комната
      </button>

      {open && (
        <div className="share__popover card">
          <h3>Общая комната</h3>

          {cloudAvailable ? (
            <>
              <p className="share__text">
                Комната синхронизирует бюджет между устройствами. Активный месяц у каждого свой.
              </p>

              <label className="field share__room-name">
                <span className="field__label">Название комнаты</span>
                <input
                  type="text"
                  value={draftRoomName}
                  placeholder="Например, Семейный бюджет"
                  onChange={(e) => setDraftRoomName(e.target.value)}
                  onBlur={() => onRoomNameChange(draftRoomName)}
                />
              </label>

              {roomId ? (
                <>
                  <button type="button" className="btn btn--primary btn--full" onClick={handleCopyRoom}>
                    {copied ? 'Ссылка скопирована' : 'Копировать ссылку-приглашение'}
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary btn--full"
                    disabled={busy}
                    onClick={handleCreateNewRoom}
                  >
                    {busy ? 'Создаём…' : 'Создать новую комнату'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn--primary btn--full"
                  disabled={busy}
                  onClick={handleCreateRoom}
                >
                  {busy ? 'Создаём…' : copied ? 'Комната создана · ссылка скопирована' : 'Создать общую комнату'}
                </button>
              )}
            </>
          ) : (
            <>
              <p className="share__text">
                Облако не настроено — работает старый режим: весь план в ссылке.
              </p>

              <label className="share__option">
                <input
                  type="checkbox"
                  checked={includeGoals}
                  onChange={(e) => setIncludeGoals(e.target.checked)}
                />
                <span>Включить финансовые цели</span>
              </label>

              <label className="share__option">
                <input
                  type="checkbox"
                  checked={includeTransactions}
                  onChange={(e) => setIncludeTransactions(e.target.checked)}
                />
                <span>Включить фактические траты</span>
              </label>

              <button type="button" className="btn btn--primary btn--full" onClick={handleCopyLegacy}>
                {copied ? 'Ссылка скопирована' : 'Копировать ссылку'}
              </button>
            </>
          )}

          {error && <p className="share__error">{error}</p>}
        </div>
      )}
    </div>
  )
}
