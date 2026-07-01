import { get, post, put, del } from './client'
import type { NPC } from './types'

export function fetchNPCs(): Promise<NPC[]> {
  return get<NPC[]>('/api/npcs')
}

export function createNPC(npc: Omit<NPC, 'id' | 'ownerUsername'>): Promise<NPC> {
  return post<NPC>('/api/npcs', npc)
}

export function updateNPC(id: number, npc: Omit<NPC, 'id' | 'ownerUsername'>): Promise<NPC> {
  return put<NPC>(`/api/npcs/${id}`, npc)
}

export function deleteNPC(id: number): Promise<void> {
  return del<void>(`/api/npcs/${id}`)
}

export function fetchNPCsByMap(mapId: number): Promise<NPC[]> {
  return get<NPC[]>(`/api/maps/${mapId}/npcs`)
}
