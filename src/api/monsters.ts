import { get } from './client'
import type { Monster } from './types'

export function fetchMonsters(): Promise<Monster[]> {
  return get<Monster[]>('/api/monsters')
}

export function fetchMonster(id: number): Promise<Monster> {
  return get<Monster>(`/api/monsters/${id}`)
}
