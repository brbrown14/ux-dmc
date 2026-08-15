import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchMagicItems,
  fetchMagicItem,
  fetchMagicItemVariants,
  createMagicItem,
  updateMagicItem,
  deleteMagicItem,
} from './magicItems'

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

describe('fetchMagicItems', () => {
  it('calls get with /api/magic-items', async () => {
    mockGet.mockResolvedValue([{ id: 1, name: 'Alchemy Jug' }])
    const result = await fetchMagicItems()
    expect(mockGet).toHaveBeenCalledWith('/api/magic-items')
    expect(result).toEqual([{ id: 1, name: 'Alchemy Jug' }])
  })

  it('appends query params when provided', async () => {
    mockGet.mockResolvedValue([])
    await fetchMagicItems({ q: 'flame', rarity: 'Rare', type: 'M', source: 'DMG' })
    expect(mockGet).toHaveBeenCalledWith(
      '/api/magic-items?q=flame&rarity=Rare&type=M&source=DMG',
    )
  })

  it('omits query params that are empty', async () => {
    mockGet.mockResolvedValue([])
    await fetchMagicItems({ q: '', rarity: 'Common' })
    expect(mockGet).toHaveBeenCalledWith('/api/magic-items?rarity=Common')
  })
})

describe('fetchMagicItem', () => {
  it('calls get with /api/magic-items/:id', async () => {
    mockGet.mockResolvedValue({ id: 7, name: 'Frost Brand' })
    const result = await fetchMagicItem(7)
    expect(mockGet).toHaveBeenCalledWith('/api/magic-items/7')
    expect(result.name).toBe('Frost Brand')
  })
})

describe('fetchMagicItemVariants', () => {
  it('calls get with /api/magic-items/:id/variants', async () => {
    mockGet.mockResolvedValue([{ id: 8, name: 'Armor +1', isVariant: true }])
    const result = await fetchMagicItemVariants(3)
    expect(mockGet).toHaveBeenCalledWith('/api/magic-items/3/variants')
    expect(result).toHaveLength(1)
    expect(result[0].isVariant).toBe(true)
  })
})

describe('createMagicItem', () => {
  it('posts item data to /api/magic-items', async () => {
    const input = {
      name: 'Staff of Fire',
      description: 'A staff that bursts into flame.',
      rarity: 'Rare',
      type: 'WD',
      weight: null,
      requiresAttunement: true,
      attunement: null,
    }
    mockPost.mockResolvedValue({ id: 9, ...input, custom: true, ownerUsername: 'user' })
    const result = await createMagicItem(input)
    expect(mockPost).toHaveBeenCalledWith('/api/magic-items', input)
    expect(result.name).toBe('Staff of Fire')
    expect(result.custom).toBe(true)
  })
})

describe('updateMagicItem', () => {
  it('puts item data to /api/magic-items/:id', async () => {
    const input = {
      name: 'Staff of Fire',
      description: 'An updated description.',
      rarity: 'Very Rare',
      type: 'WD',
      weight: '4 lb.',
      requiresAttunement: true,
      attunement: null,
    }
    mockPut.mockResolvedValue({ id: 9, ...input, custom: true })
    const result = await updateMagicItem(9, input)
    expect(mockPut).toHaveBeenCalledWith('/api/magic-items/9', input)
    expect(result.rarity).toBe('Very Rare')
  })
})

describe('deleteMagicItem', () => {
  it('calls del with /api/magic-items/:id', async () => {
    mockDel.mockResolvedValue(undefined)
    await deleteMagicItem(5)
    expect(mockDel).toHaveBeenCalledWith('/api/magic-items/5')
  })
})
