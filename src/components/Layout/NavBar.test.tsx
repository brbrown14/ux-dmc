import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { NavBar } from './NavBar'

const mockLogout = vi.fn()

vi.mock('../../contexts/useAuth', () => ({
  useAuth: () => ({ logout: mockLogout }),
}))

describe('NavBar', () => {
  it('renders brand and all nav links', () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>,
    )
    expect(screen.getByText('DMC')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('NPCs')).toBeInTheDocument()
    expect(screen.getByText('Encounters')).toBeInTheDocument()
    expect(screen.getByText('Maps')).toBeInTheDocument()
    expect(screen.getByText('Story')).toBeInTheDocument()
  })

  it('renders logout button', () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>,
    )
    expect(screen.getByText('Log Out')).toBeInTheDocument()
  })

  it('toggles hamburger menu', () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>,
    )
    const hamburger = screen.getByLabelText('Open menu')
    fireEvent.click(hamburger)
    expect(screen.getByLabelText('Close menu')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Close menu'))
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument()
  })

  it('calls logout on logout click', () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText('Log Out'))
    expect(mockLogout).toHaveBeenCalledOnce()
  })
})
