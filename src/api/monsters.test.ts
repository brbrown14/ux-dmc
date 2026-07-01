import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchMonsters, fetchMonster } from './monsters'

vi.mock('./client', () => ({
  get: vi.fn(),
}))

import { get } from './client'

const mockGet = vi.mocked(get)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchMonsters', () => {
  it('calls get with /api/monsters', async () => {
    mockGet.mockResolvedValue([{ id: 1, name: 'Goblin' }])
    const result = await fetchMonsters()
    expect(mockGet).toHaveBeenCalledWith('/api/monsters')
    expect(result).toEqual([{ id: 1, name: 'Goblin' }])
  })
})

describe('fetchMonster', () => {
  it('calls get with monster id', async () => {
    mockGet.mockResolvedValue({ id: 5, name: 'Dragon' })
    const result = await fetchMonster(5)
    expect(mockGet).toHaveBeenCalledWith('/api/monsters/5')
    expect(result.name).toBe('Dragon')
  })
})
