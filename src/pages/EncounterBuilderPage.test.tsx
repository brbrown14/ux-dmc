import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
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
  { id: 2, name: 'Aboleth', type: 'aberration', challengeRating: '10', xp: 5900, armorClass: 17, hitPoints: 135, source: 'MM', size: 'Large', alignment: 'LE', strength: 21, dexterity: 9, constitution: 15, intelligence: 18, wisdom: 15, charisma: 18, skills: '', passive: 12, languages: '', traits: '', actions: '', legendaryActions: '', reactions: '', damageResistances: '', damageImmunities: '', conditionImmunities: '', senses: '', environment: '', imagePath: 'MM/Aboleth.png', sourceJson: '', speed: '10', hitPointsFormula: '18d10+36' },
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

  it('shows the monster image on the right side of the info section', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Aboleth')
    fireEvent.click(screen.getByText('Aboleth'))
    const img = await screen.findByAltText('Aboleth')
    expect(img).toHaveAttribute('src', '/monster-images/MM/Aboleth.png')
  })

  it('does not render an image for a monster without an image', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Goblin')
    fireEvent.click(screen.getByText('Goblin'))
    expect(screen.getByText(/Source/)).toBeInTheDocument()
    expect(screen.queryByAltText('Goblin')).not.toBeInTheDocument()
  })

  it('hides the image if it fails to load', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Aboleth')
    fireEvent.click(screen.getByText('Aboleth'))
    const img = await screen.findByAltText('Aboleth')
    fireEvent.error(img)
    expect(screen.queryByAltText('Aboleth')).not.toBeInTheDocument()
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

  it('parseSpeed returns raw string when JSON is invalid (catch branch)', async () => {
    const monsters = [{
      ...sampleMonsters[0], id: 10, name: 'SpeedBad', challengeRating: '1', xp: 100,
      speed: '30 ft (walk), 60 ft (fly)',
    }]
    mockFetchMonsters.mockResolvedValue(monsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('SpeedBad')
    fireEvent.click(screen.getByText('SpeedBad'))
    expect(await screen.findByText('30 ft (walk), 60 ft (fly)')).toBeInTheDocument()
  })

  it('parseSpeed returns dash when speed is empty string', async () => {
    const monsters = [{
      ...sampleMonsters[0], id: 11, name: 'NoSpeed', challengeRating: '0', xp: 0,
      speed: '',
    }]
    mockFetchMonsters.mockResolvedValue(monsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('NoSpeed')
    fireEvent.click(screen.getByText('NoSpeed'))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Speed:')).toBeInTheDocument()
    expect(within(dialog).getByText('-')).toBeInTheDocument()
  })

  it('parseSpeed handles numeric-only speed (Object.entries on number)', async () => {
    const monsters = [{
      ...sampleMonsters[0], id: 12, name: 'NumSpeed', challengeRating: '1', xp: 100,
      speed: '30',
    }]
    mockFetchMonsters.mockResolvedValue(monsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('NumSpeed')
    fireEvent.click(screen.getByText('NumSpeed'))
    expect(await screen.findByText(/Speed:/)).toBeInTheDocument()
  })

  it('parseJsonObj returns empty object for invalid senses JSON', async () => {
    const monsters = [{
      ...sampleMonsters[0], id: 13, name: 'BadSenses', challengeRating: '1', xp: 100,
      senses: 'not valid json {',
    }]
    mockFetchMonsters.mockResolvedValue(monsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('BadSenses')
    fireEvent.click(screen.getByText('BadSenses'))
    await screen.findByText(/Source/)
    expect(screen.getByText(/Senses:/)).toBeInTheDocument()
  })

  it('parseJsonArray returns empty for invalid traits JSON (no traits section)', async () => {
    const monsters = [{
      ...sampleMonsters[0], id: 14, name: 'BadTraits', challengeRating: '1', xp: 100,
      traits: 'not valid json [',
    }]
    mockFetchMonsters.mockResolvedValue(monsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('BadTraits')
    fireEvent.click(screen.getByText('BadTraits'))
    await screen.findByText(/Source/)
    expect(screen.queryByText('Traits')).not.toBeInTheDocument()
  })

  it('parseJsonArray returns empty for invalid actions JSON', async () => {
    const monsters = [{
      ...sampleMonsters[0], id: 15, name: 'BadActions', challengeRating: '1', xp: 100,
      actions: 'not valid json {{',
    }]
    mockFetchMonsters.mockResolvedValue(monsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('BadActions')
    fireEvent.click(screen.getByText('BadActions'))
    await screen.findByText(/Source/)
    expect(screen.queryByText('Actions')).not.toBeInTheDocument()
  })

  it('toggles sort direction when clicking same CR column twice', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Goblin')
    const crBtn = screen.getByRole('button', { name: /^CR/ })
    fireEvent.click(crBtn)
    expect(screen.getByText(/▲/)).toBeInTheDocument()
    fireEvent.click(crBtn)
    expect(screen.getByText(/▼/)).toBeInTheDocument()
  })

  it('toggles name sort direction on second click', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Goblin')
    expect(screen.getByText(/Name ▲/)).toBeInTheDocument()
    fireEvent.click(screen.getByText(/^Name/))
    expect(screen.getByText(/Name ▼/)).toBeInTheDocument()
  })

  it('sorts monsters by CR with fractional values (1/8, 1/4, 1/2)', async () => {
    const crMonsters = [
      { ...sampleMonsters[0], id: 20, name: 'CRZero', challengeRating: '0', xp: 10 },
      { ...sampleMonsters[0], id: 21, name: 'CROneEighth', challengeRating: '1/8', xp: 25 },
      { ...sampleMonsters[0], id: 22, name: 'CRQuarter', challengeRating: '1/4', xp: 50 },
      { ...sampleMonsters[0], id: 23, name: 'CRHalf', challengeRating: '1/2', xp: 100 },
      { ...sampleMonsters[0], id: 24, name: 'CROne', challengeRating: '1', xp: 200 },
    ]
    mockFetchMonsters.mockResolvedValue(crMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('CRZero')
    const crBtn = screen.getByRole('button', { name: /^CR/ })
    fireEvent.click(crBtn)
    const getName = (n: string) => {
      const row = screen.getByText(n).closest('[class*="monsterRow"]')!
      return within(row as HTMLElement).getByText(/^(0|1\/8|1\/4|1\/2|1)$/).textContent
    }
    await vi.waitFor(() => {
      const names = ['CRZero', 'CROneEighth', 'CRQuarter', 'CRHalf', 'CROne']
      const vals = names.map(getName)
      expect(vals).toEqual(['0', '1/8', '1/4', '1/2', '1'])
    })
  })

  it('filters monsters by min CR range slider', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Goblin')
    expect(screen.getByText('4 monsters')).toBeInTheDocument()
    const sliders = screen.getAllByRole('slider')
    fireEvent.change(sliders[0], { target: { value: '5' } })
    await vi.waitFor(() => {
      expect(screen.queryByText('Goblin')).not.toBeInTheDocument()
      expect(screen.queryByText('Zombie')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Aboleth')).toBeInTheDocument()
  })

  it('filters monsters by max CR range slider', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Goblin')
    const sliders = screen.getAllByRole('slider')
    fireEvent.change(sliders[1], { target: { value: '0.5' } })
    await vi.waitFor(() => {
      expect(screen.queryByText('Aboleth')).not.toBeInTheDocument()
      expect(screen.queryByText('Dragon')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Goblin')).toBeInTheDocument()
    expect(screen.getByText('Zombie')).toBeInTheDocument()
  })

  it('shows trivial difficulty for very low XP encounter', async () => {
    const easyMonsters = [{
      ...sampleMonsters[0], id: 30, name: 'Rat', challengeRating: '0', xp: 10, armorClass: 10, hitPoints: 1,
    }]
    mockFetchMonsters.mockResolvedValue(easyMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Rat')
    fireEvent.click(screen.getAllByRole('button', { name: '+' })[0])
    await vi.waitFor(() => {
      expect(screen.getByText('Trivial')).toBeInTheDocument()
    })
  })

  it('shows easy difficulty badge for low XP encounter', async () => {
    const easyMonster = [
      { ...sampleMonsters[0], id: 40, name: 'Gnoll', challengeRating: '1', xp: 100, armorClass: 10, hitPoints: 5 },
    ]
    mockFetchMonsters.mockResolvedValue(easyMonster)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Gnoll')
    fireEvent.click(screen.getByRole('button', { name: '+' }))
    await vi.waitFor(() => {
      const badge = screen.getByText('Easy')
      expect(badge).toBeInTheDocument()
      expect(badge.className).toContain('diffBadge')
    })
  })

  it('shows deadly difficulty badge for high XP encounter', async () => {
    const deadlyMonster = [
      { ...sampleMonsters[0], id: 43, name: 'Tarrasque', challengeRating: '30', xp: 62500, armorClass: 20, hitPoints: 50 },
    ]
    mockFetchMonsters.mockResolvedValue(deadlyMonster)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Tarrasque')
    fireEvent.click(screen.getByRole('button', { name: '+' }))
    await vi.waitFor(() => {
      const badge = screen.getByText('Deadly')
      expect(badge).toBeInTheDocument()
      expect(badge.className).toContain('diffBadge')
    })
  })

  it('StatBlock renders fallback when monster has no size/alignment/type', async () => {
    const monsters = [{
      ...sampleMonsters[0], id: 50, name: 'Minimal', challengeRating: '1', xp: 100,
      size: '', alignment: '', type: '',
    }]
    mockFetchMonsters.mockResolvedValue(monsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Minimal')
    fireEvent.click(screen.getByText('Minimal'))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Source:')).toBeInTheDocument()
    expect(within(dialog).queryByText('Size:')).not.toBeInTheDocument()
    expect(within(dialog).queryByText('Alignment:')).not.toBeInTheDocument()
  })

  it('StatBlock renders damageResistances section', async () => {
    const monsters = [{
      ...sampleMonsters[0], id: 51, name: 'Resistant', challengeRating: '1', xp: 100,
      damageResistances: '["fire","cold"]',
      damageImmunities: '["poison"]',
      conditionImmunities: '["frightened","charmed"]',
    }]
    mockFetchMonsters.mockResolvedValue(monsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Resistant')
    fireEvent.click(screen.getByText('Resistant'))
    await vi.waitFor(() => {
      expect(screen.getByText(/Damage Resistances/)).toBeInTheDocument()
      expect(screen.getByText(/fire, cold/)).toBeInTheDocument()
      expect(screen.getByText(/Damage Immunities/)).toBeInTheDocument()
      expect(screen.getByText(/poison/)).toBeInTheDocument()
      expect(screen.getByText(/Condition Immunities/)).toBeInTheDocument()
      expect(screen.getByText(/frightened, charmed/)).toBeInTheDocument()
    })
  })

  it('joinArray returns raw value for non-JSON string input', async () => {
    const monsters = [{
      ...sampleMonsters[0], id: 52, name: 'RawSkills', challengeRating: '1', xp: 100,
      skills: 'Athletics +5, Stealth +3',
      languages: 'Common, Elvish',
    }]
    mockFetchMonsters.mockResolvedValue(monsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('RawSkills')
    fireEvent.click(screen.getByText('RawSkills'))
    await vi.waitFor(() => {
      expect(screen.getByText(/Athletics \+5, Stealth \+3/)).toBeInTheDocument()
      expect(screen.getByText(/Common, Elvish/)).toBeInTheDocument()
    })
  })

  it('joinArray returns dash for null skills/languages', async () => {
    const monsters = [{
      ...sampleMonsters[0], id: 53, name: 'EmptyFields', challengeRating: '1', xp: 100,
      skills: '', languages: '',
    }]
    mockFetchMonsters.mockResolvedValue(monsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('EmptyFields')
    fireEvent.click(screen.getByText('EmptyFields'))
    await screen.findByText(/Source/)
    expect(screen.queryByText(/Skills:/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Languages:/)).not.toBeInTheDocument()
  })

  it('StatBlock renders traits from valid JSON with entries', async () => {
    const monsters = [{
      ...sampleMonsters[0], id: 54, name: 'TraitMonster', challengeRating: '1', xp: 100,
      traits: '[{"name":"Keen Senses","entries":["Has advantage on perception."]}]',
      actions: '[{"name":"Slam","entries":["Melee attack +5."]}]',
      legendaryActions: '',
      reactions: '',
    }]
    mockFetchMonsters.mockResolvedValue(monsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('TraitMonster')
    fireEvent.click(screen.getByText('TraitMonster'))
    await vi.waitFor(() => {
      expect(screen.getByText(/Keen Senses/)).toBeInTheDocument()
      expect(screen.getByText(/Has advantage on perception/)).toBeInTheDocument()
      expect(screen.getByText(/Slam/)).toBeInTheDocument()
      expect(screen.getByText(/Melee attack \+5/)).toBeInTheDocument()
    })
  })

  it('handles empty legendaryActions and reactions', async () => {
    const monsters = [{
      ...sampleMonsters[0], id: 55, name: 'NoLegends', challengeRating: '1', xp: 100,
      traits: '', actions: '', legendaryActions: '', reactions: '',
    }]
    mockFetchMonsters.mockResolvedValue(monsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('NoLegends')
    fireEvent.click(screen.getByText('NoLegends'))
    await screen.findByText(/Source/)
    expect(screen.queryByText('Traits')).not.toBeInTheDocument()
    expect(screen.queryByText('Actions')).not.toBeInTheDocument()
    expect(screen.queryByText('Legendary Actions')).not.toBeInTheDocument()
    expect(screen.queryByText('Reactions')).not.toBeInTheDocument()
  })

  it('encounter list +/- buttons adjust quantity correctly', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Goblin')
    const addBtns = screen.getAllByRole('button', { name: '+' })
    fireEvent.click(addBtns[0])
    const plusBtns = screen.getAllByRole('button', { name: '+' })
    const encounterPlus = plusBtns[plusBtns.length - 1]
    fireEvent.click(encounterPlus)
    fireEvent.click(encounterPlus)
    expect(screen.getByText('3')).toBeInTheDocument()
    const minusBtns = screen.getAllByRole('button', { name: '-' })
    fireEvent.click(minusBtns[0])
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows no monsters in difficulty when encounter is empty', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Encounter Builder')
    expect(screen.getByText('No monsters')).toBeInTheDocument()
  })

  it('formats CR range labels with fractional values', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Goblin')
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
  })

  it('adjustQty prevents quantity from going below 1', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Goblin')
    const addBtns = screen.getAllByRole('button', { name: '+' })
    fireEvent.click(addBtns[0])
    fireEvent.click(addBtns[0])
    const minusBtns = screen.getAllByRole('button', { name: '-' })
    fireEvent.click(minusBtns[0])
    fireEvent.click(minusBtns[0])
    fireEvent.click(minusBtns[0])
    fireEvent.click(minusBtns[0])
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('saves encounter with existing linkId (update path)', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([{ id: 5, name: 'Saved Battle', ownerUsername: 'user', createdAt: '2024-01-01' }])
    mockFetchEncounter.mockResolvedValue({
      encounter: { id: 5, name: 'Saved Battle' },
      monsters: [{ id: 10, monsterId: 1, quantity: 2, initiative: null }],
    })
    render(<EncounterBuilderPage />)
    expect(await screen.findByText('Saved Battle')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Load'))
    await vi.waitFor(() => {
      expect(mockFetchEncounter).toHaveBeenCalledWith(5)
    })
    expect(screen.getByText('Goblin')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Encounter name...'), { target: { value: 'Updated' } })
    fireEvent.click(screen.getByText('Save'))
    await vi.waitFor(() => {
      expect(screen.getByText('Encounter saved!')).toBeInTheDocument()
    })
  })

  it('handleDelete cancels when confirm returns false', async () => {
    const originalConfirm = globalThis.confirm
    globalThis.confirm = vi.fn(() => false)
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([{ id: 5, name: 'Battle', ownerUsername: 'user', createdAt: '2024-01-01' }])
    render(<EncounterBuilderPage />)
    expect(await screen.findByText('Battle')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Del'))
    expect(mockDeleteEncounter).not.toHaveBeenCalled()
    globalThis.confirm = originalConfirm
  })

  it('newEncounter resets encounter state', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Goblin')
    const addBtns = screen.getAllByRole('button', { name: '+' })
    fireEvent.click(addBtns[0])
    fireEvent.change(screen.getByPlaceholderText('Encounter name...'), { target: { value: 'Test' } })
    fireEvent.click(screen.getByText('New'))
    expect(screen.getByPlaceholderText('Encounter name...')).toHaveValue('')
    expect(screen.getByText(/No monsters in encounter/)).toBeInTheDocument()
  })

  it('shows monster stats in encounter row', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Goblin')
    const goblinRow = screen.getByText('Goblin').closest('[class*="monsterRow"]')!
    fireEvent.click(within(goblinRow as HTMLElement).getByRole('button', { name: '+' }))
    expect(screen.getByText(/AC 15/)).toBeInTheDocument()
    expect(screen.getByText(/HP 7/)).toBeInTheDocument()
    expect(screen.getByText(/CR 1\/4/)).toBeInTheDocument()
  })

  it('load failure shows error toast', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([{ id: 5, name: 'Battle', ownerUsername: 'user', createdAt: '2024-01-01' }])
    mockFetchEncounter.mockRejectedValue(new Error('fail'))
    render(<EncounterBuilderPage />)
    expect(await screen.findByText('Battle')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Load'))
    expect(await screen.findByText('Failed to load encounter')).toBeInTheDocument()
  })

  it('getDifficultyLabel returns trivial for negative index', async () => {
    const monsters = [{
      ...sampleMonsters[0], id: 60, name: 'Tiny', challengeRating: '0', xp: 1, armorClass: 10, hitPoints: 1,
    }]
    mockFetchMonsters.mockResolvedValue(monsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Tiny')
    fireEvent.click(screen.getAllByRole('button', { name: '+' })[0])
    await vi.waitFor(() => {
      expect(screen.getByText('Trivial')).toBeInTheDocument()
    })
  })

  it('shows monster without hitPointsFormula', async () => {
    const monsters = [{
      ...sampleMonsters[0], id: 61, name: 'NoFormula', challengeRating: '1', xp: 100,
      hitPoints: 50, hitPointsFormula: '',
    }]
    mockFetchMonsters.mockResolvedValue(monsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('NoFormula')
    fireEvent.click(screen.getByText('NoFormula'))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Hit Points:')).toBeInTheDocument()
  })

  it('StatBlock shows passive perception', async () => {
    const monsters = [{
      ...sampleMonsters[0], id: 62, name: 'Perceptive', challengeRating: '1', xp: 100,
      armorClass: 10, passive: 15,
    }]
    mockFetchMonsters.mockResolvedValue(monsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Perceptive')
    fireEvent.click(screen.getByText('Perceptive'))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Passive Perception:')).toBeInTheDocument()
    const ppEntry = within(dialog).getByText('Passive Perception:').closest('p')!
    expect(ppEntry).toHaveTextContent('Passive Perception: 15')
  })

  it('StatBlock shows source as dash when empty', async () => {
    const monsters = [{
      ...sampleMonsters[0], id: 63, name: 'NoSource', challengeRating: '1', xp: 100,
      source: '',
    }]
    mockFetchMonsters.mockResolvedValue(monsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('NoSource')
    fireEvent.click(screen.getByText('NoSource'))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Source:')).toBeInTheDocument()
    expect(within(dialog).getByText('-')).toBeInTheDocument()
  })

  it('StatBlock renders ability modifiers correctly', async () => {
    const monsters = [{
      ...sampleMonsters[0], id: 64, name: 'Abilities', challengeRating: '1', xp: 100,
      strength: 18, dexterity: 8, constitution: 14,
    }]
    mockFetchMonsters.mockResolvedValue(monsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Abilities')
    fireEvent.click(screen.getByText('Abilities'))
    const dialog = await screen.findByRole('dialog')
    const mods = within(dialog).getAllByText(/^\+?[0-9-]+$/)
    const modTexts = mods.map(m => m.textContent)
    expect(modTexts).toContain('+4')
    expect(modTexts).toContain('-1')
    expect(modTexts).toContain('+2')
  })

  it('encounter monster CR is displayed in encounter row', async () => {
    mockFetchMonsters.mockResolvedValue(sampleMonsters)
    mockFetchEncounters.mockResolvedValue([])
    render(<EncounterBuilderPage />)
    await screen.findByText('Goblin')
    const goblinRow = screen.getByText('Goblin').closest('[class*="monsterRow"]')!
    fireEvent.click(within(goblinRow as HTMLElement).getByRole('button', { name: '+' }))
    await vi.waitFor(() => {
      expect(screen.getByText(/CR 1\/4/)).toBeInTheDocument()
    })
  })
})
