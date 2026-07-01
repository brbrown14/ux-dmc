import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchChapters, fetchChapter, createChapter, updateChapter } from './story'

vi.mock('./client', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}))

import { get, post, put } from './client'

const mockGet = vi.mocked(get)
const mockPost = vi.mocked(post)
const mockPut = vi.mocked(put)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchChapters', () => {
  it('calls get with /api/story/chapters', async () => {
    mockGet.mockResolvedValue([{ id: 1, title: 'Prologue' }])
    const result = await fetchChapters()
    expect(mockGet).toHaveBeenCalledWith('/api/story/chapters')
    expect(result).toEqual([{ id: 1, title: 'Prologue' }])
  })
})

describe('fetchChapter', () => {
  it('calls get with chapter id', async () => {
    mockGet.mockResolvedValue({ id: 2, title: 'Chapter 1', content: 'Once upon...' })
    const result = await fetchChapter(2)
    expect(mockGet).toHaveBeenCalledWith('/api/story/chapters/2')
    expect(result.title).toBe('Chapter 1')
  })
})

describe('createChapter', () => {
  it('posts chapter data', async () => {
    mockPost.mockResolvedValue({ id: 3, title: 'New', content: 'Story', ownerUsername: 'user' })
    const result = await createChapter({ title: 'New', content: 'Story' })
    expect(mockPost).toHaveBeenCalledWith('/api/story/chapters', { title: 'New', content: 'Story' })
    expect(result.id).toBe(3)
  })
})

describe('updateChapter', () => {
  it('puts updated chapter data', async () => {
    mockPut.mockResolvedValue({ id: 1, title: 'Revised', content: 'Updated', ownerUsername: 'user' })
    const result = await updateChapter(1, { title: 'Revised', content: 'Updated' })
    expect(mockPut).toHaveBeenCalledWith('/api/story/chapters/1', { title: 'Revised', content: 'Updated' })
    expect(result.title).toBe('Revised')
  })
})
