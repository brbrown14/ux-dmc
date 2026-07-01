import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NPCPage from './NPCPage'

const mockFetchNPCs = vi.fn()
const mockFetchMaps = vi.fn()
const mockCreateNPC = vi.fn()
const mockUpdateNPC = vi.fn()
const mockDeleteNPC = vi.fn()

vi.mock('../api/npcs', () => ({
  fetchNPCs: (...args: unknown[]) => mockFetchNPCs(...args),
  createNPC: (...args: unknown[]) => mockCreateNPC(...args),
  updateNPC: (...args: unknown[]) => mockUpdateNPC(...args),
  deleteNPC: (...args: unknown[]) => mockDeleteNPC(...args),
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

  it('shows edit and delete buttons when NPC card is expanded', async () => {
    mockFetchNPCs.mockResolvedValue([makeNPC({ id: 1, name: 'Eldrin', location: 'Forest' })])
    mockFetchMaps.mockResolvedValue([])
    render(<NPCPage />)
    await screen.findByText('Eldrin')
    fireEvent.click(screen.getByText('Eldrin'))
    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('edit button populates form with NPC data', async () => {
    const npc = makeNPC({ id: 1, name: 'Eldrin', location: 'Forest' })
    mockFetchNPCs.mockResolvedValue([npc])
    mockFetchMaps.mockResolvedValue([])
    mockUpdateNPC.mockResolvedValue(npc)
    render(<NPCPage />)
    await screen.findByText('Eldrin')
    fireEvent.click(screen.getByText('Eldrin'))
    fireEvent.click(screen.getByText('Edit'))
    const nameInput = screen.getByLabelText('Name:') as HTMLInputElement
    expect(nameInput.value).toBe('Eldrin')
    expect(screen.getByLabelText('Occupation:')).toHaveValue('Scout')
    expect(screen.getByText('Update NPC')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('update NPC calls updateAPI and refreshes list', async () => {
    const npc = makeNPC({ id: 1, name: 'Eldrin', location: 'Forest' })
    mockFetchNPCs.mockResolvedValueOnce([npc]).mockResolvedValueOnce([npc])
    mockFetchMaps.mockResolvedValue([])
    mockUpdateNPC.mockResolvedValue(npc)
    render(<NPCPage />)
    await screen.findByText('Eldrin')
    fireEvent.click(screen.getByText('Eldrin'))
    fireEvent.click(screen.getByText('Edit'))
    fireEvent.change(screen.getByLabelText('Name:'), { target: { value: 'Eldrin Updated' } })
    fireEvent.click(screen.getByText('Update NPC'))
    await vi.waitFor(() => {
      expect(mockUpdateNPC).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'Eldrin Updated' }))
    })
  })

  it('cancel editing resets form to create mode', async () => {
    const npc = makeNPC({ id: 1, name: 'Eldrin', location: 'Forest' })
    mockFetchNPCs.mockResolvedValue([npc])
    mockFetchMaps.mockResolvedValue([])
    render(<NPCPage />)
    await screen.findByText('Eldrin')
    fireEvent.click(screen.getByText('Eldrin'))
    fireEvent.click(screen.getByText('Edit'))
    expect(screen.getByText('Update NPC')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.getByText('Create NPC')).toBeInTheDocument()
  })

  it('shows error toast on update failure', async () => {
    mockFetchNPCs.mockResolvedValueOnce([makeNPC({ id: 1, name: 'Eldrin' })])
    mockFetchMaps.mockResolvedValue([])
    mockUpdateNPC.mockRejectedValue(new Error('fail'))
    render(<NPCPage />)
    await screen.findByText('Eldrin')
    fireEvent.click(screen.getByText('Eldrin'))
    fireEvent.click(screen.getByText('Edit'))
    fireEvent.click(screen.getByText('Update NPC'))
    expect(await screen.findByText('Failed to update NPC')).toBeInTheDocument()
  })

  it('delete NPC calls deleteAPI and removes from list', async () => {
    const npc = makeNPC({ id: 1, name: 'Eldrin', location: 'Forest' })
    mockFetchNPCs.mockResolvedValueOnce([npc]).mockResolvedValueOnce([])
    mockFetchMaps.mockResolvedValue([])
    mockDeleteNPC.mockResolvedValue(undefined)
    const originalConfirm = globalThis.confirm
    globalThis.confirm = vi.fn(() => true)
    render(<NPCPage />)
    await screen.findByText('Eldrin')
    fireEvent.click(screen.getByText('Eldrin'))
    fireEvent.click(screen.getByText('Delete'))
    await vi.waitFor(() => {
      expect(mockDeleteNPC).toHaveBeenCalledWith(1)
    })
    expect(await screen.findByText('No NPCs yet.')).toBeInTheDocument()
    globalThis.confirm = originalConfirm
  })

  it('shows confirm dialog before delete and cancels', async () => {
    mockFetchNPCs.mockResolvedValue([makeNPC({ id: 1, name: 'Eldrin' })])
    mockFetchMaps.mockResolvedValue([])
    const originalConfirm = globalThis.confirm
    globalThis.confirm = vi.fn(() => false)
    render(<NPCPage />)
    await screen.findByText('Eldrin')
    fireEvent.click(screen.getByText('Eldrin'))
    fireEvent.click(screen.getByText('Delete'))
    expect(mockDeleteNPC).not.toHaveBeenCalled()
    globalThis.confirm = originalConfirm
  })

  it('shows error toast on delete failure', async () => {
    mockFetchNPCs.mockResolvedValueOnce([makeNPC({ id: 1, name: 'Eldrin' })])
    mockFetchMaps.mockResolvedValue([])
    mockDeleteNPC.mockRejectedValue(new Error('fail'))
    const originalConfirm = globalThis.confirm
    globalThis.confirm = vi.fn(() => true)
    render(<NPCPage />)
    await screen.findByText('Eldrin')
    fireEvent.click(screen.getByText('Eldrin'))
    fireEvent.click(screen.getByText('Delete'))
    expect(await screen.findByText('Failed to delete NPC')).toBeInTheDocument()
    globalThis.confirm = originalConfirm
  })

  it('refresh list button reloads NPCs', async () => {
    const npc1 = makeNPC({ id: 1, name: 'Eldrin', location: 'Forest' })
    const npc2 = makeNPC({ id: 2, name: 'Grom', location: 'Forest' })
    mockFetchNPCs.mockResolvedValueOnce([npc1]).mockResolvedValueOnce([npc1, npc2])
    mockFetchMaps.mockResolvedValue([])
    render(<NPCPage />)
    await screen.findByText('Eldrin')
    expect(screen.queryByText('Grom')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Refresh List'))
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    await screen.findByText('Grom')
  })

  it('shows error toast on refresh list failure', async () => {
    mockFetchNPCs.mockResolvedValueOnce([makeNPC({ id: 1, name: 'Eldrin' })]).mockRejectedValueOnce(new Error('fail'))
    mockFetchMaps.mockResolvedValue([])
    render(<NPCPage />)
    await screen.findByText('Eldrin')
    fireEvent.click(screen.getByText('Refresh List'))
    expect(await screen.findByText('Failed to load NPCs')).toBeInTheDocument()
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })
})
