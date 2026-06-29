import { get, put, postFormData } from './client'
import type { WorldMap, MapUpdateRequest } from './types'

export function fetchMaps(): Promise<WorldMap[]> {
  return get<WorldMap[]>('/api/maps')
}

export function fetchMap(id: number): Promise<WorldMap> {
  return get<WorldMap>(`/api/maps/${id}`)
}

export function uploadMap(formData: FormData): Promise<WorldMap> {
  return postFormData<WorldMap>('/api/maps', formData)
}

export function updateMap(id: number, data: MapUpdateRequest): Promise<WorldMap> {
  return put<WorldMap>(`/api/maps/${id}`, data)
}

export function getMapImageUrl(filename: string): string {
  return `/api/maps/image/${encodeURIComponent(filename)}`
}
