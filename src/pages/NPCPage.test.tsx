import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NPCPage from './NPCPage'

const mockFetchNPCs = vi.fn()
const mockFetchMaps = vi.fn()
const mockCreateNPC = vi.fn()

vi.mock('../api/npcs', () => ({
  fetchNPCs: (...args: unknown[]) => mockFetchNPCs(...args),
  createNPC: (...args: unknown[]) => mockCreateNPC(...args),
}))

vi.mock('../api/maps', () => ({
  fetchMaps: (...args: unknown[]) => mockFetchMaps(...args),
}))

function makeNPC(overrides: Record<string, unknown> = {}) {
  return { id: 1, name: 'Eldrin', location: 'Forest', occupation: 'Scout', history: 'Grew up in woods', personality: 'Brave', worldMapId: null, ownerUsername: 'user', ...overrides }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('NPCPage', () => {
  it('shows loading spinner initially', () => {
    mockFetchNPCs.mockReturnValue(new Promise(() => {}))
    mockFetchMaps.mockReturnValue(new Promise(() => {}))
    render(<NPCPage />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders NPC manager heading after load', async () => {
    mockFetchNPCs.mockResolvedValue([])
    mockFetchMaps.mockResolvedValue([])
    render(<NPCPage />)
    expect(await screen.findByText('NPC Manager')).toBeInTheDocument()
  })

  it('renders create form fields', async () => {
    mockFetchNPCs.mockResolvedValue([])
    mockFetchMaps.mockResolvedValue([])
    render(<NPCPage />)
    expect(await screen.findByLabelText('Name:')).toBeInTheDocument()
    expect(screen.getByLabelText('Location:')).toBeInTheDocument()
    expect(screen.getByLabelText('Occupation:')).toBeInTheDocument()
    expect(screen.getByLabelText('History:')).toBeInTheDocument()
    expect(screen.getByLabelText('Personality:')).toBeInTheDocument()
  })

  it('shows empty state when no NPCs exist', async () => {
    mockFetchNPCs.mockResolvedValue([])
    mockFetchMaps.mockResolvedValue([])
    render(<NPCPage />)
    expect(await screen.findByText('No NPCs yet.')).toBeInTheDocument()
  })

  it('creates NPC and refreshes list', async () => {
    mockFetchNPCs.mockResolvedValueOnce([]).mockResolvedValueOnce([makeNPC()])
    mockFetchMaps.mockResolvedValue([])
    mockCreateNPC.mockResolvedValue(makeNPC())
    render(<NPCPage />)
    await screen.findByText('NPC Manager')
    fireEvent.change(screen.getByLabelText('Name:'), { target: { value: 'Eldrin' } })
    fireEvent.click(screen.getByText('Create NPC'))
    await vi.waitFor(() => {
      expect(mockCreateNPC).toHaveBeenCalledWith(expect.objectContaining({ name: 'Eldrin' }))
    })
    await screen.findByText('Eldrin')
  })

  it('shows validation error when name is empty', async () => {
    mockFetchNPCs.mockResolvedValue([])
    mockFetchMaps.mockResolvedValue([])
    render(<NPCPage />)
    await screen.findByText('NPC Manager')
    fireEvent.click(screen.getByText('Create NPC'))
    expect(screen.getByText('Name is required')).toBeInTheDocument()
  })

  it('groups NPCs by location with Unknown sorted last', async () => {
    mockFetchNPCs.mockResolvedValue([
      makeNPC({ id: 1, name: 'A', location: 'Forest' }),
      makeNPC({ id: 2, name: 'B', location: 'Unknown' }),
      makeNPC({ id: 3, name: 'C', location: 'Castle' }),
    ])
    mockFetchMaps.mockResolvedValue([])
    render(<NPCPage />)
    const headings = await screen.findAllByRole('heading', { level: 4 })
    const locationTexts = headings.map(h => h.textContent)
    const forestIdx = locationTexts.findIndex(t => t?.startsWith('Forest'))
    const castleIdx = locationTexts.findIndex(t => t?.startsWith('Castle'))
    const unknownIdx = locationTexts.findIndex(t => t?.startsWith('Unknown'))
    expect(forestIdx).toBeGreaterThanOrEqual(0)
    expect(castleIdx).toBeGreaterThanOrEqual(0)
    expect(unknownIdx).toBeGreaterThan(Math.max(forestIdx, castleIdx))
  })

  it('shows error toast on load failure', async () => {
    mockFetchNPCs.mockRejectedValue(new Error('fail'))
    mockFetchMaps.mockResolvedValue([])
    render(<NPCPage />)
    expect(await screen.findByText('Failed to load NPCs')).toBeInTheDocument()
  })

  it('shows error toast on create NPC failure', async () => {
    mockFetchNPCs.mockResolvedValue([])
    mockFetchMaps.mockResolvedValue([])
    mockCreateNPC.mockRejectedValue(new Error('fail'))
    render(<NPCPage />)
    await screen.findByText('NPC Manager')
    fireEvent.change(screen.getByLabelText('Name:'), { target: { value: 'Eldrin' } })
    fireEvent.click(screen.getByText('Create NPC'))
    expect(await screen.findByText('Failed to create NPC')).toBeInTheDocument()
  })

  it('collapses and expands location group', async () => {
    mockFetchNPCs.mockResolvedValue([makeNPC({ id: 1, name: 'Eldrin', location: 'Forest' })])
    mockFetchMaps.mockResolvedValue([])
    render(<NPCPage />)
    await screen.findByText('Eldrin')
    const header = screen.getByText('Forest (1)')
    fireEvent.click(header)
    expect(screen.queryByText('Eldrin')).not.toBeInTheDocument()
    fireEvent.click(header)
    expect(screen.getByText('Eldrin')).toBeInTheDocument()
  })

  it('expands NPC card to show details', async () => {
    mockFetchNPCs.mockResolvedValue([makeNPC({ id: 1, name: 'Eldrin', location: 'Forest' })])
    mockFetchMaps.mockResolvedValue([])
    render(<NPCPage />)
    await screen.findByText('Eldrin')
    fireEvent.click(screen.getByText('Eldrin'))
    expect(screen.getByText(/Scout/)).toBeInTheDocument()
    expect(screen.getByText(/Brave/)).toBeInTheDocument()
    expect(screen.getByText(/Grew up in woods/)).toBeInTheDocument()
  })
})
