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
    fetch('/api/monsters', {
      credentials: 'same-origin',
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
    })
      .then((res) => {
        if (!cancelled) setIsAuthenticated(res.ok)
      })
      .catch(() => {
        if (!cancelled) setIsAuthenticated(false)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const params = new URLSearchParams({ username, password })
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
      redirect: 'manual',
      credentials: 'same-origin',
    })
    if (res.ok || res.type === 'opaqueredirect') {
      setIsAuthenticated(true)
    } else {
      throw new Error('Invalid credentials')
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/logout', { method: 'POST', credentials: 'same-origin' })
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
