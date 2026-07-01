import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'

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
      for (let attempt = 0; attempt < 5; attempt++) {
        if (cancelled) return
        try {
          const res = await fetch('/api/monsters', {
            credentials: 'same-origin',
            redirect: 'manual',
            signal: AbortSignal.timeout(5000),
          })
          if (!cancelled) {
            if (res.ok) {
              setIsAuthenticated(true)
              setIsLoading(false)
              return
            }
            if (attempt < 4) {
              await new Promise((r) => setTimeout(r, 2000))
            }
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
    const params = new URLSearchParams({ username, password })
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
      redirect: 'follow',
      credentials: 'same-origin',
    })
    if (res.ok) {
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
      throw new Error('Invalid credentials')
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/logout', { method: 'POST', credentials: 'same-origin' })
    } catch {
      // network errors are ignored; user is logged out regardless
    } finally {
      setIsAuthenticated(false)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
