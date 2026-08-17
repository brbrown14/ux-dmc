import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MagicItemsPage from './MagicItemsPage'

const mockFetchItems = vi.fn()
const mockFetchAllVariants = vi.fn()
const mockFetchBaseItems = vi.fn()
const mockCreateItem = vi.fn()
const mockUpdateItem = vi.fn()
const mockDeleteItem = vi.fn()

vi.mock('../api/magicItems', () => ({
  fetchMagicItems: (...args: unknown[]) => mockFetchItems(...args),
  fetchAllMagicItemVariants: (...args: unknown[]) => mockFetchAllVariants(...args),
  fetchBaseItems: (...args: unknown[]) => mockFetchBaseItems(...args),
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

function baseItemFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 1000,
    name: 'Longsword',
    description: '',
    source: 'PHB',
    page: 149,
    type: 'M',
    weight: '3 lb.',
    value: null,
    weaponCategory: 'martial',
    property: 'V',
    range: null,
    dmg1: '1d8',
    dmg2: '1d10',
    dmgType: 'S',
    ac: null,
    stealth: null,
    strength: null,
    flags: 'weapon,sword',
    detailsJson: null,
    ...overrides,
  }
}

const sampleBaseItems = [
  baseItemFixture({ id: 1000, name: 'Longsword', dmg1: '1d8', dmgType: 'S' }),
  baseItemFixture({ id: 1001, name: 'Dagger', type: 'M', dmg1: '1d4', dmgType: 'P', property: 'F,L,T', flags: 'weapon,dagger' }),
  baseItemFixture({ id: 1002, name: 'Greatsword', dmg1: '2d6', dmgType: 'S', property: 'H', flags: 'weapon,sword' }),
  baseItemFixture({ id: 1003, name: 'Scimitar', dmg1: '1d6', dmgType: 'S', property: 'F,L', flags: 'weapon,sword' }),
  baseItemFixture({ id: 1004, name: 'Shortsword', dmg1: '1d6', dmgType: 'P', property: 'F,L', flags: 'weapon,sword' }),
  baseItemFixture({ id: 1005, name: 'Plate Armor', type: 'HA', weight: '65 lb.', weaponCategory: null, property: null, dmg1: null, dmg2: null, dmgType: null, ac: 18, stealth: true, strength: '15', flags: 'armor' }),
  baseItemFixture({ id: 1006, name: 'Leather Armor', type: 'LA', weight: '10 lb.', weaponCategory: null, property: null, dmg1: null, dmg2: null, dmgType: null, ac: 11, stealth: false, strength: null, flags: 'armor' }),
  baseItemFixture({ id: 1007, name: 'Shield', type: 'S', weight: '6 lb.', weaponCategory: null, property: null, dmg1: null, dmg2: null, dmgType: null, ac: 2, stealth: false, strength: null, flags: '' }),
]

const extraItems = [
  baseItem({ id: 10, name: 'Common Amulet', description: 'A simple amulet.', rarity: 'Common' }),
  baseItem({ id: 11, name: 'Very Rare Staff', description: 'A powerful staff.', rarity: 'Very Rare', type: 'WD', requiresAttunement: true, attunement: 'OPTIONAL' }),
  baseItem({ id: 12, name: 'Legendary Sword', description: 'A legendary blade.', rarity: 'Legendary', requiresAttunement: true, attunement: 'Yes, by a bard' }),
  baseItem({ id: 13, name: 'Artifact Crown', description: 'A crown of power.', rarity: 'Artifact', requiresAttunement: false, attunement: null }),
  baseItem({ id: 14, name: 'Varies Token', description: 'A token.', rarity: 'Varies' }),
  baseItem({ id: 15, name: 'Unknown Trinket', description: 'A trinket.', rarity: 'Unknown' }),
  baseItem({ id: 16, name: 'Official Wand', description: 'An official wand.', rarity: 'Rare', type: 'WD', custom: false }),
  baseItem({ id: 17, name: 'Custom Ring', description: 'A custom ring.', rarity: 'Uncommon', type: 'RG', custom: true, ownerUsername: 'user' }),
]

const extraVariants = [
  variantItem({
    id: 950,
    name: 'Weapon +1',
    description: '',
    detailsJson: JSON.stringify({ inherits: { nameSuffix: ' +1', genericBonus: '+1', entries: ['You get +1.'] } }),
  }),
  variantItem({
    id: 951,
    name: 'Weapon +1',
    description: '',
    detailsJson: JSON.stringify({ inherits: { nameSuffix: ' +2', genericBonus: '+2', entries: ['You get +2.'] } }),
  }),
  variantItem({
    id: 952,
    name: 'Weapon +1',
    description: '',
    detailsJson: JSON.stringify({ inherits: { nameSuffix: ' +3', genericBonus: '+3', entries: ['You get +3.'] } }),
  }),
  variantItem({
    id: 953,
    name: 'Armor of Elemental Resistance',
    description: '',
    variantRequires: '{"armor":true}',
    detailsJson: JSON.stringify({ inherits: { rarity: 'Very Rare', resist: 'cold', entries: ['You gain resistance to cold damage.'] } }),
  }),
  variantItem({
    id: 954,
    name: 'Potion of Healing',
    description: 'A potion that restores health.',
    variantRequires: null,
  }),
  variantItem({
    id: 955,
    name: 'Ring of Protection',
    description: '',
    detailsJson: JSON.stringify({ inherits: { namePrefix: 'Ring of Protection ', entries: ['You get +1 AC.'] } }),
  }),
  variantItem({
    id: 956,
    name: 'Scroll of Fireball',
    description: '',
    variantRequires: '{"type":"SC"}',
    detailsJson: JSON.stringify({ inherits: { entries: [{ entries: ['A scroll containing fireball.'] }] } }),
  }),
  variantItem({
    id: 957,
    name: 'Wand of Wonder',
    description: '',
    variantRequires: '{"type":"WD"}',
    detailsJson: JSON.stringify({ inherits: { nameSuffix: ' (Rod)', entries: ['A strange wand.'] } }),
  }),
  variantItem({
    id: 958,
    name: 'Rod of Attraction',
    description: '',
    variantRequires: '{"type":"RD"}',
    detailsJson: JSON.stringify({ inherits: { entries: ['A rod of wonder.'] } }),
  }),
  variantItem({
    id: 959,
    name: 'Lightning Bow',
    description: '',
    variantRequires: '{"bow":true}',
  }),
  variantItem({
    id: 960,
    name: 'Explosive Crossbow',
    description: '',
    variantRequires: '{"crossbow":true}',
  }),
  variantItem({
    id: 961,
    name: 'Flaming Spear',
    description: '',
    variantRequires: '{"spear":true}',
  }),
  variantItem({
    id: 962,
    name: 'Reach Halberd',
    description: '',
    variantRequires: '{"polearm":true}',
  }),
  variantItem({
    id: 963,
    name: 'Throwing Axe',
    description: '',
    variantRequires: '{"axe":true}',
  }),
  variantItem({
    id: 964,
    name: 'Longsword of Sharpness',
    description: '',
    variantRequires: '{"name":"Longsword","dmgType":"S"}',
  }),
  variantItem({
    id: 965,
    name: 'Martial Weapon +1',
    description: '',
    variantRequires: '{"weaponCategory":"martial"}',
    detailsJson: JSON.stringify({ inherits: { nameSuffix: ' +1', genericBonus: '+1' } }),
  }),
  variantItem({
    id: 966,
    name: 'Specific Weapon',
    description: '',
    variantRequires: '{"names":["Longsword","Dagger"]}',
  }),
  variantItem({
    id: 967,
    name: 'Armor of Blinding',
    description: '',
    variantRequires: '{"type":"MA"}',
  }),
  variantItem({
    id: 968,
    name: 'Leather Armor +1',
    description: '',
    variantRequires: '{"type":"LA"}',
  }),
  variantItem({
    id: 969,
    name: 'Arrow of Wounding',
    description: '',
    variantRequires: '{"ammunition":true}',
  }),
  variantItem({
    id: 970,
    name: 'Enchanted Weapon',
    description: '',
    variantRequires: '{"weapon":true}',
  }),
  variantItem({
    id: 971,
    name: 'Bardic Instrument',
    description: '',
    variantRequires: '{"type":"INS"}',
  }),
  variantItem({
    id: 972,
    name: 'Shield of the Paladin',
    description: '',
    variantRequires: '{"type":"S","weaponCategory":"martial"}',
    detailsJson: JSON.stringify({ inherits: { entries: ['A sacred shield.'] } }),
  }),
  variantItem({
    id: 973,
    name: 'Scroll of Healing',
    description: '',
    variantRequires: '{"type":"SCF"}',
  }),
  variantItem({
    id: 974,
    name: 'Ring of Mind Shielding',
    description: '',
    variantRequires: '{"type":"RG"}',
  }),
  variantItem({
    id: 975,
    name: 'Gloves of Thievery',
    description: '',
    variantRequires: '{"type":"G"}',
  }),
  variantItem({
    id: 976,
    name: 'Ammunition +1',
    description: '',
    variantRequires: '{"type":"A"}',
  }),
  variantItem({
    id: 977,
    name: 'Lance of Lethality',
    description: '',
    variantRequires: null,
  }),
  variantItem({
    id: 978,
    name: 'Weapon (no damage) +1',
    description: '',
    detailsJson: JSON.stringify({ inherits: { nameSuffix: ' +1', genericBonus: '+1', entries: ['Non-damage weapon.'] } }),
  }),
]

const extraBaseItems = [
  baseItemFixture({ id: 1100, name: 'Battleaxe', type: 'M', dmg1: '1d8', dmg2: '1d10', dmgType: 'S', property: 'V', weaponCategory: 'martial', flags: 'weapon,axe' }),
  baseItemFixture({ id: 1101, name: 'Longbow', type: 'M', dmg1: '1d8', dmgType: 'P', property: 'A,2H', range: '150/600', weaponCategory: 'martial', flags: 'weapon,bow' }),
  baseItemFixture({ id: 1102, name: 'Light Crossbow', type: 'M', dmg1: '1d8', dmgType: 'P', property: 'A,LD', range: '80/320', weaponCategory: 'martial', flags: 'weapon,crossbow' }),
  baseItemFixture({ id: 1103, name: 'Spear', type: 'M', dmg1: '1d6', dmg2: '1d8', dmgType: 'P', property: 'T,V', range: '20/60', weaponCategory: 'simple', flags: 'weapon,spear' }),
  baseItemFixture({ id: 1104, name: 'Glaive', type: 'M', dmg1: '1d10', dmgType: 'S', property: 'H,2H,R', weaponCategory: 'martial', flags: 'weapon,polearm' }),
  baseItemFixture({ id: 1105, name: 'Chain Mail', type: 'HA', weight: '55 lb.', weaponCategory: null, property: null, dmg1: null, dmg2: null, dmgType: null, ac: 16, stealth: true, strength: '13', flags: 'armor' }),
  baseItemFixture({ id: 1106, name: 'Scale Mail', type: 'MA', weight: '45 lb.', weaponCategory: null, property: null, dmg1: null, dmg2: null, dmgType: null, ac: 14, stealth: true, strength: null, flags: 'armor' }),
  baseItemFixture({ id: 1107, name: 'Studded Leather', type: 'LA', weight: '13 lb.', weaponCategory: null, property: null, dmg1: null, dmg2: null, dmgType: null, ac: 12, stealth: false, strength: null, flags: 'armor' }),
  baseItemFixture({ id: 1108, name: 'Arrow', type: 'A', weight: '1 lb.', weaponCategory: null, property: null, dmg1: null, dmg2: null, dmgType: null, ac: null, stealth: false, strength: null, flags: '' }),
]

beforeEach(() => {
  vi.clearAllMocks()
  window.print = vi.fn()
  window.confirm = vi.fn(() => true)
  mockFetchItems.mockResolvedValue(sampleItems)
  mockFetchAllVariants.mockResolvedValue([])
  mockFetchBaseItems.mockResolvedValue(sampleBaseItems)
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
    expect(screen.getByRole('button', { name: '+1 Plate Armor' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+1 Leather Armor' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '+1 Shield' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '+1 Plate Armor' }))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('+1 Plate Armor')).toBeInTheDocument()
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

  it('shows base items on the Common tab and builds a print card from one', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    expect(await screen.findByText('8 base items')).toBeInTheDocument()
    expect(screen.getByText('Longsword')).toBeInTheDocument()
    expect(screen.getByText('Plate Armor')).toBeInTheDocument()
    expect(screen.getByText(/1d8 slashing/)).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Select Longsword for printing'))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('Longsword')).toBeInTheDocument()
    expect(within(printArea).getByText('1d8 slashing')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Print selected \(1\)/ }))
    expect(window.print).toHaveBeenCalled()
  })

  it('filters base items by type on the Common tab', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await screen.findByText('8 base items')
    fireEvent.change(screen.getByLabelText('Filter base items by type'), { target: { value: 'HA' } })
    expect(screen.getByText('Plate Armor')).toBeInTheDocument()
    expect(screen.queryByText('Longsword')).not.toBeInTheDocument()
    expect(screen.getByText('1 base item')).toBeInTheDocument()
  })

  it('filters items by official source', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.change(screen.getByLabelText('Filter by source'), { target: { value: 'official' } })
    expect(screen.getByText('Alchemy Jug')).toBeInTheDocument()
    expect(screen.getByText('Amulet of Health')).toBeInTheDocument()
    expect(screen.queryByText('My Custom Wand')).not.toBeInTheDocument()
  })

  it('sorts items by type ascending and toggles to descending', async () => {
    mockFetchItems.mockResolvedValue([
      baseItem({ id: 30, name: 'Wand A', type: 'WD' }),
      baseItem({ id: 31, name: 'Shield B', type: 'S' }),
      baseItem({ id: 32, name: 'Ring C', type: 'RG' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Wand A')
    fireEvent.click(screen.getByRole('button', { name: /Type/ }))
    const ascOrder = screen
      .getAllByText(/^(Wand A|Shield B|Ring C)$/)
      .map((el) => el.textContent)
    expect(ascOrder).toEqual(['Ring C', 'Shield B', 'Wand A'])
    fireEvent.click(screen.getByRole('button', { name: /Type/ }))
    const descOrder = screen
      .getAllByText(/^(Wand A|Shield B|Ring C)$/)
      .map((el) => el.textContent)
    expect(descOrder).toEqual(['Wand A', 'Shield B', 'Ring C'])
  })

  it('toggles sort direction when clicking the same column', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: /Name/ }))
    const descOrder = screen
      .getAllByText(/^(Alchemy Jug|Amulet of Health|Flame Tongue|My Custom Wand)$/)
      .map((el) => el.textContent)
    expect(descOrder).toEqual(['My Custom Wand', 'Flame Tongue', 'Amulet of Health', 'Alchemy Jug'])
  })

  it('renders rarity badges for all rarity values', async () => {
    mockFetchItems.mockResolvedValue(extraItems)
    render(<MagicItemsPage />)
    await screen.findByText('Common Amulet')
    expect(screen.getAllByText('Common').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Very Rare').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Legendary').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Artifact').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Varies').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Unknown').length).toBeGreaterThanOrEqual(1)
  })

  it('shows attunement optional in detail modal', async () => {
    mockFetchItems.mockResolvedValue([
      baseItem({ id: 20, name: 'Optional Staff', description: 'A staff.', requiresAttunement: false, attunement: 'OPTIONAL' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Optional Staff')
    fireEvent.click(screen.getByText('Optional Staff'))
    expect(screen.getByRole('dialog', { name: 'Optional Staff' })).toBeInTheDocument()
    expect(screen.getByText('Attunement Optional')).toBeInTheDocument()
  })

  it('shows custom attunement text in detail modal', async () => {
    mockFetchItems.mockResolvedValue([
      baseItem({ id: 21, name: 'Barb Sword', description: 'A sword.', requiresAttunement: false, attunement: 'Requires Attunement by a barbarian' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Barb Sword')
    fireEvent.click(screen.getByText('Barb Sword'))
    expect(screen.getByRole('dialog', { name: 'Barb Sword' })).toBeInTheDocument()
    expect(screen.getByText('Requires Attunement: Requires Attunement by a barbarian')).toBeInTheDocument()
  })

  it('shows no attunement required in print card', async () => {
    mockFetchItems.mockResolvedValue([
      baseItem({ id: 22, name: 'Plain Ring', description: 'A plain ring.', requiresAttunement: false, attunement: null }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Plain Ring')
    fireEvent.click(screen.getByLabelText('Select Plain Ring for printing'))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('No Attunement Required')).toBeInTheDocument()
  })

  it('renders variant sections with various classification branches', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 970, name: 'Enchanted Weapon', variantRequires: '{"weapon":true}' }),
      variantItem({ id: 969, name: 'Arrow of Wounding', variantRequires: '{"ammunition":true}' }),
      variantItem({ id: 967, name: 'Armor of Blinding', variantRequires: '{"type":"MA"}' }),
      variantItem({ id: 968, name: 'Leather Armor +1', variantRequires: '{"type":"LA"}' }),
      variantItem({ id: 954, name: 'Potion of Healing', description: 'A potion that restores health.', variantRequires: null }),
      variantItem({ id: 977, name: 'Lance of Lethality', description: '', variantRequires: null }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Weapon Enchantments')).toBeInTheDocument()
    expect(screen.getByText('Ammunition Enchantments')).toBeInTheDocument()
    expect(screen.getByText('Armor Enchantments')).toBeInTheDocument()
    expect(screen.getByText('Other Variants')).toBeInTheDocument()
  })

  it('classifies variants by name keywords (armor, ammunition, weapon names)', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 978, name: 'Armor of Speed', description: 'Fast armor.', variantRequires: null }),
      variantItem({ id: 979, name: 'Magic Ammunition Bundle', description: 'Arrows.', variantRequires: null }),
      variantItem({ id: 980, name: 'Sharp Sword', description: 'Cuts well.', variantRequires: null }),
      variantItem({ id: 981, name: 'Great Axe', description: 'Chops hard.', variantRequires: null }),
      variantItem({ id: 982, name: 'Long Bow', description: 'Far shooter.', variantRequires: null }),
      variantItem({ id: 983, name: 'Heavy Crossbow', description: 'Pierces armor.', variantRequires: null }),
      variantItem({ id: 984, name: 'Javelin Spear', description: 'Thrown far.', variantRequires: null }),
      variantItem({ id: 985, name: 'Glaive Polearm', description: 'Long reach.', variantRequires: null }),
      variantItem({ id: 986, name: 'Cavalry Lance', description: 'Charge!', variantRequires: null }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Weapon Enchantments')).toBeInTheDocument()
  })

  it('classifies variant with names array as weapon when names include non-armor', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 987, name: 'Multi Weapon', variantRequires: '{"names":["Longsword","Dagger"]}' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Weapon Enchantments')).toBeInTheDocument()
    expect(screen.getByText('Multi Weapon')).toBeInTheDocument()
  })

  it('classifies variant with names array as armor when all names are armor', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 988, name: 'Armor Set', variantRequires: '{"names":["Plate Armor","Leather Armor"]}' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Armor Enchantments')).toBeInTheDocument()
    expect(screen.getByText('Armor Set')).toBeInTheDocument()
  })

  it('shows concrete card with prefix name', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({
        id: 955,
        name: 'Ring of Protection',
        description: '',
        detailsJson: JSON.stringify({ inherits: { namePrefix: 'Ring of Protection ', entries: ['You get +1 AC.'] } }),
        variantRequires: '{"weapon":true}',
      }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Ring of Protection')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Select Ring of Protection for printing'))
    expect(screen.getByRole('button', { name: 'Ring of Protection Longsword' })).toBeInTheDocument()
  })

  it('shows concrete card with suffix that is not a bonus pattern', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({
        id: 957,
        name: 'Wand of Wonder',
        description: '',
        detailsJson: JSON.stringify({ inherits: { nameSuffix: ' (Rod)', entries: ['A strange wand.'] } }),
        variantRequires: '{"weapon":true}',
      }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Wand of Wonder')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Select Wand of Wonder for printing'))
    expect(screen.getByRole('button', { name: 'Longsword (Rod)' })).toBeInTheDocument()
  })

  it('shows concrete card with fallback name when no prefix or suffix', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({
        id: 954,
        name: 'Potion of Healing',
        description: 'A potion that restores health.',
        variantRequires: '{"weapon":true}',
        detailsJson: null,
      }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Potion of Healing')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Select Potion of Healing for printing'))
    expect(screen.getByText('Potion of Healing (Longsword)')).toBeInTheDocument()
  })

  it('shows bonus label from suffix in variant bonus dropdown', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 950, name: 'Weapon +1', detailsJson: JSON.stringify({ inherits: { nameSuffix: ' +1', genericBonus: '+1' } }) }),
      variantItem({ id: 951, name: 'Weapon +1', detailsJson: JSON.stringify({ inherits: { nameSuffix: ' +2', genericBonus: '+2' } }) }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    fireEvent.click(screen.getByLabelText('Select +X Weapons for printing'))
    const bonusSelect = screen.getByLabelText('Bonus for +X Weapons')
    expect(within(bonusSelect).getByText('+1')).toBeInTheDocument()
    expect(within(bonusSelect).getByText('+2')).toBeInTheDocument()
  })

  it('shows bonus label from prefix in variant bonus dropdown', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({
        id: 989,
        name: 'Weapon +1',
        detailsJson: JSON.stringify({ inherits: { namePrefix: 'Flame Tongue ' } }),
      }),
      variantItem({
        id: 990,
        name: 'Weapon +2',
        detailsJson: JSON.stringify({ inherits: { nameSuffix: ' +2', genericBonus: '+2' } }),
      }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    fireEvent.click(screen.getByLabelText('Select +X Weapons for printing'))
    const bonusSelect = screen.getByLabelText('Bonus for +X Weapons')
    expect(within(bonusSelect).getByText('Flame Tongue')).toBeInTheDocument()
  })

  it('shows bonus label from name fallback when no suffix or prefix', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 991, name: 'Weapon +1', detailsJson: null }),
      variantItem({ id: 992, name: 'Weapon +2', detailsJson: JSON.stringify({ inherits: { nameSuffix: ' +2', genericBonus: '+2' } }) }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    fireEvent.click(screen.getByLabelText('Select +X Weapons for printing'))
    const bonusSelect = screen.getByLabelText('Bonus for +X Weapons')
    expect(within(bonusSelect).getByText('Weapon +1')).toBeInTheDocument()
  })

  it('renders variant with entries from detailsJson as description', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({
        id: 956,
        name: 'Scroll of Fireball',
        description: '',
        variantRequires: '{"type":"SC"}',
        detailsJson: JSON.stringify({ inherits: { entries: ['A scroll containing fireball.'] } }),
      }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Scroll of Fireball')).toBeInTheDocument()
  })

  it('renders variant with nested entries from detailsJson', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({
        id: 993,
        name: 'Nested Scroll',
        description: '',
        detailsJson: JSON.stringify({ inherits: { entries: [{ entries: ['A nested scroll.'] }] } }),
      }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Nested Scroll')).toBeInTheDocument()
  })

  it('renders variant with Note: prefixed entry skipped in description', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({
        id: 994,
        name: 'Note Variant',
        description: '',
        detailsJson: JSON.stringify({ inherits: { entries: ['Note: This should be skipped.', 'This should appear.'] } }),
      }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Note Variant')).toBeInTheDocument()
  })

  it('shows variant description from resist when no entries', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({
        id: 995,
        name: 'Acid Armor',
        description: '',
        variantRequires: '{"armor":true}',
        detailsJson: JSON.stringify({ inherits: { rarity: 'Rare', resist: 'acid' } }),
      }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Acid Armor')).toBeInTheDocument()
    expect(screen.getByText('You have resistance to acid damage while you wear this armor.')).toBeInTheDocument()
  })

  it('describeRequires shows various property combinations', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 959, name: 'Lightning Bow', variantRequires: '{"bow":true}' }),
      variantItem({ id: 960, name: 'Explosive Crossbow', variantRequires: '{"crossbow":true}' }),
      variantItem({ id: 961, name: 'Flaming Spear', variantRequires: '{"spear":true}' }),
      variantItem({ id: 962, name: 'Reach Halberd', variantRequires: '{"polearm":true}' }),
      variantItem({ id: 963, name: 'Throwing Axe', variantRequires: '{"axe":true}' }),
      variantItem({ id: 965, name: 'Martial Weapon +1', variantRequires: '{"weaponCategory":"martial"}', detailsJson: JSON.stringify({ inherits: { nameSuffix: ' +1', genericBonus: '+1' } }) }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('Weapon Enchantments')
    expect(screen.getByText('Applies to bows')).toBeInTheDocument()
    expect(screen.getByText('Applies to crossbows')).toBeInTheDocument()
    expect(screen.getByText('Applies to spears')).toBeInTheDocument()
    expect(screen.getByText('Applies to polearms')).toBeInTheDocument()
    expect(screen.getByText('Applies to axes')).toBeInTheDocument()
    expect(screen.getByText('Applies to martial weapons')).toBeInTheDocument()
  })

  it('describeRequires shows dmgType and name properties', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 964, name: 'Longsword of Sharpness', variantRequires: '{"name":"Longsword","dmgType":"S"}' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Longsword of Sharpness')).toBeInTheDocument()
    expect(screen.getByText('Applies to Longsword, slashing damage')).toBeInTheDocument()
  })

  it('describeRequires shows names joined by comma', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 966, name: 'Specific Weapon', variantRequires: '{"names":["Longsword","Dagger"]}' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Specific Weapon')).toBeInTheDocument()
    expect(screen.getByText('Applies to Longsword, Dagger')).toBeInTheDocument()
  })

  it('buildConcreteStats shows versatile damage for weapons with V property', async () => {
    mockFetchAllVariants.mockResolvedValue(sampleVariants)
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    fireEvent.click(screen.getByLabelText('Select +X Weapons for printing'))
    fireEvent.click(screen.getByRole('button', { name: '+1 Longsword' }))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('+1 Longsword')).toBeInTheDocument()
    expect(within(printArea).getAllByText(/1d8 slashing/).length).toBeGreaterThanOrEqual(1)
    expect(within(printArea).getAllByText(/Versatile/).length).toBeGreaterThanOrEqual(1)
  })

  it('buildConcreteStats shows shield AC with plus prefix', async () => {
    mockFetchAllVariants.mockResolvedValue(sampleVariants)
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    fireEvent.click(screen.getByLabelText('Select +X Shields for printing'))
    fireEvent.click(screen.getByRole('button', { name: '+1 Shield' }))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('+1 Shield')).toBeInTheDocument()
    expect(within(printArea).getByText('AC +2')).toBeInTheDocument()
  })

  it('buildConcreteStats shows armor AC without plus prefix', async () => {
    mockFetchAllVariants.mockResolvedValue(sampleVariants)
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    fireEvent.click(screen.getByLabelText('Select +X Armor for printing'))
    fireEvent.click(screen.getByRole('button', { name: '+1 Plate Armor' }))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('+1 Plate Armor')).toBeInTheDocument()
    expect(within(printArea).getByText('AC 18')).toBeInTheDocument()
    expect(within(printArea).getByText('Stealth: Disadvantage')).toBeInTheDocument()
    expect(within(printArea).getByText('STR 15 required')).toBeInTheDocument()
  })

  it('buildConcreteStats shows weight for base items', async () => {
    mockFetchAllVariants.mockResolvedValue(sampleVariants)
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    fireEvent.click(screen.getByLabelText('Select +X Armor for printing'))
    fireEvent.click(screen.getByRole('button', { name: '+1 Plate Armor' }))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('+1 Plate Armor')).toBeInTheDocument()
    expect(within(printArea).getAllByText(/65 lb/).length).toBeGreaterThanOrEqual(1)
  })

  it('buildBaseItemStats shows all stat lines for various base items', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await screen.findByText('8 base items')
    expect(screen.getAllByText(/1d8 slashing/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Versatile/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Martial/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Finesse, Light/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/3 lb/).length).toBeGreaterThanOrEqual(1)
  })

  it('buildBaseItemStats shows shield AC with plus prefix', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await screen.findByText('8 base items')
    const printArea = screen.getByTestId('print-area')
    fireEvent.click(screen.getByLabelText('Select Shield for printing'))
    expect(within(printArea).getByText('AC +2')).toBeInTheDocument()
  })

  it('buildBaseItemStats shows armor AC and stealth for plate armor', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await screen.findByText('8 base items')
    const printArea = screen.getByTestId('print-area')
    fireEvent.click(screen.getByLabelText('Select Plate Armor for printing'))
    expect(within(printArea).getByText('AC 18')).toBeInTheDocument()
    expect(within(printArea).getByText('Stealth: Disadvantage')).toBeInTheDocument()
    expect(within(printArea).getByText('STR 15 required')).toBeInTheDocument()
  })

  it('buildBaseItemStats shows range for base items with range', async () => {
    mockFetchBaseItems.mockResolvedValue([
      baseItemFixture({ id: 1900, name: 'Longbow', type: 'M', dmg1: '1d8', dmgType: 'P', property: 'A,2H', range: '150/600', weaponCategory: 'martial', flags: 'weapon,bow' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await waitFor(() => {
      expect(screen.getByText('1 base item')).toBeInTheDocument()
    })
    expect(screen.getByText(/Range 150\/600/)).toBeInTheDocument()
  })

  it('typeLabel resolves BASE_TYPE_LABELS types in print cards', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await screen.findByText('8 base items')
    const printArea = screen.getByTestId('print-area')
    fireEvent.click(screen.getByLabelText('Select Plate Armor for printing'))
    expect(within(printArea).getByText('Heavy Armor (HA)')).toBeInTheDocument()
  })

  it('search on Common tab filters base items by name', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await screen.findByText('8 base items')
    fireEvent.change(screen.getByPlaceholderText('Search base items...'), { target: { value: 'long' } })
    expect(screen.getByText('Longsword')).toBeInTheDocument()
    expect(screen.queryByText('Dagger')).not.toBeInTheDocument()
  })

  it('search on Common tab filters base items by type', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await screen.findByText('8 base items')
    fireEvent.change(screen.getByPlaceholderText('Search base items...'), { target: { value: 'HA' } })
    expect(screen.getByText('Plate Armor')).toBeInTheDocument()
    expect(screen.queryByText('Longsword')).not.toBeInTheDocument()
  })

  it('shows empty state when no base items match search', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await screen.findByText('8 base items')
    fireEvent.change(screen.getByPlaceholderText('Search base items...'), { target: { value: 'zzzzz' } })
    expect(screen.getByText('No base items match your filters.')).toBeInTheDocument()
  })

  it('shows empty state on Variants tab when no variants match search', async () => {
    mockFetchAllVariants.mockResolvedValue(sampleVariants)
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    fireEvent.change(screen.getByLabelText('Search variants'), { target: { value: 'zzzzz' } })
    expect(screen.getByText('No variant templates match your filters.')).toBeInTheDocument()
  })

  it('variant search matches on description and requires text', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 953, name: 'Fire Armor', description: '', variantRequires: '{"armor":true}', detailsJson: JSON.stringify({ inherits: { resist: 'fire' } }) }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    fireEvent.change(screen.getByLabelText('Search variants'), { target: { value: 'fire' } })
    expect(screen.getByText('Fire Armor')).toBeInTheDocument()
  })

  it('closes the detail modal via close button', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByText('Alchemy Jug'))
    expect(screen.getByRole('dialog', { name: 'Alchemy Jug' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Alchemy Jug' })).not.toBeInTheDocument()
    })
  })

  it('removes a selected item from print selection via remove button', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByLabelText('Select Alchemy Jug for printing'))
    expect(screen.getByRole('button', { name: /Print selected \(1\)/ })).toBeEnabled()
    fireEvent.click(screen.getByLabelText('Remove Alchemy Jug from printing'))
    expect(screen.getByRole('button', { name: /Print selected \(0\)/ })).toBeDisabled()
  })

  it('cancels the create form', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'New Magic Item' }))
    expect(screen.getByRole('dialog', { name: 'Create Magic Item' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Create Magic Item' })).not.toBeInTheDocument()
    })
  })

  it('shows error toast when create fails', async () => {
    mockCreateItem.mockRejectedValue(new Error('fail'))
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'New Magic Item' }))
    fireEvent.change(screen.getByLabelText('Name:'), { target: { value: 'Staff' } })
    fireEvent.change(screen.getByLabelText('Description:'), { target: { value: 'A staff.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Item' }))
    await waitFor(() => {
      expect(screen.getByText('Failed to create magic item')).toBeInTheDocument()
    })
  })

  it('shows error toast when update fails', async () => {
    mockFetchItems.mockResolvedValue([baseItem({ id: 4, name: 'My Custom Wand', description: 'My own creation.', custom: true, ownerUsername: 'user' })])
    mockUpdateItem.mockRejectedValue(new Error('fail'))
    render(<MagicItemsPage />)
    await screen.findByText('My Custom Wand')
    fireEvent.click(screen.getByText('My Custom Wand'))
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByLabelText('Description:'), { target: { value: 'New.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
    await waitFor(() => {
      expect(screen.getByText('Failed to update magic item')).toBeInTheDocument()
    })
  })

  it('does not delete when user cancels confirmation', async () => {
    mockFetchItems.mockResolvedValue([baseItem({ id: 4, name: 'My Custom Wand', description: 'My own creation.', custom: true, ownerUsername: 'user' })])
    window.confirm = vi.fn(() => false)
    render(<MagicItemsPage />)
    await screen.findByText('My Custom Wand')
    fireEvent.click(screen.getByText('My Custom Wand'))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(mockDeleteItem).not.toHaveBeenCalled()
  })

  it('shows error toast when delete fails', async () => {
    mockFetchItems.mockResolvedValue([baseItem({ id: 4, name: 'My Custom Wand', description: 'My own creation.', custom: true, ownerUsername: 'user' })])
    mockDeleteItem.mockRejectedValue(new Error('fail'))
    render(<MagicItemsPage />)
    await screen.findByText('My Custom Wand')
    fireEvent.click(screen.getByText('My Custom Wand'))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => {
      expect(screen.getByText('Failed to delete magic item')).toBeInTheDocument()
    })
  })

  it('shows error toast when magic items load fails', async () => {
    mockFetchItems.mockRejectedValue(new Error('network'))
    render(<MagicItemsPage />)
    await waitFor(() => {
      expect(screen.getByText('Failed to load magic items')).toBeInTheDocument()
    })
  })

  it('shows error toast when variants load fails', async () => {
    mockFetchAllVariants.mockRejectedValue(new Error('network'))
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await waitFor(() => {
      expect(screen.getByText('Failed to load variant templates')).toBeInTheDocument()
    })
  })

  it('shows error toast when base items load fails', async () => {
    mockFetchBaseItems.mockRejectedValue(new Error('network'))
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await waitFor(() => {
      expect(screen.getByText('Failed to load base items')).toBeInTheDocument()
    })
  })

  it('shows empty variant list when no variants exist', async () => {
    mockFetchAllVariants.mockResolvedValue([])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await waitFor(() => {
      expect(screen.getByText('0 variant entries')).toBeInTheDocument()
    })
  })

  it('shows custom badge for custom items and official badge for non-custom items', async () => {
    mockFetchItems.mockResolvedValue([
      baseItem({ id: 40, name: 'Custom Thing', description: 'A thing.', custom: true, ownerUsername: 'user' }),
      baseItem({ id: 41, name: 'Official Thing', description: 'A thing.', custom: false }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Custom Thing')
    fireEvent.click(screen.getByText('Custom Thing'))
    expect(within(screen.getByRole('dialog', { name: 'Custom Thing' })).getByText('Custom')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Official Thing'))
    expect(within(screen.getByRole('dialog', { name: 'Official Thing' })).getByText('Official')).toBeInTheDocument()
  })

  it('shows no source or weight when item lacks them', async () => {
    mockFetchItems.mockResolvedValue([
      baseItem({ id: 42, name: 'Bare Item', description: 'Bare.', source: null, page: null, weight: null }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Bare Item')
    fireEvent.click(screen.getByText('Bare Item'))
    expect(screen.queryByText(/Source:/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Weight:/)).not.toBeInTheDocument()
  })

  it('shows weight in detail modal when present', async () => {
    mockFetchItems.mockResolvedValue([
      baseItem({ id: 43, name: 'Heavy Item', description: 'Heavy.', weight: '50 lb.' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Heavy Item')
    fireEvent.click(screen.getByText('Heavy Item'))
    expect(within(screen.getByRole('dialog', { name: 'Heavy Item' })).getByText(/Weight: 50 lb/)).toBeInTheDocument()
  })

  it('shows "No description available." for items with empty description', async () => {
    mockFetchItems.mockResolvedValue([
      baseItem({ id: 44, name: 'No Desc', description: '' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('No Desc')
    fireEvent.click(screen.getByText('No Desc'))
    expect(screen.getByText('No description available.')).toBeInTheDocument()
  })

  it('displays selected card stats, description, appliesTo, and attunement', async () => {
    mockFetchAllVariants.mockResolvedValue(sampleVariants)
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    fireEvent.click(screen.getByLabelText('Select +X Weapons for printing'))
    fireEvent.click(screen.getByRole('button', { name: '+1 Longsword' }))
    const selectedList = screen.getByText('Selected for printing').closest('div')!
    expect(within(selectedList).getByText('+1 Longsword')).toBeInTheDocument()
    expect(within(selectedList).getByText('No Attunement Required')).toBeInTheDocument()
  })

  it('displays typeLabel in print area when type is set', async () => {
    mockFetchItems.mockResolvedValue([
      baseItem({ id: 45, name: 'Typed Wand', description: 'A wand.', type: 'WD' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Typed Wand')
    fireEvent.click(screen.getByLabelText('Select Typed Wand for printing'))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('Wand (WD)')).toBeInTheDocument()
  })

  it('displays weight in print card when present', async () => {
    mockFetchItems.mockResolvedValue([
      baseItem({ id: 46, name: 'Weighted Item', description: 'Heavy.', weight: '10 lb.' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Weighted Item')
    fireEvent.click(screen.getByLabelText('Select Weighted Item for printing'))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('10 lb.')).toBeInTheDocument()
  })

  it('displays rarity "None" for items with null rarity in print cards', async () => {
    mockFetchItems.mockResolvedValue([
      baseItem({ id: 47, name: 'Null Rarity', description: 'No rarity.', rarity: null }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Null Rarity')
    fireEvent.click(screen.getByLabelText('Select Null Rarity for printing'))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('None')).toBeInTheDocument()
  })

  it('deduplicates variant base items from multiple members', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 950, name: 'Weapon +1', detailsJson: JSON.stringify({ inherits: { nameSuffix: ' +1', genericBonus: '+1' } }) }),
      variantItem({ id: 951, name: 'Weapon +1', detailsJson: JSON.stringify({ inherits: { nameSuffix: ' +2', genericBonus: '+2' } }) }),
      variantItem({ id: 952, name: 'Weapon +1', detailsJson: JSON.stringify({ inherits: { nameSuffix: ' +3', genericBonus: '+3' } }) }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    fireEvent.click(screen.getByLabelText('Select +X Weapons for printing'))
    const longswordButtons = screen.getAllByText(/Longsword/)
    const uniqueNames = new Set(longswordButtons.map((b) => b.textContent))
    expect(uniqueNames.size).toBeGreaterThanOrEqual(1)
  })

  it('shows variant entry with fallback "No description available."', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 996, name: 'Empty Desc Variant', description: '', detailsJson: null, variantRequires: null }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Empty Desc Variant')).toBeInTheDocument()
  })

  it('prints selection with attunement label in print area', async () => {
    mockFetchItems.mockResolvedValue([
      baseItem({ id: 50, name: 'Attuned Ring', description: 'A ring.', requiresAttunement: true, attunement: 'YES' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Attuned Ring')
    fireEvent.click(screen.getByLabelText('Select Attuned Ring for printing'))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('Requires Attunement')).toBeInTheDocument()
  })

  it('Common tab shows weapon category and property labels for martial weapons', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await screen.findByText('8 base items')
    expect(screen.getAllByText(/Martial/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Versatile/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Finesse/).length).toBeGreaterThanOrEqual(1)
  })

  it('Common tab search by type abbreviation finds base items', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await screen.findByText('8 base items')
    fireEvent.change(screen.getByPlaceholderText('Search base items...'), { target: { value: 'S' } })
    expect(screen.getByText('Shield')).toBeInTheDocument()
    expect(screen.queryByText('Plate Armor')).not.toBeInTheDocument()
  })

  it('prints multiple items and deselects correctly', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByLabelText('Select Alchemy Jug for printing'))
    fireEvent.click(screen.getByLabelText('Select Amulet of Health for printing'))
    expect(screen.getByRole('button', { name: /Print selected \(2\)/ })).toBeEnabled()
    fireEvent.click(screen.getByLabelText('Remove Alchemy Jug from printing'))
    expect(screen.getByRole('button', { name: /Print selected \(1\)/ })).toBeEnabled()
  })

  it('displays variant group with appliesTo from describeRequires', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 905, name: 'Armor +1', description: 'You have a +1 bonus to AC.', variantRequires: '{"armor":true}' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('+X Armor')).toBeInTheDocument()
    expect(screen.getByText('Applies to armor')).toBeInTheDocument()
  })

  it('displays variant group with appliesTo for weaponCategory', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 965, name: 'Martial Weapon +1', variantRequires: '{"weaponCategory":"martial"}', detailsJson: JSON.stringify({ inherits: { nameSuffix: ' +1', genericBonus: '+1' } }) }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Martial Weapon +1')).toBeInTheDocument()
    expect(screen.getByText('Applies to martial weapons')).toBeInTheDocument()
  })

  it('buildConcreteStats shows range for base items with range property', async () => {
    mockFetchAllVariants.mockResolvedValue(sampleVariants)
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    fireEvent.click(screen.getByLabelText('Select +X Weapons for printing'))
    fireEvent.click(screen.getByRole('button', { name: '+1 Dagger' }))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('+1 Dagger')).toBeInTheDocument()
  })

  it('shows variant search matching on member name', async () => {
    mockFetchAllVariants.mockResolvedValue(sampleVariants)
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    fireEvent.change(screen.getByLabelText('Search variants'), { target: { value: 'flame tongue' } })
    expect(screen.getByText('Flame Tongue')).toBeInTheDocument()
    expect(screen.queryByText('+X Armor')).not.toBeInTheDocument()
  })

  it('Common tab shows empty state when no base items loaded', async () => {
    mockFetchBaseItems.mockResolvedValue([])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await waitFor(() => {
      expect(screen.getByText('0 base items')).toBeInTheDocument()
    })
  })

  it('edit form cancels and closes', async () => {
    mockFetchItems.mockResolvedValue([baseItem({ id: 4, name: 'My Custom Wand', description: 'My own creation.', custom: true, ownerUsername: 'user' })])
    render(<MagicItemsPage />)
    await screen.findByText('My Custom Wand')
    fireEvent.click(screen.getByText('My Custom Wand'))
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByRole('dialog', { name: 'Edit Magic Item' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Edit Magic Item' })).not.toBeInTheDocument()
    })
  })

  it('displays appliesTo in print area for variant cards', async () => {
    mockFetchAllVariants.mockResolvedValue(sampleVariants)
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    fireEvent.click(screen.getByLabelText('Select +X Weapons for printing'))
    fireEvent.click(screen.getByRole('button', { name: '+1 Longsword' }))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('+1 Longsword')).toBeInTheDocument()
  })

  it('displays variant description in print body', async () => {
    mockFetchAllVariants.mockResolvedValue(sampleVariants)
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    fireEvent.click(screen.getByLabelText('Select +X Weapons for printing'))
    fireEvent.click(screen.getByRole('button', { name: '+1 Longsword' }))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('+1 Longsword')).toBeInTheDocument()
    expect(within(printArea).getAllByText(/You have a \+1 bonus/).length).toBeGreaterThanOrEqual(1)
  })

  it('common tab base item print card shows no description for empty description', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await screen.findByText('8 base items')
    fireEvent.click(screen.getByLabelText('Select Dagger for printing'))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('Dagger')).toBeInTheDocument()
  })

  it('shows selected card appliesTo for variant concrete cards', async () => {
    mockFetchAllVariants.mockResolvedValue(sampleVariants)
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    fireEvent.click(screen.getByLabelText('Select +X Weapons for printing'))
    fireEvent.click(screen.getByRole('button', { name: '+1 Longsword' }))
    const selectedList = screen.getByText('Selected for printing').closest('div')!
    expect(within(selectedList).getByText('+1 Longsword')).toBeInTheDocument()
  })

  it('rarity filter shows correct item count', async () => {
    mockFetchItems.mockResolvedValue(extraItems)
    render(<MagicItemsPage />)
    await screen.findByText('Common Amulet')
    fireEvent.change(screen.getByLabelText('Filter by rarity'), { target: { value: 'Legendary' } })
    expect(screen.getByText('1 item')).toBeInTheDocument()
  })

  it('rarity filter with Artifact shows correct item', async () => {
    mockFetchItems.mockResolvedValue(extraItems)
    render(<MagicItemsPage />)
    await screen.findByText('Common Amulet')
    fireEvent.change(screen.getByLabelText('Filter by rarity'), { target: { value: 'Artifact' } })
    expect(screen.getByText('Artifact Crown')).toBeInTheDocument()
    expect(screen.queryByText('Common Amulet')).not.toBeInTheDocument()
  })

  it('rarity filter with Very Rare shows correct item', async () => {
    mockFetchItems.mockResolvedValue(extraItems)
    render(<MagicItemsPage />)
    await screen.findByText('Common Amulet')
    fireEvent.change(screen.getByLabelText('Filter by rarity'), { target: { value: 'Very Rare' } })
    expect(screen.getByText('Very Rare Staff')).toBeInTheDocument()
    expect(screen.queryByText('Common Amulet')).not.toBeInTheDocument()
  })

  it('rarity filter with Varies shows correct item', async () => {
    mockFetchItems.mockResolvedValue(extraItems)
    render(<MagicItemsPage />)
    await screen.findByText('Common Amulet')
    fireEvent.change(screen.getByLabelText('Filter by rarity'), { target: { value: 'Varies' } })
    expect(screen.getByText('Varies Token')).toBeInTheDocument()
    expect(screen.queryByText('Common Amulet')).not.toBeInTheDocument()
  })

  it('rarity filter with Unknown shows correct item', async () => {
    mockFetchItems.mockResolvedValue(extraItems)
    render(<MagicItemsPage />)
    await screen.findByText('Common Amulet')
    fireEvent.change(screen.getByLabelText('Filter by rarity'), { target: { value: 'Unknown' } })
    expect(screen.getByText('Unknown Trinket')).toBeInTheDocument()
    expect(screen.queryByText('Common Amulet')).not.toBeInTheDocument()
  })

  it('rarity filter with Common shows correct item', async () => {
    mockFetchItems.mockResolvedValue(extraItems)
    render(<MagicItemsPage />)
    await screen.findByText('Common Amulet')
    fireEvent.change(screen.getByLabelText('Filter by rarity'), { target: { value: 'Common' } })
    expect(screen.getByText('Common Amulet')).toBeInTheDocument()
    expect(screen.queryByText('Legendary Sword')).not.toBeInTheDocument()
  })

  it('sort by rarity orders items correctly', async () => {
    mockFetchItems.mockResolvedValue(extraItems)
    render(<MagicItemsPage />)
    await screen.findByText('Common Amulet')
    fireEvent.click(screen.getByRole('button', { name: /Rarity/ }))
    const names = screen
      .getAllByText(/^(Common Amulet|Very Rare Staff|Legendary Sword|Artifact Crown|Varies Token|Unknown Trinket)$/)
      .map((el) => el.textContent)
    expect(names).toEqual([
      'Common Amulet',
      'Very Rare Staff',
      'Legendary Sword',
      'Artifact Crown',
      'Varies Token',
      'Unknown Trinket',
    ])
  })

  it('sort by rarity descending reverses order', async () => {
    mockFetchItems.mockResolvedValue(extraItems)
    render(<MagicItemsPage />)
    await screen.findByText('Common Amulet')
    fireEvent.click(screen.getByRole('button', { name: /Rarity/ }))
    fireEvent.click(screen.getByRole('button', { name: /Rarity/ }))
    const names = screen
      .getAllByText(/^(Common Amulet|Very Rare Staff|Legendary Sword|Artifact Crown|Varies Token|Unknown Trinket)$/)
      .map((el) => el.textContent)
    expect(names).toEqual([
      'Unknown Trinket',
      'Varies Token',
      'Artifact Crown',
      'Legendary Sword',
      'Very Rare Staff',
      'Common Amulet',
    ])
  })

  it('sort by rarity handles null rarity items with 99 order', async () => {
    mockFetchItems.mockResolvedValue([
      baseItem({ id: 70, name: 'No Rarity Item', rarity: null }),
      baseItem({ id: 71, name: 'Common Item', rarity: 'Common' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('No Rarity Item')
    fireEvent.click(screen.getByRole('button', { name: /^Rarity/ }))
    const names = screen
      .getAllByText(/^(No Rarity Item|Common Item)$/)
      .map((el) => el.textContent)
    expect(names).toEqual(['Common Item', 'No Rarity Item'])
  })

  it('sort by rarity handles unknown rarity with 98 order', async () => {
    mockFetchItems.mockResolvedValue([
      baseItem({ id: 72, name: 'Weird Item', rarity: 'Weirdness' }),
      baseItem({ id: 73, name: 'Common Item', rarity: 'Common' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Weird Item')
    fireEvent.click(screen.getByRole('button', { name: /Rarity/ }))
    const names = screen
      .getAllByText(/^(Weird Item|Common Item)$/)
      .map((el) => el.textContent)
    expect(names).toEqual(['Common Item', 'Weird Item'])
  })

  it('type sort uses TYPE_LABELS for known types', async () => {
    mockFetchItems.mockResolvedValue([
      baseItem({ id: 80, name: 'Wand Item', type: 'WD' }),
      baseItem({ id: 81, name: 'Ring Item', type: 'RG' }),
      baseItem({ id: 82, name: 'Shield Item', type: 'S' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Wand Item')
    fireEvent.click(screen.getByRole('button', { name: /Type/ }))
    const names = screen
      .getAllByText(/^(Wand Item|Ring Item|Shield Item)$/)
      .map((el) => el.textContent)
    expect(names).toEqual(['Ring Item', 'Shield Item', 'Wand Item'])
  })

  it('type sort falls back to raw type for unknown types', async () => {
    mockFetchItems.mockResolvedValue([
      baseItem({ id: 83, name: 'ZZ Item', type: 'ZZ' }),
      baseItem({ id: 84, name: 'AA Item', type: 'AA' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('ZZ Item')
    fireEvent.click(screen.getByRole('button', { name: /Type/ }))
    const names = screen
      .getAllByText(/^(ZZ Item|AA Item)$/)
      .map((el) => el.textContent)
    expect(names).toEqual(['AA Item', 'ZZ Item'])
  })

  it('type sort handles null type items', async () => {
    mockFetchItems.mockResolvedValue([
      baseItem({ id: 85, name: 'Typed Item', type: 'WD' }),
      baseItem({ id: 86, name: 'Untyped Item', type: null }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Typed Item')
    fireEvent.click(screen.getByRole('button', { name: /^Type/ }))
    const names = screen
      .getAllByText(/^(Typed Item|Untyped Item)$/)
      .map((el) => el.textContent)
    expect(names).toEqual(['Untyped Item', 'Typed Item'])
  })

  it('official source filter shows only non-custom items', async () => {
    mockFetchItems.mockResolvedValue([
      baseItem({ id: 90, name: 'Official A', description: '', custom: false }),
      baseItem({ id: 91, name: 'Official B', description: '', custom: false }),
      baseItem({ id: 92, name: 'Custom C', description: '', custom: true, ownerUsername: 'user' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Official A')
    fireEvent.change(screen.getByLabelText('Filter by source'), { target: { value: 'official' } })
    expect(screen.getByText('Official A')).toBeInTheDocument()
    expect(screen.getByText('Official B')).toBeInTheDocument()
    expect(screen.queryByText('Custom C')).not.toBeInTheDocument()
  })

  it('Common tab base items show "No base item options available" for variant with no matching requires', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 997, name: 'Weird Variant', description: '', variantRequires: '{"unknownKey":true}', detailsJson: null }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Weird Variant')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Select Weird Variant for printing'))
    expect(screen.getByText('No base item options available.')).toBeInTheDocument()
  })

  it('shows concrete card with no description fallback', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({
        id: 998,
        name: 'No Desc Card',
        description: '',
        detailsJson: JSON.stringify({ inherits: { nameSuffix: ' +1', genericBonus: '+1' } }),
        variantRequires: '{"weapon":true}',
      }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('No Desc Card')).toBeInTheDocument()
  })

  it('prints with +X Ammunition variant', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 906, name: 'Arrow of Slaying (Generic)', description: 'Magic arrow.', variantRequires: '{"ammunition":true}' }),
    ])
    mockFetchBaseItems.mockResolvedValue([
      baseItemFixture({ id: 1200, name: 'Arrow', type: 'A', dmg1: null, dmg2: null, dmgType: null, property: null, weaponCategory: null, flags: '' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Ammunition Enchantments')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Select Arrow of Slaying (Generic) for printing'))
    expect(screen.getByRole('button', { name: 'Arrow of Slaying (Generic) (Arrow)' })).toBeInTheDocument()
  })

  it('handles describeRequires with unknown type label', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 999, name: 'Unknown Type Variant', variantRequires: '{"type":"ZZ"}' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Unknown Type Variant')).toBeInTheDocument()
    expect(screen.getByText('Applies to ZZ')).toBeInTheDocument()
  })

  it('prints base item with empty description', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await screen.findByText('8 base items')
    fireEvent.click(screen.getByLabelText('Select Dagger for printing'))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('Dagger')).toBeInTheDocument()
  })

  it('deselects base item print checkbox', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await screen.findByText('8 base items')
    fireEvent.click(screen.getByLabelText('Select Longsword for printing'))
    expect(screen.getByRole('button', { name: /Print selected \(1\)/ })).toBeEnabled()
    fireEvent.click(screen.getByLabelText('Select Longsword for printing'))
    expect(screen.getByRole('button', { name: /Print selected \(0\)/ })).toBeDisabled()
  })

  it('Common tab base items type label falls back for unknown base types', async () => {
    mockFetchBaseItems.mockResolvedValue([
      baseItemFixture({ id: 1300, name: 'Mystery Item', type: 'XX', flags: '' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await waitFor(() => {
      expect(screen.getByText('1 base item')).toBeInTheDocument()
    })
    expect(screen.getAllByText('XX').length).toBeGreaterThanOrEqual(1)
  })

  it('Common tab base items with SCF type uses BASE_TYPE_LABELS', async () => {
    mockFetchBaseItems.mockResolvedValue([
      baseItemFixture({ id: 1400, name: 'Orb of Power', type: 'SCF', flags: '' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await waitFor(() => {
      expect(screen.getByText('1 base item')).toBeInTheDocument()
    })
    expect(screen.getAllByText('Spellcasting Focus (SCF)').length).toBeGreaterThanOrEqual(1)
  })

  it('Common tab base items with AT type uses BASE_TYPE_LABELS', async () => {
    mockFetchBaseItems.mockResolvedValue([
      baseItemFixture({ id: 1401, name: "Thieves' Tools", type: 'AT', flags: '' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await waitFor(() => {
      expect(screen.getByText('1 base item')).toBeInTheDocument()
    })
    expect(screen.getAllByText("Artisan's Tools (AT)").length).toBeGreaterThanOrEqual(1)
  })

  it('Common tab base items with AF type uses BASE_TYPE_LABELS', async () => {
    mockFetchBaseItems.mockResolvedValue([
      baseItemFixture({ id: 1402, name: 'Crossbow Bolts', type: 'AF', flags: '' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await waitFor(() => {
      expect(screen.getByText('1 base item')).toBeInTheDocument()
    })
    expect(screen.getAllByText('Ammunition (AF)').length).toBeGreaterThanOrEqual(1)
  })

  it('Common tab base items with INS type uses BASE_TYPE_LABELS', async () => {
    mockFetchBaseItems.mockResolvedValue([
      baseItemFixture({ id: 1403, name: 'Lute', type: 'INS', flags: '' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await waitFor(() => {
      expect(screen.getByText('1 base item')).toBeInTheDocument()
    })
    expect(screen.getAllByText('Instrument (INS)').length).toBeGreaterThanOrEqual(1)
  })

  it('Common tab filters base items by INS type', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await screen.findByText('8 base items')
    fireEvent.change(screen.getByLabelText('Filter base items by type'), { target: { value: 'M' } })
    expect(screen.getByText('Longsword')).toBeInTheDocument()
    expect(screen.queryByText('Plate Armor')).not.toBeInTheDocument()
  })

  it('Common tab type options include INS from baseTypeOptions', async () => {
    mockFetchBaseItems.mockResolvedValue([
      baseItemFixture({ id: 1500, name: 'Lute', type: 'INS', flags: '' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await waitFor(() => {
      expect(screen.getByText('1 base item')).toBeInTheDocument()
    })
    const typeFilter = screen.getByLabelText('Filter base items by type')
    expect(within(typeFilter).getByText('Instrument (INS)')).toBeInTheDocument()
  })

  it('Common tab type options are sorted alphabetically by label', async () => {
    mockFetchBaseItems.mockResolvedValue([
      baseItemFixture({ id: 1501, name: 'Item1', type: 'LA', flags: '' }),
      baseItemFixture({ id: 1502, name: 'Item2', type: 'HA', flags: '' }),
      baseItemFixture({ id: 1503, name: 'Item3', type: 'MA', flags: '' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await waitFor(() => {
      expect(screen.getByText('3 base items')).toBeInTheDocument()
    })
    const typeFilter = screen.getByLabelText('Filter base items by type')
    const options = Array.from(typeFilter.querySelectorAll('option')).map((o) => o.textContent)
    const nonAllOptions = options.filter((o) => o !== 'All Types')
    const sorted = [...nonAllOptions].sort((a, b) => a!.localeCompare(b!))
    expect(nonAllOptions).toEqual(sorted)
  })

  it('buildConcreteStats shows weaponCategory and property for base items with both', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 965, name: 'Martial Weapon +1', variantRequires: '{"weaponCategory":"martial"}', detailsJson: JSON.stringify({ inherits: { nameSuffix: ' +1', genericBonus: '+1' } }) }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Martial Weapon +1')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Select Martial Weapon +1 for printing'))
    const buttons = screen.getAllByRole('button', { name: /^\+1 \w/ })
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('shows concrete card with fallback name when no detailsJson', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({
        id: 998,
        name: 'Simple Enchant',
        description: 'A simple enchantment.',
        variantRequires: '{"weapon":true}',
        detailsJson: null,
      }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('Weapon Enchantments')
    fireEvent.click(screen.getByLabelText('Select Simple Enchant for printing'))
    expect(screen.getByRole('button', { name: 'Simple Enchant (Longsword)' })).toBeInTheDocument()
  })

  it('handles variant with only dmgType in requires', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 964, name: 'Slashing Weapon', variantRequires: '{"dmgType":"S"}' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Weapon Enchantments')).toBeInTheDocument()
    expect(screen.getByText('Slashing Weapon')).toBeInTheDocument()
  })

  it('handles variant with names array that are all non-armor', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 987, name: 'Multi Weapon', variantRequires: '{"names":["Longsword","Dagger"]}' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Weapon Enchantments')).toBeInTheDocument()
  })

  it('buildConcreteStats shows range and property for base items', async () => {
    mockFetchAllVariants.mockResolvedValue(sampleVariants)
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    fireEvent.click(screen.getByLabelText('Select +X Weapons for printing'))
    fireEvent.click(screen.getByRole('button', { name: '+1 Longsword' }))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('+1 Longsword')).toBeInTheDocument()
    expect(within(printArea).getAllByText(/Versatile/).length).toBeGreaterThanOrEqual(1)
    expect(within(printArea).getAllByText(/Martial/).length).toBeGreaterThanOrEqual(1)
  })

  it('Common tab shows weight for base items', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await screen.findByText('8 base items')
    expect(screen.getAllByText(/3 lb/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/65 lb/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/10 lb/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/6 lb/).length).toBeGreaterThanOrEqual(1)
  })

  it('Common tab shows STR required for Plate Armor', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await screen.findByText('8 base items')
    expect(screen.getAllByText(/STR 15 required/).length).toBeGreaterThanOrEqual(1)
  })

  it('Common tab print card shows stealth disadvantage', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await screen.findByText('8 base items')
    fireEvent.click(screen.getByLabelText('Select Plate Armor for printing'))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('Stealth: Disadvantage')).toBeInTheDocument()
  })

  it('Common tab print card shows weight', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await screen.findByText('8 base items')
    fireEvent.click(screen.getByLabelText('Select Plate Armor for printing'))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getAllByText(/65 lb/).length).toBeGreaterThanOrEqual(1)
  })

  it('Common tab print card shows No Attunement Required', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await screen.findByText('8 base items')
    fireEvent.click(screen.getByLabelText('Select Plate Armor for printing'))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('No Attunement Required')).toBeInTheDocument()
  })

  it('Common tab type badge shows raw type when not in BASE_TYPE_LABELS', async () => {
    mockFetchBaseItems.mockResolvedValue([
      baseItemFixture({ id: 1600, name: 'Custom Item', type: 'CSTM', flags: '' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await waitFor(() => {
      expect(screen.getByText('1 base item')).toBeInTheDocument()
    })
    expect(screen.getAllByText('CSTM').length).toBeGreaterThanOrEqual(1)
  })

  it('Common tab shows multiple types in baseTypeOptions', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await screen.findByText('8 base items')
    const typeFilter = screen.getByLabelText('Filter base items by type')
    const options = within(typeFilter).getAllByRole('option')
    expect(options.length).toBeGreaterThan(4)
  })

  it('prints item with all metadata displayed in selected card', async () => {
    mockFetchItems.mockResolvedValue([
      baseItem({ id: 170, name: 'Full Item', description: 'Full desc.', rarity: 'Rare', type: 'WD', weight: '5 lb.', requiresAttunement: true, attunement: 'YES' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Full Item')
    fireEvent.click(screen.getByLabelText('Select Full Item for printing'))
    const selectedList = screen.getByText('Selected for printing').closest('div')!
    expect(within(selectedList).getByText('Full Item')).toBeInTheDocument()
    expect(within(selectedList).getByText('Rare')).toBeInTheDocument()
    expect(within(selectedList).getByText('Wand (WD)')).toBeInTheDocument()
    expect(within(selectedList).getByText('5 lb.')).toBeInTheDocument()
    expect(within(selectedList).getByText('Requires Attunement')).toBeInTheDocument()
  })

  it('prints item with no type displayed correctly', async () => {
    mockFetchItems.mockResolvedValue([
      baseItem({ id: 171, name: 'Typeless Item', description: 'No type.', type: null, rarity: null }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Typeless Item')
    fireEvent.click(screen.getByLabelText('Select Typeless Item for printing'))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('Typeless Item')).toBeInTheDocument()
    expect(within(printArea).getByText('None')).toBeInTheDocument()
  })

  it('prints item with no weight omits weight from footer', async () => {
    mockFetchItems.mockResolvedValue([
      baseItem({ id: 172, name: 'Weightless', description: 'Light.', weight: null }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Weightless')
    fireEvent.click(screen.getByLabelText('Select Weightless for printing'))
    const printArea = screen.getByTestId('print-area')
    const card = within(printArea).getByText('Weightless').closest('[class]')!
    expect(within(card).queryByText(/lb/)).not.toBeInTheDocument()
  })

  it('Common tab type filter with G type', async () => {
    mockFetchBaseItems.mockResolvedValue([
      baseItemFixture({ id: 1800, name: "Explorer's Pack", type: 'G', flags: '' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await waitFor(() => {
      expect(screen.getByText('1 base item')).toBeInTheDocument()
    })
    const typeFilter = screen.getByLabelText('Filter base items by type')
    expect(within(typeFilter).getByText('Gear (G)')).toBeInTheDocument()
  })

  it('Common tab type filter with A type', async () => {
    mockFetchBaseItems.mockResolvedValue([
      baseItemFixture({ id: 1801, name: 'Crossbow Bolts', type: 'A', flags: '' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await waitFor(() => {
      expect(screen.getByText('1 base item')).toBeInTheDocument()
    })
    const typeFilter = screen.getByLabelText('Filter base items by type')
    expect(within(typeFilter).getByText('Ammunition (A)')).toBeInTheDocument()
  })

  it('Common tab type filter with R type', async () => {
    mockFetchBaseItems.mockResolvedValue([
      baseItemFixture({ id: 1802, name: 'Crossbow', type: 'R', flags: '' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await waitFor(() => {
      expect(screen.getByText('1 base item')).toBeInTheDocument()
    })
    const typeFilter = screen.getByLabelText('Filter base items by type')
    expect(within(typeFilter).getByText('Ranged Weapon (R)')).toBeInTheDocument()
  })

  it('Common tab type filter with P type', async () => {
    mockFetchBaseItems.mockResolvedValue([
      baseItemFixture({ id: 1803, name: 'Healing Potion', type: 'P', flags: '' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await waitFor(() => {
      expect(screen.getByText('1 base item')).toBeInTheDocument()
    })
    const typeFilter = screen.getByLabelText('Filter base items by type')
    expect(within(typeFilter).getByText('Potion (P)')).toBeInTheDocument()
  })

  it('Common tab type filter with SC type', async () => {
    mockFetchBaseItems.mockResolvedValue([
      baseItemFixture({ id: 1804, name: 'Fireball Scroll', type: 'SC', flags: '' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await waitFor(() => {
      expect(screen.getByText('1 base item')).toBeInTheDocument()
    })
    const typeFilter = screen.getByLabelText('Filter base items by type')
    expect(within(typeFilter).getByText('Scroll (SC)')).toBeInTheDocument()
  })

  it('Common tab type filter with RD type', async () => {
    mockFetchBaseItems.mockResolvedValue([
      baseItemFixture({ id: 1805, name: 'Rod of Rulership', type: 'RD', flags: '' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await waitFor(() => {
      expect(screen.getByText('1 base item')).toBeInTheDocument()
    })
    const typeFilter = screen.getByLabelText('Filter base items by type')
    expect(within(typeFilter).getByText('Rod (RD)')).toBeInTheDocument()
  })

  it('prints variant card with multiple stats lines', async () => {
    mockFetchAllVariants.mockResolvedValue(sampleVariants)
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    fireEvent.click(screen.getByLabelText('Select +X Armor for printing'))
    fireEvent.click(screen.getByRole('button', { name: '+1 Plate Armor' }))
    const printArea = screen.getByTestId('print-area')
    const stats = within(printArea).getByText('+1 Plate Armor').closest('[class]')!.parentElement!
    const statsDiv = stats.querySelector('[class]')?.nextElementSibling
    expect(statsDiv).toBeTruthy()
  })

  it('handles variant with polearm require', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 962, name: 'Reach Halberd', variantRequires: '{"polearm":true}' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Weapon Enchantments')).toBeInTheDocument()
    expect(screen.getByText('Reach Halberd')).toBeInTheDocument()
    expect(screen.getByText('Applies to polearms')).toBeInTheDocument()
  })

  it('handles variant with spear require', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 961, name: 'Flaming Spear', variantRequires: '{"spear":true}' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Weapon Enchantments')).toBeInTheDocument()
    expect(screen.getByText('Flaming Spear')).toBeInTheDocument()
    expect(screen.getByText('Applies to spears')).toBeInTheDocument()
  })

  it('handles variant with crossbow require', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 960, name: 'Explosive Crossbow', variantRequires: '{"crossbow":true}' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Weapon Enchantments')).toBeInTheDocument()
    expect(screen.getByText('Explosive Crossbow')).toBeInTheDocument()
    expect(screen.getByText('Applies to crossbows')).toBeInTheDocument()
  })

  it('handles variant with bow require', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 959, name: 'Lightning Bow', variantRequires: '{"bow":true}' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Weapon Enchantments')).toBeInTheDocument()
    expect(screen.getByText('Lightning Bow')).toBeInTheDocument()
    expect(screen.getByText('Applies to bows')).toBeInTheDocument()
  })

  it('handles variant with axe require', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 963, name: 'Throwing Axe', variantRequires: '{"axe":true}' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Weapon Enchantments')).toBeInTheDocument()
    expect(screen.getByText('Throwing Axe')).toBeInTheDocument()
    expect(screen.getByText('Applies to axes')).toBeInTheDocument()
  })

  it('handles variant with name require', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 964, name: 'Longsword of Sharpness', variantRequires: '{"name":"Longsword","dmgType":"S"}' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Longsword of Sharpness')).toBeInTheDocument()
    expect(screen.getByText('Applies to Longsword, slashing damage')).toBeInTheDocument()
  })

  it('handles variant with names and weaponCategory require', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 965, name: 'Martial Weapon +1', variantRequires: '{"weaponCategory":"martial"}', detailsJson: JSON.stringify({ inherits: { nameSuffix: ' +1', genericBonus: '+1' } }) }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Martial Weapon +1')).toBeInTheDocument()
    expect(screen.getByText('Applies to martial weapons')).toBeInTheDocument()
  })

  it('handles variant with SCF type require', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 973, name: 'Scroll of Healing', variantRequires: '{"type":"SCF"}' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Other Variants')).toBeInTheDocument()
    expect(screen.getByText('Scroll of Healing')).toBeInTheDocument()
    expect(screen.getByText('Applies to SCF')).toBeInTheDocument()
  })

  it('handles variant with RG type require', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 974, name: 'Ring of Mind Shielding', variantRequires: '{"type":"RG"}' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Other Variants')).toBeInTheDocument()
    expect(screen.getByText('Ring of Mind Shielding')).toBeInTheDocument()
    expect(screen.getByText('Applies to Ring (RG)')).toBeInTheDocument()
  })

  it('handles variant with G type require', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 975, name: 'Gloves of Thievery', variantRequires: '{"type":"G"}' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Other Variants')).toBeInTheDocument()
    expect(screen.getByText('Gloves of Thievery')).toBeInTheDocument()
    expect(screen.getByText('Applies to Gear (G)')).toBeInTheDocument()
  })

  it('handles variant with A type require', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 976, name: 'Arrows of Pain', variantRequires: '{"ammunition":true}' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Ammunition Enchantments')).toBeInTheDocument()
    expect(screen.getByText('Arrows of Pain')).toBeInTheDocument()
    expect(screen.getByText('Applies to ammunition')).toBeInTheDocument()
  })

  it('handles variant with INS type require', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 971, name: 'Bardic Instrument', variantRequires: '{"type":"INS"}' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Other Variants')).toBeInTheDocument()
    expect(screen.getByText('Bardic Instrument')).toBeInTheDocument()
    expect(screen.getByText('Applies to Instrument (INS)')).toBeInTheDocument()
  })

  it('builds variant cards from multiple selected variant groups', async () => {
    mockFetchAllVariants.mockResolvedValue(sampleVariants)
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    fireEvent.click(screen.getByLabelText('Select +X Weapons for printing'))
    fireEvent.click(screen.getByRole('button', { name: '+1 Longsword' }))
    fireEvent.click(screen.getByLabelText('Select +X Armor for printing'))
    fireEvent.click(screen.getByRole('button', { name: '+1 Plate Armor' }))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('+1 Longsword')).toBeInTheDocument()
    expect(within(printArea).getByText('+1 Plate Armor')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Print selected \(2\)/ })).toBeEnabled()
  })

  it('removes one of multiple selected items', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByLabelText('Select Alchemy Jug for printing'))
    fireEvent.click(screen.getByLabelText('Select Amulet of Health for printing'))
    expect(screen.getByRole('button', { name: /Print selected \(2\)/ })).toBeEnabled()
    fireEvent.click(screen.getByLabelText('Remove Alchemy Jug from printing'))
    expect(screen.getByRole('button', { name: /Print selected \(1\)/ })).toBeEnabled()
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).queryByText('Alchemy Jug')).not.toBeInTheDocument()
    expect(within(printArea).getByText('Amulet of Health')).toBeInTheDocument()
  })

  it('shows detail modal with source and page', async () => {
    mockFetchItems.mockResolvedValue([
      baseItem({ id: 200, name: 'Detailed Item', description: 'Desc.', source: 'XGtE', page: 42 }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Detailed Item')
    fireEvent.click(screen.getByText('Detailed Item'))
    expect(screen.getByText('Source: XGtE, p. 42')).toBeInTheDocument()
  })

  it('shows detail modal with source but no page', async () => {
    mockFetchItems.mockResolvedValue([
      baseItem({ id: 201, name: 'No Page Item', description: 'Desc.', source: 'DMG', page: null }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('No Page Item')
    fireEvent.click(screen.getByText('No Page Item'))
    expect(screen.getByText('Source: DMG')).toBeInTheDocument()
  })

  it('prints item and deselects on second click', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByLabelText('Select Alchemy Jug for printing'))
    expect(screen.getByRole('button', { name: /Print selected \(1\)/ })).toBeEnabled()
    fireEvent.click(screen.getByLabelText('Select Alchemy Jug for printing'))
    expect(screen.getByRole('button', { name: /Print selected \(0\)/ })).toBeDisabled()
  })

  it('shows weight in print card for base items with weight', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await screen.findByText('8 base items')
    fireEvent.click(screen.getByLabelText('Select Plate Armor for printing'))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getAllByText(/65 lb/).length).toBeGreaterThanOrEqual(1)
  })

  it('Common tab items show no stats for base item with no properties', async () => {
    mockFetchBaseItems.mockResolvedValue([
      baseItemFixture({ id: 2000, name: 'Blank Item', type: 'G', dmg1: null, dmg2: null, dmgType: null, ac: null, stealth: null, strength: null, range: null, property: null, weaponCategory: null, weight: null, flags: '' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await waitFor(() => {
      expect(screen.getByText('1 base item')).toBeInTheDocument()
    })
    expect(screen.getByText('Blank Item')).toBeInTheDocument()
    const statsEl = screen.getByText('Blank Item').closest('[class]')!.querySelector('[class]')
    if (statsEl) expect(statsEl.textContent).toBe('')
  })

  it('variant with MA type require shows in Armor Enchantments', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 967, name: 'Armor of Blinding', variantRequires: '{"type":"MA"}' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Armor Enchantments')).toBeInTheDocument()
    expect(screen.getByText('Armor of Blinding')).toBeInTheDocument()
    expect(screen.getByText('Applies to Medium Armor (MA)')).toBeInTheDocument()
  })

  it('variant with LA type require shows in Armor Enchantments', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 968, name: 'Leather Armor +1', variantRequires: '{"type":"LA"}' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Armor Enchantments')).toBeInTheDocument()
    expect(screen.getByText('Leather Armor +1')).toBeInTheDocument()
    expect(screen.getByText('Applies to Light Armor (LA)')).toBeInTheDocument()
  })

  it('variant with S type require shows in Weapon Enchantments', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 972, name: 'Shield of the Paladin', variantRequires: '{"type":"S","weaponCategory":"martial"}', detailsJson: JSON.stringify({ inherits: { entries: ['A sacred shield.'] } }) }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Weapon Enchantments')).toBeInTheDocument()
    expect(screen.getByText('Shield of the Paladin')).toBeInTheDocument()
    expect(screen.getByText('Applies to Shield (S), martial weapons')).toBeInTheDocument()
  })

  it('shows "1 variant entry" singular for single variant group', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 954, name: 'Potion of Healing', description: 'A potion that restores health.', variantRequires: null }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await waitFor(() => {
      expect(screen.getByText('1 variant entry')).toBeInTheDocument()
    })
  })

  it('Common tab shows "1 base item" singular', async () => {
    mockFetchBaseItems.mockResolvedValue([
      baseItemFixture({ id: 2100, name: 'Single Item', type: 'G', flags: '' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await waitFor(() => {
      expect(screen.getByText('1 base item')).toBeInTheDocument()
    })
  })

  it('shows "1 item" singular when filter leaves one item', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.change(screen.getByLabelText('Filter by rarity'), { target: { value: 'Rare' } })
    expect(screen.getByText('2 items')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Filter by type'), { target: { value: 'M' } })
    expect(screen.getByText('1 item')).toBeInTheDocument()
  })

  it('displays print card with all badges for variant concrete card', async () => {
    mockFetchAllVariants.mockResolvedValue(sampleVariants)
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    fireEvent.click(screen.getByLabelText('Select +X Weapons for printing'))
    fireEvent.click(screen.getByRole('button', { name: '+1 Longsword' }))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('+1 Longsword')).toBeInTheDocument()
    expect(within(printArea).getByText('Unknown')).toBeInTheDocument()
  })

  it('shows No description available when variant has no description and no entries', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 996, name: 'Empty Desc Variant', description: '', detailsJson: null, variantRequires: null }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Empty Desc Variant')).toBeInTheDocument()
  })

  it('Common tab shows "No base items match your filters." when search and type filter yield nothing', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await screen.findByText('8 base items')
    fireEvent.change(screen.getByLabelText('Filter base items by type'), { target: { value: 'HA' } })
    fireEvent.change(screen.getByPlaceholderText('Search base items...'), { target: { value: 'zzzzz' } })
    expect(screen.getByText('No base items match your filters.')).toBeInTheDocument()
  })

  it('Common tab shows variant group base item buttons for weapon variant', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 950, name: 'Weapon +1', detailsJson: JSON.stringify({ inherits: { nameSuffix: ' +1', genericBonus: '+1' } }) }),
      variantItem({ id: 951, name: 'Weapon +1', detailsJson: JSON.stringify({ inherits: { nameSuffix: ' +2', genericBonus: '+2' } }) }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    await screen.findByText('+X Weapons')
    fireEvent.click(screen.getByLabelText('Select +X Weapons for printing'))
    expect(screen.getByRole('button', { name: '+1 Longsword' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+1 Dagger' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+1 Scimitar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+1 Shortsword' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+1 Greatsword' })).toBeInTheDocument()
  })

  it('handles variant with artifact rarity', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 953, name: 'Artifact Armor', description: '', variantRequires: '{"armor":true}', detailsJson: JSON.stringify({ inherits: { rarity: 'Artifact', resist: 'fire' } }) }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Artifact Armor')).toBeInTheDocument()
    expect(screen.getByText('Artifact')).toBeInTheDocument()
  })

  it('handles variant with legendary rarity', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 953, name: 'Legendary Armor', description: '', variantRequires: '{"armor":true}', detailsJson: JSON.stringify({ inherits: { rarity: 'Legendary' } }) }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Legendary Armor')).toBeInTheDocument()
    expect(screen.getByText('Legendary')).toBeInTheDocument()
  })

  it('prints item with custom rarity in badge', async () => {
    mockFetchItems.mockResolvedValue([
      baseItem({ id: 300, name: 'Varies Item', description: 'Varies.', rarity: 'Varies' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Varies Item')
    fireEvent.click(screen.getByLabelText('Select Varies Item for printing'))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('Varies')).toBeInTheDocument()
  })

  it('prints item with Unknown rarity in badge', async () => {
    mockFetchItems.mockResolvedValue([
      baseItem({ id: 301, name: 'Unknown Item', description: 'Unknown.', rarity: 'Unknown' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Unknown Item')
    fireEvent.click(screen.getByLabelText('Select Unknown Item for printing'))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('Unknown')).toBeInTheDocument()
  })

  it('Common tab print cards show base item type badge', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await screen.findByText('8 base items')
    fireEvent.click(screen.getByLabelText('Select Plate Armor for printing'))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('Heavy Armor (HA)')).toBeInTheDocument()
  })

  it('Common tab print cards show weapon type badge', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await screen.findByText('8 base items')
    fireEvent.click(screen.getByLabelText('Select Longsword for printing'))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('Melee Weapon (M)')).toBeInTheDocument()
  })

  it('Common tab print cards show shield type badge', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    await screen.findByText('8 base items')
    fireEvent.click(screen.getByLabelText('Select Shield for printing'))
    const printArea = screen.getByTestId('print-area')
    expect(within(printArea).getByText('Shield (S)')).toBeInTheDocument()
  })

  it('shows all three tabs work', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(screen.getByRole('button', { name: 'Variants' }).className).toContain('Active')
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    expect(screen.getByRole('button', { name: 'Common' }).className).toContain('Active')
    fireEvent.click(screen.getByRole('button', { name: 'Items' }))
    expect(screen.getByRole('button', { name: 'Items' }).className).toContain('Active')
  })

  it('hint text changes with tabs', async () => {
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    expect(screen.getByText('Click a row to see item details.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(screen.getByText('Select a variant, then click a base item to build and print its card.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Common' }))
    expect(screen.getByText('Select base items to build and print their cards.')).toBeInTheDocument()
  })

  it('dismisses toast on click', async () => {
    mockFetchItems.mockRejectedValue(new Error('network'))
    render(<MagicItemsPage />)
    await waitFor(() => {
      expect(screen.getByText('Failed to load magic items')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('×'))
    await waitFor(() => {
      expect(screen.queryByText('Failed to load magic items')).not.toBeInTheDocument()
    })
  })

  it('shows "No base item options available." when variant has no matching base items', async () => {
    mockFetchAllVariants.mockResolvedValue([
      variantItem({ id: 997, name: 'Unknown Require Variant', variantRequires: '{"unknownKey":true}' }),
    ])
    render(<MagicItemsPage />)
    await screen.findByText('Alchemy Jug')
    fireEvent.click(screen.getByRole('button', { name: 'Variants' }))
    expect(await screen.findByText('Unknown Require Variant')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Select Unknown Require Variant for printing'))
    expect(screen.getByText('No base item options available.')).toBeInTheDocument()
  })
})
