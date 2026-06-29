import { get, post, put } from './client'
import type { Chapter } from './types'

export function fetchChapters(): Promise<Chapter[]> {
  return get<Chapter[]>('/api/story/chapters')
}

export function fetchChapter(id: number): Promise<Chapter> {
  return get<Chapter>(`/api/story/chapters/${id}`)
}

export function createChapter(chapter: { title: string; content: string }): Promise<Chapter> {
  return post<Chapter>('/api/story/chapters', chapter)
}

export function updateChapter(id: number, chapter: { title: string; content: string }): Promise<Chapter> {
  return put<Chapter>(`/api/story/chapters/${id}`, chapter)
}
