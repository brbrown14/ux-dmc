import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AuthProvider } from './AuthContext'
import { useAuth } from './useAuth'

function setupFetchMock(status: number, ok?: boolean) {
  return vi.fn().mockResolvedValue({
    ok: ok ?? (status >= 200 && status < 300),
    status,
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
  globalThis.fetch = vi.fn()
})

describe('AuthProvider', () => {
  it('starts with loading true and checks auth on mount', async () => {
    globalThis.fetch = setupFetchMock(200)
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
    await vi.waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAuthenticated).toBe(true)
    expect(fetch).toHaveBeenCalledWith('/api/monsters', expect.objectContaining({ credentials: 'same-origin' }))
  })

  it('sets authenticated to false after failed auth check', async () => {
    globalThis.fetch = setupFetchMock(401, false)
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await vi.waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 30000, interval: 100 })
    expect(result.current.isAuthenticated).toBe(false)
  }, 35000)

  it('login sets authenticated to true on success', async () => {
    globalThis.fetch = setupFetchMock(200)
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await vi.waitFor(() => expect(result.current.isLoading).toBe(false))
    globalThis.fetch = setupFetchMock(200)
    await act(async () => { await result.current.login('user', 'pass') })
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('login throws on failure and does not authenticate', async () => {
    globalThis.fetch = setupFetchMock(200)
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await vi.waitFor(() => expect(result.current.isLoading).toBe(false))
    globalThis.fetch = setupFetchMock(401, false)
    await act(async () => {
      await expect(result.current.login('bad', 'creds')).rejects.toThrow('Invalid credentials')
    })
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('logout sets authenticated to false', async () => {
    globalThis.fetch = setupFetchMock(200)
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await vi.waitFor(() => expect(result.current.isLoading).toBe(false))
    globalThis.fetch = setupFetchMock(200)
    await act(async () => { await result.current.logout() })
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('logout sets authenticated to false even on fetch failure', async () => {
    globalThis.fetch = setupFetchMock(200)
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await vi.waitFor(() => expect(result.current.isLoading).toBe(false))
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    await act(async () => { await result.current.logout() })
    expect(result.current.isAuthenticated).toBe(false)
  })
})
