import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchNPCs, createNPC, updateNPC, deleteNPC, fetchNPCsByMap } from './npcs'

vi.mock('./client', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}))

import { get, post, put, del } from './client'

const mockGet = vi.mocked(get)
const mockPost = vi.mocked(post)
const mockPut = vi.mocked(put)
const mockDel = vi.mocked(del)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchNPCs', () => {
  it('calls get with /api/npcs', async () => {
    mockGet.mockResolvedValue([{ id: 1, name: 'Eldrin' }])
    const result = await fetchNPCs()
    expect(mockGet).toHaveBeenCalledWith('/api/npcs')
    expect(result).toEqual([{ id: 1, name: 'Eldrin' }])
  })
})

describe('createNPC', () => {
  it('posts npc data to /api/npcs', async () => {
    const npcData = { name: 'Bob', location: 'Town', occupation: '', history: '', personality: '', worldMapId: null }
    mockPost.mockResolvedValue({ id: 2, ...npcData, ownerUsername: 'user' })
    const result = await createNPC(npcData)
    expect(mockPost).toHaveBeenCalledWith('/api/npcs', npcData)
    expect(result.name).toBe('Bob')
    expect(result.ownerUsername).toBe('user')
  })
})

describe('updateNPC', () => {
  it('puts npc data to /api/npcs/:id', async () => {
    const npcData = { name: 'Updated', location: 'Cave', occupation: 'Guard', history: '', personality: '', worldMapId: null }
    mockPut.mockResolvedValue({ id: 3, ...npcData, ownerUsername: 'user' })
    const result = await updateNPC(3, npcData)
    expect(mockPut).toHaveBeenCalledWith('/api/npcs/3', npcData)
    expect(result.name).toBe('Updated')
  })
})

describe('deleteNPC', () => {
  it('calls del with /api/npcs/:id', async () => {
    mockDel.mockResolvedValue(undefined)
    await deleteNPC(5)
    expect(mockDel).toHaveBeenCalledWith('/api/npcs/5')
  })
})

describe('fetchNPCsByMap', () => {
  it('calls get with map id', async () => {
    mockGet.mockResolvedValue([{ id: 1, name: 'Guard', location: 'Castle' }])
    const result = await fetchNPCsByMap(3)
    expect(mockGet).toHaveBeenCalledWith('/api/maps/3/npcs')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Guard')
  })
})
