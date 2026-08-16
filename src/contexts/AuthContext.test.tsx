import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AuthProvider } from './AuthContext'
import { useAuth } from './useAuth'

function setupFetchMock(status: number, ok?: boolean, body: { authenticated: boolean } = { authenticated: true }) {
  return vi.fn().mockResolvedValue({
    ok: ok ?? (status >= 200 && status < 300),
    status,
    json: vi.fn().mockResolvedValue(body),
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
  globalThis.fetch = vi.fn()
  localStorage.clear()
})

describe('AuthProvider', () => {
  it('starts with loading true and checks auth on mount', async () => {
    globalThis.fetch = setupFetchMock(200)
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
    await vi.waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAuthenticated).toBe(true)
    expect(fetch).toHaveBeenCalledWith('/api/auth/status', expect.objectContaining({ credentials: 'same-origin' }))
  })

  it('sets authenticated to false when not logged in', async () => {
    globalThis.fetch = setupFetchMock(200, true, { authenticated: false })
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await vi.waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAuthenticated).toBe(false)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('login sets authenticated to true on success and stores token', async () => {
    globalThis.fetch = setupFetchMock(200)
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await vi.waitFor(() => expect(result.current.isLoading).toBe(false))
    globalThis.fetch = setupFetchMock(200)
    await act(async () => { await result.current.login('user', 'pass') })
    expect(result.current.isAuthenticated).toBe(true)
    expect(localStorage.getItem('dmc-basic-token')).toBe(btoa('user:pass'))
    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/status',
      expect.objectContaining({ headers: { Authorization: `Basic ${btoa('user:pass')}` } }),
    )
  })

  it('login throws on failure and does not authenticate', async () => {
    globalThis.fetch = setupFetchMock(200)
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await vi.waitFor(() => expect(result.current.isLoading).toBe(false))
    globalThis.fetch = setupFetchMock(200, true, { authenticated: false })
    await act(async () => {
      await expect(result.current.login('bad', 'creds')).rejects.toThrow('Invalid credentials')
    })
    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('dmc-basic-token')).toBeNull()
  })

  it('logout sets authenticated to false and clears token', async () => {
    localStorage.setItem('dmc-basic-token', btoa('user:pass'))
    globalThis.fetch = setupFetchMock(200, true, { authenticated: true })
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await vi.waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAuthenticated).toBe(true)
    await act(async () => { await result.current.logout() })
    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('dmc-basic-token')).toBeNull()
  })
})
