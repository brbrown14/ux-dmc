import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchEncounters, fetchEncounter, createEncounter, deleteEncounter, addMonsterToEncounter, updateMonsterInEncounter, removeMonsterFromEncounter } from './encounters'

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

describe('fetchEncounters', () => {
  it('calls get with /api/encounters', async () => {
    mockGet.mockResolvedValue([{ id: 1, name: 'Test' }])
    const result = await fetchEncounters()
    expect(mockGet).toHaveBeenCalledWith('/api/encounters')
    expect(result).toEqual([{ id: 1, name: 'Test' }])
  })
})

describe('fetchEncounter', () => {
  it('calls get with encounter id', async () => {
    mockGet.mockResolvedValue({ encounter: { id: 1 }, monsters: [] })
    const result = await fetchEncounter(1)
    expect(mockGet).toHaveBeenCalledWith('/api/encounters/1')
    expect(result.encounter.id).toBe(1)
  })
})

describe('createEncounter', () => {
  it('posts name to /api/encounters', async () => {
    mockPost.mockResolvedValue({ id: 2, name: 'Fight' })
    const result = await createEncounter('Fight')
    expect(mockPost).toHaveBeenCalledWith('/api/encounters', { name: 'Fight' })
    expect(result.name).toBe('Fight')
  })
})

describe('deleteEncounter', () => {
  it('deletes by id', async () => {
    mockDel.mockResolvedValue(undefined)
    await deleteEncounter(5)
    expect(mockDel).toHaveBeenCalledWith('/api/encounters/5')
  })
})

describe('addMonsterToEncounter', () => {
  it('posts monster to encounter', async () => {
    mockPost.mockResolvedValue({ id: 10 })
    const result = await addMonsterToEncounter(1, { monsterId: 3, quantity: 2 })
    expect(mockPost).toHaveBeenCalledWith('/api/encounters/1/monsters', { monsterId: 3, quantity: 2 })
    expect(result.id).toBe(10)
  })
})

describe('updateMonsterInEncounter', () => {
  it('puts updated monster data', async () => {
    mockPut.mockResolvedValue(undefined)
    await updateMonsterInEncounter(1, 10, { quantity: 5 })
    expect(mockPut).toHaveBeenCalledWith('/api/encounters/1/monsters/10', { quantity: 5 })
  })
})

describe('removeMonsterFromEncounter', () => {
  it('deletes monster link by id', async () => {
    mockDel.mockResolvedValue(undefined)
    await removeMonsterFromEncounter(1, 10)
    expect(mockDel).toHaveBeenCalledWith('/api/encounters/1/monsters/10')
  })
})
