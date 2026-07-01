import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeToggle } from './ThemeToggle'

const mockToggleTheme = vi.fn()
let mockTheme = 'light'

vi.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: mockTheme, toggleTheme: mockToggleTheme }),
}))

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockTheme = 'light'
    vi.clearAllMocks()
  })

  it('renders with light theme label', () => {
    render(<ThemeToggle />)
    expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument()
  })

  it('renders with dark theme label when dark', () => {
    mockTheme = 'dark'
    render(<ThemeToggle />)
    expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument()
  })

  it('calls toggleTheme on click', () => {
    render(<ThemeToggle />)
    fireEvent.click(screen.getByRole('button'))
    expect(mockToggleTheme).toHaveBeenCalledOnce()
  })
})
