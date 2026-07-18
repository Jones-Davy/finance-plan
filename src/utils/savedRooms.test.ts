import { describe, expect, it } from 'vitest'
import {
  defaultSavedRoomName,
  loadSavedRooms,
  removeSavedRoomFromList,
  upsertSavedRoom,
} from './savedRooms'

describe('savedRooms', () => {
  const roomId = '550e8400-e29b-41d4-a716-446655440000'

  it('upserts and loads saved rooms', () => {
    upsertSavedRoom({ id: roomId, name: 'Семья' })
    expect(loadSavedRooms()).toEqual([{ id: roomId, name: 'Семья' }])
  })

  it('updates room name on upsert', () => {
    upsertSavedRoom({ id: roomId, name: 'Семья' })
    upsertSavedRoom({ id: roomId, name: 'Дом' })
    expect(loadSavedRooms()[0].name).toBe('Дом')
  })

  it('removes room from list', () => {
    upsertSavedRoom({ id: roomId, name: 'Семья' })
    removeSavedRoomFromList(roomId)
    expect(loadSavedRooms()).toEqual([])
  })

  it('uses default name when empty', () => {
    upsertSavedRoom({ id: roomId, name: '   ' })
    expect(loadSavedRooms()[0].name).toBe(defaultSavedRoomName(roomId))
  })
})
