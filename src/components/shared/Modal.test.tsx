import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from './Modal'

describe('Modal', () => {
  const onClose = vi.fn()
  const title = 'Test Modal'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('does not render when closed', () => {
    const { container } = render(<Modal open={false} onClose={onClose} title={title}><p>Content</p></Modal>)
    expect(container.innerHTML).toBe('')
  })

  it('renders content when open', () => {
    render(<Modal open={true} onClose={onClose} title={title}><p>Content</p></Modal>)
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText(title)).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    render(<Modal open={true} onClose={onClose} title={title}><p>Content</p></Modal>)
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when overlay clicked', () => {
    render(<Modal open={true} onClose={onClose} title={title}><p>Content</p></Modal>)
    const overlay = screen.getByRole('dialog')
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when Escape key pressed', () => {
    render(<Modal open={true} onClose={onClose} title={title}><p>Content</p></Modal>)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not close on Escape when closed', () => {
    render(<Modal open={false} onClose={onClose} title={title}><p>Content</p></Modal>)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('does not close on non-Escape key', () => {
    render(<Modal open={true} onClose={onClose} title={title}><p>Content</p></Modal>)
    fireEvent.keyDown(document, { key: 'Enter' })
    expect(onClose).not.toHaveBeenCalled()
  })
})
