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
  cloudAvailable: boolean
  onCreateRoom: () => Promise<string>
}

export function SharePlanButton({ state, roomId, cloudAvailable, onCreateRoom }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [includeGoals, setIncludeGoals] = useState(true)
  const [includeTransactions, setIncludeTransactions] = useState(true)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

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
      const id = await onCreateRoom()
      await navigator.clipboard.writeText(buildRoomUrl(id))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setError('Не удалось создать общую комнату. Проверьте Supabase.')
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
        Поделиться
      </button>

      {open && (
        <div className="share__popover card">
          <h3>Поделиться бюджетом</h3>

          {cloudAvailable ? (
            <>
              <p className="share__text">
                Общая комната в Supabase: вы и партнёр видите одни данные в реальном времени.
                Ссылка короткая — в ней только ID комнаты.
              </p>

              {roomId ? (
                <button type="button" className="btn btn--primary btn--full" onClick={handleCopyRoom}>
                  {copied ? 'Ссылка скопирована' : 'Копировать ссылку-приглашение'}
                </button>
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
                Облако не настроено — работает старый режим: весь план в ссылке. Для синхронизации с
                партнёром добавьте Supabase (см. DEPLOY.md).
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
