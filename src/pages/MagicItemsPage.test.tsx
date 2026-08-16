import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import MagicItemsPage from './MagicItemsPage'

const mockFetchItems = vi.fn()
const mockFetchAllVariants = vi.fn()
const mockCreateItem = vi.fn()
const mockUpdateItem = vi.fn()
const mockDeleteItem = vi.fn()

vi.mock('../api/magicItems', () => ({
  fetchMagicItems: (...args: unknown[]) => mockFetchItems(...args),
  fetchAllMagicItemVariants: (...args: unknown[]) => mockFetchAllVariants(...args),
  createMagicItem: (...args: unknown[]) => mockCreateItem(...args),
  updateMagicItem: (...args: unknown[]) => mockUpdateItem(...args),
  deleteMagicItem: (...args: unknown[]) => mockDeleteItem(...args),
}))

function baseItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'Alchemy Jug',
    description: 'This ceramic jug can produce liquids.',
    rarity: 'Uncommon',
    type: null,
    tier: null,
    source: 'DMG',
    page: 150,
    weight: '12 lb.',
    wondrous: true,
    requiresAttunement: false,
    attunement: null,
    isVariant: false,
    variantRequires: null,
    detailsJson: null,
    custom: false,
    ownerUsername: null,
    ...overrides,
  }
}

function variantItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 900,
    name: 'Weapon +1',
    description: 'You have a +1 bonus to attack and damage rolls made with this weapon.',
    rarity: null,
    type: 'GV',
    tier: null,
    source: null,
    page: null,
    weight: null,
    wondrous: null,
    requiresAttunement: null,
    attunement: null,
    isVariant: true,
    variantRequires: '{"weapon":true}',
    detailsJson: null,
    custom: false,
    ownerUsername: null,
    ...overrides,
  }
}

const sampleItems = [
  baseItem({}),
  baseItem({ id: 2, name: 'Amulet of Health', description: 'Your Constitution is 19.', rarity: 'Rare', requiresAttunement: true, attunement: 'YES' }),
  baseItem({ id: 3, name: 'Flame Tongue', description: 'A sword wreathed in fire.', rarity: 'Rare', type: 'M', requiresAttunement: true, attunement: 'YES' }),
  baseItem({ id: 4, name: 'My Custom Wand', description: 'My own creation.', rarity: null, type: 'WD', custom: true, ownerUsername: 'user' }),
]

const sampleVariants = [
  variantItem({
    id: 901,
    name: 'Weapon +1',
    detailsJson: JSON.stringify({ name: 'Weapon +1', inherits: { nameSuffix: ' +1', entries: ['You have a +1 bonus to attack and damage rolls made with this weapon.'] } }),
  }),
  variantItem({
    id: 902,
    name: 'Weapon +2',
    description: 'You have a +2 bonus to attack and damage rolls made with this weapon.',
    detailsJson: JSON.stringify({ name: 'Weapon +2', inherits: { nameSuffix: ' +2', entries: ['You have a +2 bonus to attack and damage rolls made with this weapon.'] } }),
  }),
  variantItem({
    id: 903,
    name: 'Weapon +3',
    description: 'You have a +3 bonus to attack and damage rolls made with this weapon.',
    detailsJson: JSON.stringify({ name: 'Weapon +3', inherits: { nameSuffix: ' +3', entries: ['You have a +3 bonus to attack and damage rolls made with this weapon.'] } }),
  }),
  variantItem({
    id: 904,
    name: 'Flame Tongue',
    description: '',
    variantRequires: '{"sword":true}',
    detailsJson: JSON.stringify({
      name: 'Flame Tongue',
      inherits: { rarity: 'Rare', namePrefix: 'Flame Tongue ', entries: ['A sword wreathed in fire.'] },
    }),
  }),
  variantItem({
    id: 905,
    name: 'Armor +1',
    description: 'You have a +1 bonus to AC while wearing it.',
    variantRequires: '{"armor":true}',
    detailsJson: JSON.stringify({ name: 'Armor +1', inherits: { nameSuffix: ' +1', entries: ['You have a +1 bonus to AC while wearing it.'] } }),
  }),
  variantItem({
    id: 906,
    name: 'Arrow of Slaying (Generic)',
    description: 'A magic arrow that slays a particular kind of creature.',
    variantRequires: '{"ammunition":true}',
  }),
  variantItem({
    id: 907,
    name: 'Shield +1',
    description: 'You have a +1 bonus to AC while wearing it.',
    variantRequires: '{"type":"S"}',
    detailsJson: JSON.stringify({ name: 'Shield +1', inherits: { nameSuffix: ' +1', entries: ['You have a +1 bonus to AC while wearing it.'] } }),
  }),
  variantItem({
    id: 908,
    name: 'Sword of Sharpness',
    description: 'When you attack with this magic sword and hit, maximize your weapon damage dice against the target.',
    variantRequires: '{"sword":true,"dmgType":"S"}',
  }),
]

