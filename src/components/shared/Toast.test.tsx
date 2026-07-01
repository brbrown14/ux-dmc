import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { Toast } from './Toast'

describe('Toast', () => {
  const onDismiss = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders message', () => {
    render(<Toast message="Hello" type="success" onDismiss={onDismiss} />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('renders dismiss button', () => {
    render(<Toast message="Test" type="error" onDismiss={onDismiss} />)
    expect(screen.getByLabelText('Dismiss')).toBeInTheDocument()
  })

  it('calls onDismiss when dismiss button clicked', () => {
    render(<Toast message="Test" type="info" onDismiss={onDismiss} />)
    fireEvent.click(screen.getByLabelText('Dismiss'))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('auto-dismisses after default duration (3000ms)', () => {
    render(<Toast message="Auto" type="success" onDismiss={onDismiss} />)
    expect(onDismiss).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(3000) })
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('auto-dismisses after custom duration', () => {
    render(<Toast message="Custom" type="success" onDismiss={onDismiss} duration={5000} />)
    act(() => { vi.advanceTimersByTime(3000) })
    expect(onDismiss).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(2000) })
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('cleans up timer on unmount', () => {
    const { unmount } = render(<Toast message="Cleanup" type="success" onDismiss={onDismiss} />)
    unmount()
    act(() => { vi.advanceTimersByTime(3000) })
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('has role="alert" for accessibility', () => {
    render(<Toast message="Alert" type="error" onDismiss={onDismiss} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
