import { describe, expect, it } from 'vitest'
import {
  buildRoomUrl,
  isValidRoomId,
  parseRoomIdFromInput,
  readRoomIdFromUrl,
} from './roomUrl'

describe('roomUrl', () => {
  const roomId = '550e8400-e29b-41d4-a716-446655440000'

  it('validates UUID room ids', () => {
    expect(isValidRoomId(roomId)).toBe(true)
    expect(isValidRoomId('not-a-uuid')).toBe(false)
    expect(isValidRoomId(null)).toBe(false)
  })

  it('reads room id from hash', () => {
    expect(readRoomIdFromUrl({ hash: `#room=${roomId}` })).toBe(roomId)
    expect(readRoomIdFromUrl({ hash: `#${roomId}` })).toBe(roomId)
    expect(readRoomIdFromUrl({ hash: '#p=abc' })).toBeNull()
    expect(readRoomIdFromUrl({ hash: '' })).toBeNull()
  })

  it('builds room url with hash', () => {
    const url = buildRoomUrl(roomId, { href: 'https://example.com/finance/' })
    expect(url).toBe(`https://example.com/finance/#room=${roomId}`)
  })

  it('parses room id from pasted input', () => {
    expect(parseRoomIdFromInput(roomId)).toBe(roomId)
    expect(parseRoomIdFromInput(`https://example.com/finance/#room=${roomId}`)).toBe(roomId)
    expect(parseRoomIdFromInput('not-a-room')).toBeNull()
  })
})