beforeEach(() => {
  vi.clearAllMocks()
  window.print = vi.fn()
  window.confirm = vi.fn(() => true)
  mockFetchItems.mockResolvedValue(sampleItems)
  mockFetchAllVariants.mockResolvedValue([])
})

describe('MagicItemsPage', () => {
  it('shows loading spinner initially', () => {
    mockFetchItems.mockReturnValue(new Promise(() => {}))
    render(<MagicItemsPage />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders heading and item count after load', async () => {
    render(<MagicItemsPage />)
    expect(await screen.findByText('Magic Items')).toBeInTheDocument()
    expect(screen.getByText('4 items')).toBeInTheDocument()
  })

  it('displays item names in the browser', async () => {
    render(<MagicItemsPage />)
    expect(await screen.findByText('Alchemy Jug')).toBeInTheDocument()
    expect(screen.getByText('Flame Tongue')).toBeInTheDocument()
  })

  it('filters items by search on name', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    const searchInput = screen.getByPlaceholderText('Search by name or description...')
    fireEvent.change(searchInput, { target: { value: 'flame' } })
    expect(screen.getByText('Flame Tongue')).toBeInTheDocument()
    expect(screen.queryByText('Alchemy Jug')).not.toBeInTheDocument()
  })

  it('filters items by search on description', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    const searchInput = screen.getByPlaceholderText('Search by name or description...')
    fireEvent.change(searchInput, { target: { value: 'constitution' } })
    expect(screen.getByText('Amulet of Health')).toBeInTheDocument()
    expect(screen.queryByText('Alchemy Jug')).not.toBeInTheDocument()
  })

  it('filters items by rarity', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.change(screen.getByLabelText('Filter by rarity'), { target: { value: 'Rare' } })
    expect(screen.getByText('Amulet of Health')).toBeInTheDocument()
    expect(screen.getByText('Flame Tongue')).toBeInTheDocument()
    expect(screen.queryByText('Alchemy Jug')).not.toBeInTheDocument()
    expect(screen.getByText('2 items')).toBeInTheDocument()
  })

  it('filters items by type', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.change(screen.getByLabelText('Filter by type'), { target: { value: 'WD' } })
    expect(screen.getByText('My Custom Wand')).toBeInTheDocument()
    expect(screen.queryByText('Alchemy Jug')).not.toBeInTheDocument()
  })

  it('filters custom items via source filter', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.change(screen.getByLabelText('Filter by source'), { target: { value: 'custom' } })
    expect(screen.getByText('My Custom Wand')).toBeInTheDocument()
    expect(screen.queryByText('Alchemy Jug')).not.toBeInTheDocument()
    expect(screen.getByText('1 item')).toBeInTheDocument()
  })

  it('shows empty state when nothing matches', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.change(screen.getByLabelText('Filter by rarity'), { target: { value: 'Artifact' } })
    expect(screen.getByText('No magic items match your filters.')).toBeInTheDocument()
  })

  it('sorts by name by default', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    const order = screen
      .getAllByText(/^(Alchemy Jug|Amulet of Health|Flame Tongue|My Custom Wand)$/)
      .map((el) => el.textContent)
    expect(order).toEqual(['Alchemy Jug', 'Amulet of Health', 'Flame Tongue', 'My Custom Wand'])
  })

  it('sorts by rarity when rarity header is clicked', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: /Rarity/ }))
    const order = screen
      .getAllByText(/^(Alchemy Jug|Amulet of Health|Flame Tongue|My Custom Wand)$/)
      .map((el) => el.textContent)
    expect(order).toEqual(['Alchemy Jug', 'Amulet of Health', 'Flame Tongue', 'My Custom Wand'])
  })

  it('print button is disabled when nothing is selected', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    expect(screen.getByRole('button', { name: /Print selected/ })).toBeDisabled()
  })

  it('selecting a row enables print and prints the selection', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByLabelText('Select Alchemy Jug for printing'))
    const printBtn = screen.getByRole('button', { name: /Print selected \(1\)/ })
    expect(printBtn).toBeEnabled()
    fireEvent.click(printBtn)
    expect(window.print).toHaveBeenCalled()
  })

  it('renders selected items as index cards in the print area', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByLabelText('Select Alchemy Jug for printing'))
    fireEvent.click(screen.getByLabelText('Select Flame Tongue for printing'))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('Alchemy Jug')).toBeInTheDocument()
    expect(within(printArea).getByText('A sword wreathed in fire.')).toBeInTheDocument()
    expect(within(printArea).getByText('Requires Attunement')).toBeInTheDocument()
  })

  it('opens a detail modal when a row is clicked', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Amulet of Health')
    fireEvent.click(screen.getByText('Amulet of Health'))
    expect(screen.getByRole('dialog', { name: 'Amulet of Health' })).toBeInTheDocument()
    expect(screen.getByText('Your Constitution is 19.')).toBeInTheDocument()
    expect(screen.getByText('Source: DMG, p. 150')).toBeInTheDocument()
  })

  it('does not show edit/delete for official items', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByText('Alchemy Jug'))
    expect(screen.getByRole('dialog', { name: 'Alchemy Jug' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })

  it('groups +X variant templates into a single entry on the Variants tab', async () => {
    mockFetchAllVariants.mockResolvedValue(sampleVariants)
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('+X Weapons')).toBeInTheDocument()
    expect(screen.getByText('3 variants')).toBeInTheDocument()
    expect(screen.queryByText('Weapon +1')).not.toBeInTheDocument()
    expect(screen.getByText('+X Armor')).toBeInTheDocument()
    expect(screen.getByText('Weapon Enchantments')).toBeInTheDocument()
    expect(screen.getByText('Flame Tongue')).toBeInTheDocument()
    expect(screen.getByText('Ammunition Enchantments')).toBeInTheDocument()
    expect(screen.getByText('Arrow of Slaying (Generic)')).toBeInTheDocument()
    expect(screen.getByText('6 variant entries')).toBeInTheDocument()
  })

  it('does not add a card for a variant until a base item is chosen', async () => {
    mockFetchAllVariants.mockResolvedValue(sampleVariants)
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    fireEvent.click(screen.getByLabelText('Select +X Weapons for printing'))
    expect(screen.getByRole('button', { name: /Print selected \(0\)/ })).toBeDisabled()
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).queryByText('+X Weapons')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '+1 Dagger' }))
    expect(screen.getByRole('button', { name: /Print selected \(1\)/ })).toBeEnabled()
    expect(within(printArea).getByText('+1 Dagger')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Print selected/ }))
    expect(window.print).toHaveBeenCalled()
  })

  it('filters variant entries by search', async () => {
    mockFetchAllVariants.mockResolvedValue(sampleVariants)
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    const search = screen.getByLabelText('Search variants')
    fireEvent.change(search, { target: { value: 'flame' } })
    expect(screen.getByText('Flame Tongue')).toBeInTheDocument()
    expect(screen.queryByText('+X Weapons')).not.toBeInTheDocument()
  })

  it('renders resistance armor description derived from inherits data', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({
        id: 907,
        name: 'Armor of Fire Resistance',
        description: '',
        variantRequires: '{"armor":true}',
        detailsJson: JSON.stringify({ name: 'Armor of Fire Resistance', inherits: { rarity: 'Rare', resist: 'fire' } }),
      }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Armor of Fire Resistance')).toBeInTheDocument()
    expect(screen.getByText('You have resistance to fire damage while you wear this armor.')).toBeInTheDocument()
  })

  it('validates name and description in the create form', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'New Magic Item' }))
    fireEvent.click(screen.getByRole('button', { name: 'Create Item' }))
    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Name:'), { target: { value: 'Staff of Fire' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Item' }))
    expect(screen.getByText('Description is required')).toBeInTheDocument()
  })

  it('creates a custom item and reloads the list', async () => {
    mockCreateItem.mockResolvedValue(
      baseItem({ id: 6, name: 'Staff of Fire', description: 'A staff that bursts into flame.', custom: true, ownerUsername: 'user' }),
    )
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'New Magic Item' }))
    fireEvent.change(screen.getByLabelText('Name:'), { target: { value: 'Staff of Fire' } })
    fireEvent.change(screen.getByLabelText('Description:'), { target: { value: 'A staff that bursts into flame.' } })
    fireEvent.change(screen.getByLabelText('Rarity:'), { target: { value: 'Rare' } })
    fireEvent.change(screen.getByLabelText('Type:'), { target: { value: 'WD' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Item' }))
    await waitFor(() => expect(mockCreateItem).toHaveBeenCalledWith({
      name: 'Staff of Fire',
      description: 'A staff that bursts into flame.',
      rarity: 'Rare',
      type: 'WD',
      weight: null,
      requiresAttunement: false,
      attunement: null,
    }))
    expect(screen.getByText('Magic item created')).toBeInTheDocument()
  })

  it('edits a custom item from the detail modal', async () => {
    mockFetchItems.mockResolvedValue([baseItem({ id: 4, name: 'My Custom Wand', description: 'Old description.', custom: true, ownerUsername: 'user' })])
    mockUpdateItem.mockResolvedValue(baseItem({ id: 4, name: 'My Custom Wand', description: 'New description.', custom: true, ownerUsername: 'user' }))
    render(<MagicItemsPage />)
    await screen.findByText('My Custom Wand')
    fireEvent.click(screen.getByText('My Custom Wand'))
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByRole('dialog', { name: 'Edit Magic Item' })).toBeInTheDocument()
    const descInput = screen.getByLabelText('Description:')
    fireEvent.change(descInput, { target: { value: 'New description.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
    await waitFor(() => expect(mockUpdateItem).toHaveBeenCalledWith(4, expect.objectContaining({ description: 'New description.' })))
    expect(screen.getByText('Magic item updated')).toBeInTheDocument()
  })

  it('deletes a custom item after confirmation', async () => {
    mockFetchItems.mockResolvedValue([baseItem({ id: 4, name: 'My Custom Wand', description: 'My own creation.', custom: true, ownerUsername: 'user' })])
    mockDeleteItem.mockResolvedValue(undefined)
    render(<MagicItemsPage />)
    await screen.findByText('My Custom Wand')
    fireEvent.click(screen.getByText('My Custom Wand'))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(mockDeleteItem).toHaveBeenCalledWith(4))
    expect(screen.getByText('Magic item deleted')).toBeInTheDocument()
  })

  it('shows base item buttons for a selected weapon variant and builds a card', async () => {
    mockFetchAllVariants.mockResolvedValue(sampleVariants)
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    fireEvent.click(screen.getByLabelText('Select Flame Tongue for printing'))
    const longswordBtn = screen.getByRole('button', { name: 'Flame Tongue Longsword' })
    expect(longswordBtn).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Flame Tongue Dagger' })).not.toBeInTheDocument()
    fireEvent.click(longswordBtn)
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('Flame Tongue Longsword')).toBeInTheDocument()
    expect(within(printArea).getAllByText('A sword wreathed in fire.')).toHaveLength(1)
  })

  it('lets the user pick the +X value for a merged weapon group', async () => {
    mockFetchAllVariants.mockResolvedValue(sampleVariants)
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    fireEvent.click(screen.getByLabelText('Select +X Weapons for printing'))
    expect(screen.getByRole('button', { name: '+1 Dagger' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Bonus for +X Weapons'), { target: { value: '903' } })
    expect(screen.queryByRole('button', { name: '+1 Dagger' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '+3 Dagger' }))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('+3 Dagger')).toBeInTheDocument()
  })

  it('shows armor types but not shields for an armor variant', async () => {
    mockFetchAllVariants.mockResolvedValue(sampleVariants)
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    fireEvent.click(screen.getByLabelText('Select +X Armor for printing'))
    expect(screen.getByRole('button', { name: '+1 Plate' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+1 Leather' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '+1 Shield' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '+1 Plate' }))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('+1 Plate')).toBeInTheDocument()
  })

  it('removes built cards when a variant is deselected', async () => {
    mockFetchAllVariants.mockResolvedValue(sampleVariants)
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    fireEvent.click(screen.getByLabelText('Select +X Weapons for printing'))
    fireEvent.click(screen.getByRole('button', { name: '+1 Dagger' }))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('+1 Dagger')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Select +X Weapons for printing'))
    expect(within(printArea).queryByText('+1 Dagger')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Print selected \(0\)/ })).toBeDisabled()
  })

  it('shows only shields for a shield variant', async () => {
    mockFetchAllVariants.mockResolvedValue(sampleVariants)
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    fireEvent.click(screen.getByLabelText('Select +X Shields for printing'))
    expect(screen.getByRole('button', { name: '+1 Shield' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Plate/ })).not.toBeInTheDocument()
  })

  it('limits slashing-sword variants to slashing swords', async () => {
    mockFetchAllVariants.mockResolvedValue(sampleVariants)
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    fireEvent.click(screen.getByLabelText('Select Sword of Sharpness for printing'))
    expect(screen.getByRole('button', { name: 'Sword of Sharpness (Greatsword)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sword of Sharpness (Longsword)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sword of Sharpness (Scimitar)' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sword of Sharpness (Shortsword)' })).not.toBeInTheDocument()
  })
})
