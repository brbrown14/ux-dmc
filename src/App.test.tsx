import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

vi.mock('./contexts/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  AuthContext: null,
}))

vi.mock('./hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}))

vi.mock('./pages/LoginPage', () => ({
  default: () => <div>Login Page</div>,
}))

vi.mock('./pages/DashboardPage', () => ({
  default: () => <div>Dashboard Page</div>,
}))

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(document.body).toBeDefined()
  })

  it('renders login page at /login', async () => {
    window.history.pushState({}, '', '/login')
    render(<App />)
    expect(await screen.findByText('Login Page')).toBeInTheDocument()
  })
})
