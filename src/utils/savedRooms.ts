import { isValidRoomId } from './roomUrl'

export interface SavedRoom {
  id: string
  name: string
}

const STORAGE_KEY = 'finance-saved-rooms-v1'

export function defaultSavedRoomName(roomId: string): string {
  return `Комната ${roomId.slice(0, 8)}…`
}

export function loadSavedRooms(): SavedRoom[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((item): item is SavedRoom => {
        if (!item || typeof item !== 'object') return false
        const record = item as Partial<SavedRoom>
        return isValidRoomId(record.id)
      })
      .map((item) => ({
        id: item.id,
        name: item.name?.trim() || defaultSavedRoomName(item.id),
      }))
  } catch {
    return []
  }
}

export function saveSavedRooms(rooms: SavedRoom[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms))
}

export function upsertSavedRoom(room: SavedRoom): SavedRoom[] {
  const name = room.name.trim() || defaultSavedRoomName(room.id)
  const rooms = loadSavedRooms()
  const index = rooms.findIndex((item) => item.id === room.id)

  if (index >= 0) {
    if (rooms[index].name === name) return rooms
    rooms[index] = { ...rooms[index], name }
  } else {
    rooms.unshift({ id: room.id, name })
  }

  saveSavedRooms(rooms)
  return rooms
}

export function removeSavedRoomFromList(roomId: string): SavedRoom[] {
  const rooms = loadSavedRooms().filter((room) => room.id !== roomId)
  saveSavedRooms(rooms)
  return rooms
}
