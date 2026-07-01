import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StoryPlannerPage from './StoryPlannerPage'

const mockFetchChapters = vi.fn()
const mockCreateChapter = vi.fn()
const mockUpdateChapter = vi.fn()

vi.mock('../api/story', () => ({
  fetchChapters: (...args: unknown[]) => mockFetchChapters(...args),
  createChapter: (...args: unknown[]) => mockCreateChapter(...args),
  updateChapter: (...args: unknown[]) => mockUpdateChapter(...args),
}))

function makeChapter(overrides: Record<string, unknown> = {}) {
  return { id: 1, title: 'Prologue', content: 'Once upon a time...', ownerUsername: 'user', ...overrides }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('StoryPlannerPage', () => {
  it('shows loading spinner initially', () => {
    mockFetchChapters.mockReturnValue(new Promise(() => {}))
    render(<StoryPlannerPage />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders heading after load', async () => {
    mockFetchChapters.mockResolvedValue([])
    render(<StoryPlannerPage />)
    expect(await screen.findByText('Game Story Planner')).toBeInTheDocument()
  })

  it('shows empty state when no chapters', async () => {
    mockFetchChapters.mockResolvedValue([])
    render(<StoryPlannerPage />)
    expect(await screen.findByText('No chapters yet.')).toBeInTheDocument()
  })

  it('renders chapter list', async () => {
    mockFetchChapters.mockResolvedValue([makeChapter()])
    render(<StoryPlannerPage />)
    expect(await screen.findByText('Prologue')).toBeInTheDocument()
  })

  it('selects chapter on click', async () => {
    mockFetchChapters.mockResolvedValue([makeChapter()])
    render(<StoryPlannerPage />)
    await screen.findByText('Prologue')
    fireEvent.click(screen.getByText('Prologue'))
    const titleInput = screen.getByLabelText('Title:') as HTMLInputElement
    expect(titleInput.value).toBe('Prologue')
    expect(screen.getByText('Edit Chapter')).toBeInTheDocument()
  })

  it('creates a new chapter', async () => {
    mockFetchChapters.mockResolvedValueOnce([]).mockResolvedValueOnce([makeChapter({ id: 1, title: 'New', content: 'Content' })])
    mockCreateChapter.mockResolvedValue(makeChapter({ id: 1, title: 'New', content: 'Content' }))
    render(<StoryPlannerPage />)
    await screen.findByText('Game Story Planner')
    fireEvent.click(screen.getByText('+ New Chapter'))
    fireEvent.change(screen.getByLabelText('Title:'), { target: { value: 'New' } })
    fireEvent.change(screen.getByLabelText('Content:'), { target: { value: 'Content' } })
    fireEvent.click(screen.getByText('Save Chapter'))
    await vi.waitFor(() => {
      expect(mockCreateChapter).toHaveBeenCalledWith({ title: 'New', content: 'Content' })
    })
  })

  it('updates an existing chapter', async () => {
    mockFetchChapters.mockResolvedValueOnce([makeChapter()]).mockResolvedValueOnce([makeChapter({ title: 'Updated' })])
    mockUpdateChapter.mockResolvedValue(makeChapter({ id: 1, title: 'Updated', content: 'New content' }))
    render(<StoryPlannerPage />)
    await screen.findByText('Prologue')
    fireEvent.click(screen.getByText('Prologue'))
    fireEvent.change(screen.getByLabelText('Title:'), { target: { value: 'Updated' } })
    fireEvent.change(screen.getByLabelText('Content:'), { target: { value: 'New content' } })
    fireEvent.click(screen.getByText('Save Chapter'))
    await vi.waitFor(() => {
      expect(mockUpdateChapter).toHaveBeenCalledWith(1, { title: 'Updated', content: 'New content' })
    })
  })

  it('validates required fields', async () => {
    mockFetchChapters.mockResolvedValue([])
    render(<StoryPlannerPage />)
    await screen.findByText('Game Story Planner')
    fireEvent.click(screen.getByText('Save Chapter'))
    expect(screen.getByText('Title and content are required')).toBeInTheDocument()
  })

  it('clears form with New Chapter button', async () => {
    mockFetchChapters.mockResolvedValue([makeChapter()])
    render(<StoryPlannerPage />)
    await screen.findByText('Prologue')
    fireEvent.click(screen.getByText('Prologue'))
    fireEvent.click(screen.getByText('Clear'))
    const titleInput = screen.getByLabelText('Title:') as HTMLInputElement
    expect(titleInput.value).toBe('')
    expect(screen.getByText('New Chapter')).toBeInTheDocument()
  })

  it('shows preview for long content', async () => {
    const longContent = 'a'.repeat(100)
    mockFetchChapters.mockResolvedValue([makeChapter({ content: longContent })])
    render(<StoryPlannerPage />)
    expect(await screen.findByText(longContent.substring(0, 80) + '...')).toBeInTheDocument()
  })

  it('shows full content for short content', async () => {
    const shortContent = 'Short text'
    mockFetchChapters.mockResolvedValue([makeChapter({ content: shortContent })])
    render(<StoryPlannerPage />)
    expect(await screen.findByText(shortContent)).toBeInTheDocument()
  })
})
