import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Layout } from './Layout'

vi.mock('../../contexts/useAuth', () => ({
  useAuth: () => ({ logout: vi.fn() }),
}))

describe('Layout', () => {
  it('renders navigation bar', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    )
    expect(screen.getByText('DMC')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('NPCs')).toBeInTheDocument()
    expect(screen.getByText('Encounters')).toBeInTheDocument()
    expect(screen.getByText('Maps')).toBeInTheDocument()
    expect(screen.getByText('Story')).toBeInTheDocument()
  })
})
