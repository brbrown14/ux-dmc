import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { getAuthToken, setAuthToken, clearAuthToken } from '../api/auth'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function checkAuth() {
      const token = getAuthToken()
      for (let attempt = 0; attempt < 5; attempt++) {
        if (cancelled) return
        try {
          const res = await fetch('/api/auth/status', {
            credentials: 'same-origin',
            redirect: 'manual',
            signal: AbortSignal.timeout(5000),
            headers: token ? { Authorization: `Basic ${token}` } : {},
          })
          if (!cancelled && res.ok) {
            const body = (await res.json()) as { authenticated: boolean }
            if (!body.authenticated) clearAuthToken()
            setIsAuthenticated(body.authenticated)
            setIsLoading(false)
            return
          }
          if (attempt < 4) {
            await new Promise((r) => setTimeout(r, 2000))
          }
        } catch {
          if (attempt < 4) {
            await new Promise((r) => setTimeout(r, 2000))
          }
        }
      }
      if (!cancelled) setIsLoading(false)
    }

    checkAuth()
    return () => { cancelled = true }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const token = btoa(`${username}:${password}`)
    const res = await fetch('/api/auth/status', {
      headers: { Authorization: `Basic ${token}` },
      credentials: 'same-origin',
    })
    if (res.ok) {
      const body = (await res.json()) as { authenticated: boolean }
      if (body.authenticated) {
        setAuthToken(token)
        setIsAuthenticated(true)
        return
      }
    }
    clearAuthToken()
    setIsAuthenticated(false)
    throw new Error('Invalid credentials')
  }, [])

  const logout = useCallback(async () => {
    clearAuthToken()
    setIsAuthenticated(false)
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
