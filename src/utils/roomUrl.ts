const ROOM_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isValidRoomId(value: string | null | undefined): value is string {
  return Boolean(value && ROOM_ID_PATTERN.test(value))
}

export function readRoomIdFromUrl(location: Pick<Location, 'hash'> = window.location): string | null {
  const raw = location.hash.replace(/^#/, '')
  if (!raw || raw.startsWith('p=')) return null

  const params = new URLSearchParams(raw.includes('=') ? raw : `room=${raw}`)
  const roomId = params.get('room')
  return isValidRoomId(roomId) ? roomId : null
}

export function buildRoomUrl(roomId: string, location: Pick<Location, 'href'> = window.location): string {
  const url = new URL(location.href)
  url.search = ''
  url.hash = `room=${roomId}`
  return url.toString()
}

export function setRoomInUrl(roomId: string): void {
  window.history.replaceState(null, '', buildRoomUrl(roomId))
}

export function clearRoomFromUrl(): void {
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  window.history.replaceState(null, '', url.toString())
}

const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i

function extractRoomIdFromText(value: string): string | null {
  const match = value.match(UUID_PATTERN)
  return isValidRoomId(match?.[0]) ? match[0] : null
}

export function parseRoomIdFromInput(input: string): string | null {
  const value = input.trim()
  if (!value) return null
  if (isValidRoomId(value)) return value

  try {
    const fromUrl = readRoomIdFromUrl(new URL(value))
    if (fromUrl) return fromUrl
  } catch {
    // not a full URL — try to extract uuid below
  }

  return extractRoomIdFromText(value)
}
