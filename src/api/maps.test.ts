import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchMaps, fetchMap, uploadMap, updateMap, getMapImageUrl } from './maps'

vi.mock('./client', () => ({
  get: vi.fn(),
  put: vi.fn(),
  postFormData: vi.fn(),
}))

import { get, put, postFormData } from './client'

const mockGet = vi.mocked(get)
const mockPut = vi.mocked(put)
const mockPostFormData = vi.mocked(postFormData)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchMaps', () => {
  it('calls get with /api/maps', async () => {
    mockGet.mockResolvedValue([{ id: 1, title: 'World' }])
    const result = await fetchMaps()
    expect(mockGet).toHaveBeenCalledWith('/api/maps')
    expect(result).toEqual([{ id: 1, title: 'World' }])
  })
})

describe('fetchMap', () => {
  it('calls get with map id', async () => {
    mockGet.mockResolvedValue({ id: 2, title: 'Forest' })
    const result = await fetchMap(2)
    expect(mockGet).toHaveBeenCalledWith('/api/maps/2')
    expect(result.title).toBe('Forest')
  })
})

describe('uploadMap', () => {
  it('posts form data to /api/maps', async () => {
    const fd = new FormData()
    fd.append('title', 'Test')
    mockPostFormData.mockResolvedValue({ id: 3, title: 'Test' })
    const result = await uploadMap(fd)
    expect(mockPostFormData).toHaveBeenCalledWith('/api/maps', fd)
    expect(result.title).toBe('Test')
  })
})

describe('updateMap', () => {
  it('puts updated map data', async () => {
    mockPut.mockResolvedValue({ id: 1, title: 'Updated', description: 'Desc' })
    const result = await updateMap(1, { title: 'Updated', description: 'Desc' })
    expect(mockPut).toHaveBeenCalledWith('/api/maps/1', { title: 'Updated', description: 'Desc' })
    expect(result.title).toBe('Updated')
  })
})

describe('getMapImageUrl', () => {
  it('returns encoded URL for filename', () => {
    expect(getMapImageUrl('my map.png')).toBe('/api/maps/image/my%20map.png')
  })

  it('handles special characters', () => {
    expect(getMapImageUrl('foo/bar.jpg')).toBe('/api/maps/image/foo%2Fbar.jpg')
  })
})
