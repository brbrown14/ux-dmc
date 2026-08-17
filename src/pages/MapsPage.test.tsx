import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MapsPage from './MapsPage'

const mockFetchMaps = vi.fn()
const mockUploadMap = vi.fn()
const mockUpdateMap = vi.fn()
const mockFetchNPCsByMap = vi.fn()

vi.mock('../api/maps', () => ({
  fetchMaps: (...args: unknown[]) => mockFetchMaps(...args),
  uploadMap: (...args: unknown[]) => mockUploadMap(...args),
  updateMap: (...args: unknown[]) => mockUpdateMap(...args),
  getMapImageUrl: (name: string) => `/api/maps/image/${encodeURIComponent(name)}`,
}))

vi.mock('../api/npcs', () => ({
  fetchNPCsByMap: (...args: unknown[]) => mockFetchNPCsByMap(...args),
}))

function makeMap(overrides: Record<string, unknown> = {}) {
  return { id: 1, title: 'World', description: 'The whole world', imagePath: '', imageType: '', ownerUsername: 'user', ...overrides }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MapsPage', () => {
  it('shows loading spinner initially', () => {
    mockFetchMaps.mockReturnValue(new Promise(() => {}))
    render(<MapsPage />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders heading after load', async () => {
    mockFetchMaps.mockResolvedValue([])
    render(<MapsPage />)
    expect(await screen.findByText('World Maps')).toBeInTheDocument()
  })

  it('shows empty state when no maps', async () => {
    mockFetchMaps.mockResolvedValue([])
    render(<MapsPage />)
    expect(await screen.findByText(/No maps uploaded/)).toBeInTheDocument()
  })

  it('renders map cards', async () => {
    mockFetchMaps.mockResolvedValue([makeMap({ id: 1, title: 'Forest' })])
    render(<MapsPage />)
    expect(await screen.findByText('Forest')).toBeInTheDocument()
  })

  it('shows placeholder when map has no image', async () => {
    mockFetchMaps.mockResolvedValue([makeMap({ imagePath: '' })])
    render(<MapsPage />)
    expect(await screen.findByText('No image')).toBeInTheDocument()
  })

  it('opens upload modal', async () => {
    mockFetchMaps.mockResolvedValue([])
    render(<MapsPage />)
    await screen.findByText('World Maps')
    fireEvent.click(screen.getByText('+ Upload Map'))
    expect(screen.getByText('Upload Map')).toBeInTheDocument()
  })

  it('validates upload form', async () => {
    mockFetchMaps.mockResolvedValue([])
    render(<MapsPage />)
    await screen.findByText('World Maps')
    fireEvent.click(screen.getByText('+ Upload Map'))
    fireEvent.click(screen.getByText('Upload'))
    expect(screen.getByText('Title and description are required')).toBeInTheDocument()
  })

  it('uploads map successfully', async () => {
    mockFetchMaps.mockResolvedValueOnce([]).mockResolvedValueOnce([makeMap({ id: 1, title: 'New Map' })])
    mockUploadMap.mockResolvedValue(makeMap({ id: 1, title: 'New Map' }))
    render(<MapsPage />)
    await screen.findByText('World Maps')
    fireEvent.click(screen.getByText('+ Upload Map'))
    fireEvent.change(screen.getByPlaceholderText('Map title'), { target: { value: 'New Map' } })
    fireEvent.change(screen.getByPlaceholderText('Describe this map...'), { target: { value: 'A new map' } })
    fireEvent.click(screen.getByText('Upload'))
    await vi.waitFor(() => {
      expect(mockUploadMap).toHaveBeenCalledOnce()
    })
  })

  it('opens detail modal on card click', async () => {
    mockFetchMaps.mockResolvedValue([makeMap({ id: 1, title: 'Forest', description: 'Green woods' })])
    render(<MapsPage />)
    const title = await screen.findByText('Forest')
    fireEvent.click(title)
    expect(screen.getByText('Save Changes')).toBeInTheDocument()
  })

  it('updates map in detail modal', async () => {
    mockFetchMaps.mockResolvedValueOnce([makeMap({ id: 1, title: 'Forest', description: 'Green' })]).mockResolvedValueOnce([makeMap({ id: 1, title: 'Forest Updated', description: 'Bigger' })])
    mockUpdateMap.mockResolvedValue(makeMap({ id: 1, title: 'Forest Updated', description: 'Bigger' }))
    render(<MapsPage />)
    await screen.findByText('Forest')
    fireEvent.click(screen.getByText('Forest'))
    const titleInput = screen.getByDisplayValue('Forest')
    fireEvent.change(titleInput, { target: { value: 'Forest Updated' } })
    const descInput = screen.getByDisplayValue('Green')
    fireEvent.change(descInput, { target: { value: 'Bigger' } })
    fireEvent.click(screen.getByText('Save Changes'))
    await vi.waitFor(() => {
      expect(mockUpdateMap).toHaveBeenCalledWith(1, { title: 'Forest Updated', description: 'Bigger' })
    })
  })

  it('validates detail modal fields', async () => {
    mockFetchMaps.mockResolvedValue([makeMap({ id: 1, title: 'Forest', description: 'Green' })])
    render(<MapsPage />)
    await screen.findByText('Forest')
    fireEvent.click(screen.getByText('Forest'))
    const titleInput = screen.getByDisplayValue('Forest')
    fireEvent.change(titleInput, { target: { value: '' } })
    fireEvent.click(screen.getByText('Save Changes'))
    expect(screen.getByText('Title and description are required')).toBeInTheDocument()
  })

  it('shows error toast on load failure', async () => {
    mockFetchMaps.mockRejectedValue(new Error('fail'))
    render(<MapsPage />)
    expect(await screen.findByText('Failed to load maps')).toBeInTheDocument()
  })

  it('uploads map with image file', async () => {
    mockFetchMaps.mockResolvedValueOnce([]).mockResolvedValueOnce([makeMap({ id: 1, title: 'New Map' })])
    mockUploadMap.mockResolvedValue(makeMap({ id: 1, title: 'New Map' }))
    const { container } = render(<MapsPage />)
    await screen.findByText('World Maps')
    fireEvent.click(screen.getByText('+ Upload Map'))
    fireEvent.change(screen.getByPlaceholderText('Map title'), { target: { value: 'New Map' } })
    fireEvent.change(screen.getByPlaceholderText('Describe this map...'), { target: { value: 'A new map' } })
    const fileInput = container.querySelector('input[type="file"]')
    fireEvent.change(fileInput!, { target: { files: [new File([''], 'map.png', { type: 'image/png' })] } })
    fireEvent.click(screen.getByText('Upload'))
    await vi.waitFor(() => {
      expect(mockUploadMap).toHaveBeenCalledOnce()
    })
  })

  it('shows error toast on upload failure', async () => {
    mockFetchMaps.mockResolvedValue([])
    mockUploadMap.mockRejectedValue(new Error('fail'))
    render(<MapsPage />)
    await screen.findByText('World Maps')
    fireEvent.click(screen.getByText('+ Upload Map'))
    fireEvent.change(screen.getByPlaceholderText('Map title'), { target: { value: 'New Map' } })
    fireEvent.change(screen.getByPlaceholderText('Describe this map...'), { target: { value: 'A new map' } })
    fireEvent.click(screen.getByText('Upload'))
    expect(await screen.findByText('Failed to upload map')).toBeInTheDocument()
  })

  it('shows error toast on update failure', async () => {
    mockFetchMaps.mockResolvedValue([makeMap({ id: 1, title: 'Forest', description: 'Green' })])
    mockUpdateMap.mockRejectedValue(new Error('fail'))
    render(<MapsPage />)
    await screen.findByText('Forest')
    fireEvent.click(screen.getByText('Forest'))
    fireEvent.click(screen.getByText('Save Changes'))
    expect(await screen.findByText('Failed to update map')).toBeInTheDocument()
  })

  it('shows NPCs tab in detail modal', async () => {
    mockFetchMaps.mockResolvedValue([makeMap({ id: 1, title: 'Forest', description: 'Green', imagePath: 'forest.jpg' })])
    mockFetchNPCsByMap.mockResolvedValue([])
    render(<MapsPage />)
    await screen.findByText('Forest')
    fireEvent.click(screen.getByText('Forest'))
    fireEvent.click(screen.getByText('NPCs (0)'))
    expect(await screen.findByText('No NPCs found at this location.')).toBeInTheDocument()
  })

  it('shows NPCs in NPC tab', async () => {
    mockFetchMaps.mockResolvedValue([makeMap({ id: 1, title: 'Forest', description: 'Green' })])
    mockFetchNPCsByMap.mockResolvedValue([{ id: 1, name: 'Guard', occupation: 'Watchman', personality: 'Alert', history: 'Stood watch', location: 'Forest', worldMapId: 1, ownerUsername: 'user' }])
    render(<MapsPage />)
    await screen.findByText('Forest')
    fireEvent.click(screen.getByText('Forest'))
    fireEvent.click(screen.getByText('NPCs (0)'))
    expect(await screen.findByText('Guard')).toBeInTheDocument()
  })

  it('renders map image when imagePath is provided', async () => {
    mockFetchMaps.mockResolvedValue([makeMap({ id: 1, title: 'Forest', imagePath: 'forest.jpg' })])
    const { container } = render(<MapsPage />)
    await screen.findByText('Forest')
    const img = container.querySelector('img')
    expect(img).toBeInTheDocument()
    expect(img!.getAttribute('src')).toContain('forest.jpg')
  })

  it('hides broken map image on error', async () => {
    mockFetchMaps.mockResolvedValue([makeMap({ id: 1, title: 'Forest', imagePath: 'bad.jpg' })])
    const { container } = render(<MapsPage />)
    await screen.findByText('Forest')
    const img = container.querySelector('img')!
    fireEvent.error(img)
    expect(img.style.display).toBe('none')
  })

  it('shows detail modal with image when map has imagePath', async () => {
    mockFetchMaps.mockResolvedValue([makeMap({ id: 1, title: 'Forest', description: 'Green', imagePath: 'forest.jpg' })])
    const { container } = render(<MapsPage />)
    fireEvent.click(await screen.findByText('Forest'))
    const imgs = container.querySelectorAll('img')
    expect(imgs.length).toBe(2)
  })

  it('shows error toast when NPC fetch fails', async () => {
    mockFetchMaps.mockResolvedValue([makeMap({ id: 1, title: 'Forest', description: 'Green' })])
    mockFetchNPCsByMap.mockRejectedValue(new Error('fail'))
    render(<MapsPage />)
    fireEvent.click(await screen.findByText('Forest'))
    fireEvent.click(screen.getByText('NPCs (0)'))
    expect(await screen.findByText('Failed to load NPCs')).toBeInTheDocument()
  })

  it('closes upload modal on cancel click', async () => {
    mockFetchMaps.mockResolvedValue([])
    render(<MapsPage />)
    await screen.findByText('World Maps')
    fireEvent.click(screen.getByText('+ Upload Map'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes upload modal on close button', async () => {
    mockFetchMaps.mockResolvedValue([])
    render(<MapsPage />)
    await screen.findByText('World Maps')
    fireEvent.click(screen.getByText('+ Upload Map'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
