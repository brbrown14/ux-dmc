import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { NavBar } from './NavBar'

const mockLogout = vi.fn().mockResolvedValue(undefined)
const mockNavigate = vi.fn()

vi.mock('../../contexts/useAuth', () => ({
  useAuth: () => ({ logout: mockLogout }),
}))

vi.mock('./ThemeToggle', () => ({
  ThemeToggle: () => <button>Theme</button>,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('NavBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogout.mockResolvedValue(undefined)
  })

  it('renders all nav links', () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>,
    )
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('NPCs')).toBeInTheDocument()
    expect(screen.getByText('Encounters')).toBeInTheDocument()
    expect(screen.getByText('Maps')).toBeInTheDocument()
    expect(screen.getByText('Story')).toBeInTheDocument()
    expect(screen.getByText('Magic Items')).toBeInTheDocument()
  })

  it('hamburger toggles menu open and closed', () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>,
    )
    const openBtn = screen.getByRole('button', { name: /open menu/i })
    fireEvent.click(openBtn)
    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /close menu/i }))
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
  })

  it('calls logout and navigates to /login on logout click', async () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText('Log Out'))
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledOnce()
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })
})
