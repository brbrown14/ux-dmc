import { get, post, put, del } from './client'
import type { Encounter, EncounterDetail, AddMonsterRequest, UpdateMonsterRequest } from './types'

export function fetchEncounters(): Promise<Encounter[]> {
  return get<Encounter[]>('/api/encounters')
}

export function fetchEncounter(id: number): Promise<EncounterDetail> {
  return get<EncounterDetail>(`/api/encounters/${id}`)
}

export function createEncounter(name: string): Promise<Encounter> {
  return post<Encounter>('/api/encounters', { name })
}

export function deleteEncounter(id: number): Promise<void> {
  return del<void>(`/api/encounters/${id}`)
}

export function addMonsterToEncounter(encounterId: number, req: AddMonsterRequest): Promise<{ id: number }> {
  return post(`/api/encounters/${encounterId}/monsters`, req)
}

export function updateMonsterInEncounter(
  encounterId: number,
  linkId: number,
  req: UpdateMonsterRequest,
): Promise<void> {
  return put<void>(`/api/encounters/${encounterId}/monsters/${linkId}`, req)
}

export function removeMonsterFromEncounter(encounterId: number, linkId: number): Promise<void> {
  return del<void>(`/api/encounters/${encounterId}/monsters/${linkId}`)
}
