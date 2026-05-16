import { get, post } from './client'
import type { NPC } from './types'

export function fetchNPCs(): Promise<NPC[]> {
  return get<NPC[]>('/api/npcs')
}

export function createNPC(npc: Omit<NPC, 'id' | 'ownerUsername'>): Promise<NPC> {
  return post<NPC>('/api/npcs', npc)
}

export function fetchNPCsByMap(mapId: number): Promise<NPC[]> {
  return get<NPC[]>(`/api/maps/${mapId}/npcs`)
}
