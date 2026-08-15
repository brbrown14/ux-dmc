import { get, post, put, del } from './client'
import type { MagicItem } from './types'

export interface MagicItemQuery {
  q?: string
  rarity?: string
  type?: string
  source?: string
}

export interface MagicItemInput {
  name: string
  description: string
  rarity: string | null
  type: string | null
  weight: string | null
  requiresAttunement: boolean | null
  attunement: string | null
}

function buildQuery(params?: MagicItemQuery): string {
  if (!params) return ''
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.rarity) search.set('rarity', params.rarity)
  if (params.type) search.set('type', params.type)
  if (params.source) search.set('source', params.source)
  const query = search.toString()
  return query ? `?${query}` : ''
}

export function fetchMagicItems(params?: MagicItemQuery): Promise<MagicItem[]> {
  return get<MagicItem[]>(`/api/magic-items${buildQuery(params)}`)
}

export function fetchMagicItem(id: number): Promise<MagicItem> {
  return get<MagicItem>(`/api/magic-items/${id}`)
}

export function fetchMagicItemVariants(id: number): Promise<MagicItem[]> {
  return get<MagicItem[]>(`/api/magic-items/${id}/variants`)
}

export function createMagicItem(item: MagicItemInput): Promise<MagicItem> {
  return post<MagicItem>('/api/magic-items', item)
}

export function updateMagicItem(id: number, item: MagicItemInput): Promise<MagicItem> {
  return put<MagicItem>(`/api/magic-items/${id}`, item)
}

export function deleteMagicItem(id: number): Promise<void> {
  return del<void>(`/api/magic-items/${id}`)
}
