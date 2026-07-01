import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DashboardPage from './DashboardPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('DashboardPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('renders heading', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )
    expect(screen.getByText("Dungeon Master's Companion")).toBeInTheDocument()
  })

  it('renders all four tool cards', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('NPC Tool')).toBeInTheDocument()
    expect(screen.getByText('Encounter Builder')).toBeInTheDocument()
    expect(screen.getByText('World Map')).toBeInTheDocument()
    expect(screen.getByText('Game Story Line')).toBeInTheDocument()
  })

  it('navigates to npcs on card click', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText('NPC Tool'))
    expect(mockNavigate).toHaveBeenCalledWith('/npcs')
  })

  it('navigates to encounters on card click', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText('Encounter Builder'))
    expect(mockNavigate).toHaveBeenCalledWith('/encounters')
  })

  it('navigates to maps on card click', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText('World Map'))
    expect(mockNavigate).toHaveBeenCalledWith('/maps')
  })

  it('navigates to story on card click', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText('Game Story Line'))
    expect(mockNavigate).toHaveBeenCalledWith('/story')
  })

  it('renders logout form', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })
})
