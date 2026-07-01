import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EncounterBuilderPage from './EncounterBuilderPage'

const mockFetchMonsters = vi.fn()
const mockFetchEncounters = vi.fn()
const mockCreateEncounter = vi.fn()
const mockFetchEncounter = vi.fn()
const mockDeleteEncounter = vi.fn()
const mockAddMonsterToEncounter = vi.fn()

vi.mock('../api/monsters', () => ({
  fetchMonsters: (...args: unknown[]) => mockFetchMonsters(...args),
}))

vi.mock('../api/encounters', () => ({
  fetchEncounters: (...args: unknown[]) => mockFetchEncounters(...args),
  fetchEncounter: (...args: unknown[]) => mockFetchEncounter(...args),
  createEncounter: (...args: unknown[]) => mockCreateEncounter(...args),
  deleteEncounter: (...args: unknown[]) => mockDeleteEncounter(...args),
  addMonsterToEncounter: (...args: unknown[]) => mockAddMonsterToEncounter(...args),
  updateMonsterInEncounter: vi.fn().mockResolvedValue(undefined),
}))

const sampleMonsters = [
  { id: 1, name: 'Goblin', type: 'humanoid', challengeRating: '1/4', xp: 50, armorClass: 15, hitPoints: 7, source: 'MM', size: 'Small', alignment: 'NE', strength: 8, dexterity: 14, constitution: 10, intelligence: 10, wisdom: 8, charisma: 8, skills: '', passive: 9, languages: '', traits: '', actions: '', legendaryActions: '', reactions: '', damageResistances: '', damageImmunities: '', conditionImmunities: '', senses: '', environment: '', imagePath: '', sourceJson: '', speed: '30', hitPointsFormula: '1d10+2' },
  { id: 2, name: 'Aboleth', type: 'aberration', challengeRating: '10', xp: 5900, armorClass: 17, hitPoints: 135, source: 'MM', size: 'Large', alignment: 'LE', strength: 21, dexterity: 9, constitution: 15, intelligence: 18, wisdom: 15, charisma: 18, skills: '', passive: 12, languages: '', traits: '', actions: '', legendaryActions: '', reactions: '', damageResistances: '', damageImmunities: '', conditionImmunities: '', senses: '', environment: '', imagePath: '', sourceJson: '', speed: '10', hitPointsFormula: '18d10+36' },
  { id: 3, name: 'Zombie', type: 'undead', challengeRating: '1/4', xp: 50, armorClass: 8, hitPoints: 22, source: 'MM', size: 'Medium', alignment: 'NE', strength: 13, dexterity: 6, constitution: 16, intelligence: 3, wisdom: 6, charisma: 5, skills: '', passive: 8, languages: '', traits: '', actions: '', legendaryActions: '', reactions: '', damageResistances: '', damageImmunities: '', conditionImmunities: '', senses: '', environment: '', imagePath: '', sourceJson: '', speed: '20', hitPointsFormula: '3d8+9' },
  { id: 4, name: 'Dragon', type: 'dragon', challengeRating: '17', xp: 18000, armorClass: 22, hitPoints: 350, source: 'MM', size: 'Gargantuan', alignment: 'CE', strength: 27, dexterity: 10, constitution: 25, intelligence: 16, wisdom: 15, charisma: 19, skills: '["Perception","Stealth"]', passive: 22, languages: '["Common","Draconic"]', traits: '[{"name":"Amphibious","entries":["The dragon can breathe air and water."]}]', actions: '[{"name":"Bite","entries":["Melee weapon attack: +14 to hit."]}]', legendaryActions: '[{"name":"Detect","entries":["The dragon makes a Wisdom check."]}]', reactions: '[{"name":"Tail Attack","entries":["When hit, dragon makes tail attack."]}]', damageResistances: '', damageImmunities: '["Fire","Poison"]', conditionImmunities: '["Poisoned"]', senses: '{"darkvision":120}', environment: '', imagePath: '', sourceJson: '', speed: '{"walk":40,"fly":80}', hitPointsFormula: '20d12+100' },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('EncounterBuilderPage', () => {
  it('shows loading spinner initially', () => {
    mockFetchMonsters.mockReturnValue(new Promise(() => {}))
    mockFetchEncounters.mockReturnValue(new Promise(() => {}))
    render(<EncounterBuilderPage />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders heading after load', async () => {
    mockFetchMonsters.mockResolvedValue([])
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    expect(await screen.findByText('Encounter Builder')).toBeInTheDocument()
  })

  it('shows monster count', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    expect(await screen.findByText(/4 monsters/)).toBeInTheDocument()
  })

  it('displays monster names in the browser', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    expect(await screen.findByText('Goblin')).toBeInTheDocument()
    expect(screen.getByText('Aboleth')).toBeInTheDocument()
    expect(screen.getByText('Zombie')).toBeInTheDocument()
  })

  it('filters monsters by search', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Goblin')
    const searchInput = screen.getByPlaceholderText('Search by name...')
    fireEvent.change(searchInput, { target: { value: 'gob' } })
    expect(screen.getByText('Goblin')).toBeInTheDocument()
    expect(screen.queryByText('Aboleth')).not.toBeInTheDocument()
    expect(screen.queryByText('Zombie')).not.toBeInTheDocument()
  })

  it('filters monsters by type', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Goblin')
    const typeSelect = screen.getAllByRole('combobox')[0]
    fireEvent.change(typeSelect, { target: { value: 'undead' } })
    expect(screen.queryByText('Goblin')).not.toBeInTheDocument()
    expect(screen.queryByText('Aboleth')).not.toBeInTheDocument()
    expect(screen.getByText('Zombie')).toBeInTheDocument()
  })

  it('filters monsters by CR', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Goblin')
    const crSelect = screen.getAllByRole('combobox')[1]
    fireEvent.change(crSelect, { target: { value: '10' } })
    expect(screen.queryByText('Goblin')).not.toBeInTheDocument()
    expect(screen.getByText('Aboleth')).toBeInTheDocument()
    expect(screen.queryByText('Zombie')).not.toBeInTheDocument()
  })

  it('adds monster to encounter on + click', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Goblin')
    const addButtons = screen.getAllByRole('button', { name: '+' })
    fireEvent.click(addButtons[0])
    expect(screen.getByText('Goblin')).toBeInTheDocument()
  })

  it('shows difficulty badge when monsters added', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Goblin')
    const addButtons = screen.getAllByRole('button', { name: '+' })
    fireEvent.click(addButtons[0])
    await vi.waitFor(() => {
      expect(screen.getByText('Deadly')).toBeInTheDocument()
    })
  })

  it('shows validation error when saving without name', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Encounter Builder')
    fireEvent.click(screen.getByText('Save'))
    expect(screen.getByText('Please enter an encounter name.')).toBeInTheDocument()
  })

  it('shows validation error when saving without monsters', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Encounter Builder')
    fireEvent.change(screen.getByPlaceholderText('Encounter name...'), { target: { value: 'Test' } })
    fireEvent.click(screen.getByText('Save'))
    expect(screen.getByText('Add at least one monster.')).toBeInTheDocument()
  })

  it('removes monster from encounter', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Goblin')
    const addButtons = screen.getAllByRole('button', { name: '+' })
    fireEvent.click(addButtons[0])
    const removeButtons = screen.getAllByText('×')
    fireEvent.click(removeButtons[0])
    expect(screen.getByText(/No monsters in encounter/)).toBeInTheDocument()
  })

  it('updates party size', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Encounter Builder')
    const levelInputs = screen.getAllByTitle(/^Player/)
    expect(levelInputs).toHaveLength(4)
    const sizeInput = screen.getByDisplayValue('4')
    fireEvent.change(sizeInput, { target: { value: '6' } })
    await vi.waitFor(() => {
      expect(screen.getAllByTitle(/^Player/)).toHaveLength(6)
    })
  })

  it('updates player level', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Encounter Builder')
    const levelInput = screen.getByTitle('Player 1 level')
    fireEvent.change(levelInput, { target: { value: '10' } })
    expect((levelInput as HTMLInputElement).value).toBe('10')
  })

  it('clamps player level to 1-20', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Encounter Builder')
    const levelInput = screen.getByTitle('Player 1 level')
    fireEvent.change(levelInput, { target: { value: '25' } })
    expect((levelInput as HTMLInputElement).value).toBe('20')
    fireEvent.change(levelInput, { target: { value: '0' } })
    expect((levelInput as HTMLInputElement).value).toBe('1')
  })

  it('shows average level', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Encounter Builder')
    expect(screen.getByText(/Avg Lvl: 1/)).toBeInTheDocument()
  })

  it('opens monster detail modal', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Goblin')
    fireEvent.click(screen.getByText('Goblin'))
    expect(screen.getByText(/Source/)).toBeInTheDocument()
  })

  it('shows error toast on load failure', async () => {
    mockFetchMonsters.mockRejectedValue(new Error('fail'))
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    expect(await screen.findByText('Failed to load monsters')).toBeInTheDocument()
  })

  it('sorts monsters by type column', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Goblin')
    fireEvent.click(screen.getByText('Type'))
    const rows = screen.getAllByText(/dragon|humanoid|undead/)
    expect(rows.length).toBeGreaterThanOrEqual(3)
  })

  it('sorts monsters by CR column', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Goblin')
    fireEvent.click(screen.getByText('CR'))
    expect(screen.getByText('CR ▲')).toBeInTheDocument()
  })

  it('increments quantity on duplicate add', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Goblin')
    const addButtons = screen.getAllByRole('button', { name: '+' })
    fireEvent.click(addButtons[0])
    fireEvent.click(addButtons[0])
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('adjusts monster quantity with +/- buttons', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Goblin')
    const addButtons = screen.getAllByRole('button', { name: '+' })
    fireEvent.click(addButtons[0])
    const qtyButtons = screen.getAllByRole('button', { name: '-' })
    fireEvent.click(qtyButtons[0])
    fireEvent.click(qtyButtons[0])
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('saves a new encounter', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    mockCreateEncounter.mockResolvedValue({ id: 5 })
    mockAddMonsterToEncounter.mockResolvedValue({ id: 10 })
    render(<EncounterBuilderPage />)
    await screen.findByText('Goblin')
    const addButtons = screen.getAllByRole('button', { name: '+' })
    fireEvent.click(addButtons[0])
    fireEvent.change(screen.getByPlaceholderText('Encounter name...'), { target: { value: 'My Encounter' } })
    fireEvent.click(screen.getByText('Save'))
    await vi.waitFor(() => {
      expect(mockCreateEncounter).toHaveBeenCalledWith('My Encounter')
    })
    expect(mockAddMonsterToEncounter).toHaveBeenCalledWith(5, { monsterId: 2, quantity: 1 })
  })

  it('shows error toast on save failure', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    mockCreateEncounter.mockRejectedValue(new Error('fail'))
    render(<EncounterBuilderPage />)
    await screen.findByText('Goblin')
    const addButtons = screen.getAllByRole('button', { name: '+' })
    fireEvent.click(addButtons[0])
    fireEvent.change(screen.getByPlaceholderText('Encounter name...'), { target: { value: 'My Encounter' } })
    fireEvent.click(screen.getByText('Save'))
    expect(await screen.findByText('Error saving encounter')).toBeInTheDocument()
  })

  it('shows saved encounters and loads one', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([{ id: 5, name: 'Saved Battle', ownerUsername: 'user', createdAt: '2024-01-01' }])
    mockFetchEncounter.mockResolvedValue({
      encounter: { id: 5, name: 'Saved Battle' },
      monsters: [{ id: 10, monsterId: 1, quantity: 2 }],
    })
    render(<EncounterBuilderPage />)
    expect(await screen.findByText('Saved Battle')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Load'))
    await vi.waitFor(() => {
      expect(mockFetchEncounter).toHaveBeenCalledWith(5)
    })
  })

  it('deletes a saved encounter', async () => {
    const originalConfirm = globalThis.confirm
    globalThis.confirm = vi.fn(() => true)
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([{ id: 5, name: 'Saved Battle', ownerUsername: 'user', createdAt: '2024-01-01' }])
    mockDeleteEncounter.mockResolvedValue(undefined)
    render(<EncounterBuilderPage />)
    expect(await screen.findByText('Saved Battle')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Del'))
    await vi.waitFor(() => {
      expect(mockDeleteEncounter).toHaveBeenCalledWith(5)
    })
    globalThis.confirm = originalConfirm
  })

  it('shows full monster detail with traits and speeds', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Dragon')
    fireEvent.click(screen.getByText('Dragon'))
    expect(await screen.findByText(/Amphibious/)).toBeInTheDocument()
    expect(screen.getByText(/Bite/)).toBeInTheDocument()
    expect(screen.getByText(/Detect/)).toBeInTheDocument()
    expect(screen.getByText(/Tail Attack/)).toBeInTheDocument()
    expect(screen.getByText(/Fire/)).toBeInTheDocument()
    expect(screen.getByText(/Poisoned/)).toBeInTheDocument()
    expect(screen.getByText(/darkvision 120/)).toBeInTheDocument()
    expect(screen.getByText(/walk 40,/)).toBeInTheDocument()
    expect(screen.getByText(/Perception, Stealth/)).toBeInTheDocument()
    expect(screen.getByText(/Common, Draconic/)).toBeInTheDocument()
  })
})
