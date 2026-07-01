import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from './LoginPage'

const mockLogin = vi.fn()
const mockNavigate = vi.fn()
const mockUseAuth = vi.fn()

vi.mock('../contexts/useAuth', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ login: mockLogin, isAuthenticated: false })
  })

  it('renders login form', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByText('Log In')).toBeInTheDocument()
  })

  it('calls login on form submit', async () => {
    mockLogin.mockResolvedValue(undefined)
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'user' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } })
    fireEvent.click(screen.getByText('Log In'))
    expect(mockLogin).toHaveBeenCalledWith('user', 'pass')
  })

  it('shows error message on login failure', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'))
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'bad' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'creds' } })
    fireEvent.click(screen.getByText('Log In'))
    await vi.waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('shows generic error when login throws non-Error', async () => {
    mockLogin.mockRejectedValue('string error')
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'u' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'p' } })
    fireEvent.click(screen.getByText('Log In'))
    await vi.waitFor(() => {
      expect(screen.getByText('Unable to connect')).toBeInTheDocument()
    })
  })

  it('disables button while loading', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {}))
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'u' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'p' } })
    fireEvent.click(screen.getByText('Log In'))
    expect(screen.getByText('Logging in...')).toBeInTheDocument()
  })

  it('navigates to / when authenticated', () => {
    mockUseAuth.mockReturnValue({ login: mockLogin, isAuthenticated: true })
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})
