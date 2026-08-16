import { useEffect, useMemo, useState } from 'react'
import {
  fetchMagicItems,
  fetchAllMagicItemVariants,
  createMagicItem,
  updateMagicItem,
  deleteMagicItem,
  type MagicItemInput,
} from '../api/magicItems'
import type { MagicItem } from '../api/types'
import { LoadingSpinner } from '../components/shared/LoadingSpinner'
import { Toast } from '../components/shared/Toast'
import { Modal } from '../components/shared/Modal'
import styles from './MagicItemsPage.module.css'

type ToastState = { message: string; type: 'success' | 'error' } | null
type SortBy = 'name' | 'rarity' | 'type'
type SortDir = 'asc' | 'desc'
type SourceFilter = 'all' | 'official' | 'custom'
type PageTab = 'items' | 'variants'

interface PrintSelection {
  key: string
  name: string
  description: string
  rarity: string | null
  type: string | null
  weight: string | null
  requiresAttunement: boolean | null
  attunement: string | null
  appliesTo?: string
}

interface VariantPrintEntry {
  key: string
  name: string
  description: string
  rarity: string
  appliesTo: string
}

interface VariantGroup {
  key: string
  label: string
  members: MagicItem[]
  entry: VariantPrintEntry
}

interface VariantSection {
  title: string
  groups: VariantGroup[]
}

interface VariantDetails {
  inherits?: Record<string, unknown>
}

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact', 'Varies', 'Unknown']

const RARITY_ORDER: Record<string, number> = {
  Common: 0,
  Uncommon: 1,
  Rare: 2,
  'Very Rare': 3,
  Legendary: 4,
  Artifact: 5,
  Varies: 6,
  Unknown: 7,
}

const TYPE_OPTIONS = [
  { value: 'M', label: 'Melee Weapon (M)' },
  { value: 'R', label: 'Ranged Weapon (R)' },
  { value: 'P', label: 'Potion (P)' },
  { value: 'RG', label: 'Ring (RG)' },
  { value: 'WD', label: 'Wand (WD)' },
  { value: 'S', label: 'Shield (S)' },
  { value: 'SC', label: 'Scroll (SC)' },
  { value: 'RD', label: 'Rod (RD)' },
  { value: 'HA', label: 'Heavy Armor (HA)' },
  { value: 'MA', label: 'Medium Armor (MA)' },
  { value: 'LA', label: 'Light Armor (LA)' },
  { value: 'A', label: 'Ammunition (A)' },
  { value: 'G', label: 'Gear (G)' },
  { value: 'INS', label: 'Instrument (INS)' },
]

const TYPE_LABELS: Record<string, string> = Object.fromEntries(
  TYPE_OPTIONS.map((t) => [t.value, t.label]),
)

const DMG_TYPE_LABELS: Record<string, string> = {
  S: 'slashing',
  P: 'piercing',
  B: 'bludgeoning',
}

const PLUS_FAMILIES = [
  { re: /^Weapon \(no damage\) \+/, key: 'weapon-nodamage-plus', label: '+X Weapons (no damage)' },
  { re: /^Weapon \+/, key: 'weapon-plus', label: '+X Weapons' },
  { re: /^Armor \+/, key: 'armor-plus', label: '+X Armor' },
  { re: /^Shield \+/, key: 'shield-plus', label: '+X Shields' },
  { re: /^Ammunition \+/, key: 'ammunition-plus', label: '+X Ammunition' },
]

const PLUS_FAMILY_KEYS = new Set(PLUS_FAMILIES.map((f) => f.key))

type SectionKey = 'plus' | 'weapon' | 'armor' | 'ammunition' | 'other'

const SECTION_TITLES: Record<SectionKey, string> = {
  plus: '+X Enhancements',
  weapon: 'Weapon Enchantments',
  armor: 'Armor Enchantments',
  ammunition: 'Ammunition Enchantments',
  other: 'Other Variants',
}

const BASE_WEAPONS = [
  'Club', 'Dagger', 'Greatclub', 'Handaxe', 'Javelin', 'Light Hammer', 'Mace',
  'Quarterstaff', 'Sickle', 'Spear', 'Light Crossbow', 'Dart', 'Shortbow', 'Sling',
  'Battleaxe', 'Flail', 'Glaive', 'Greataxe', 'Greatsword', 'Halberd', 'Lance',
  'Longsword', 'Maul', 'Morningstar', 'Pike', 'Rapier', 'Scimitar', 'Shortsword',
  'Trident', 'War Pick', 'Warhammer', 'Whip', 'Blowgun', 'Hand Crossbow',
  'Heavy Crossbow', 'Longbow', 'Net',
]

const BASE_SWORDS = ['Greatsword', 'Longsword', 'Rapier', 'Scimitar', 'Shortsword']
const BASE_SLASHING_SWORDS = ['Greatsword', 'Longsword', 'Scimitar']
const BASE_AXES = ['Handaxe', 'Battleaxe', 'Greataxe']
const BASE_LIGHT_ARMOR = ['Padded', 'Leather', 'Studded Leather']
const BASE_MEDIUM_ARMOR = ['Hide', 'Chain Shirt', 'Scale Mail', 'Breastplate', 'Half Plate']
const BASE_HEAVY_ARMOR = ['Ring Mail', 'Chain Mail', 'Splint', 'Plate']
const BASE_ARMOR = [...BASE_LIGHT_ARMOR, ...BASE_MEDIUM_ARMOR, ...BASE_HEAVY_ARMOR]
const BASE_SHIELDS = ['Shield']
const BASE_AMMUNITION = ['Arrow', 'Crossbow Bolt', 'Blowgun Needle', 'Sling Bullet']
const BASE_NETS = ['Net']

function rarityClass(rarity: string | null): string {
  switch (rarity) {
    case 'Common': return styles.rarityCommon
    case 'Uncommon': return styles.rarityUncommon
    case 'Rare': return styles.rarityRare
    case 'Very Rare': return styles.rarityVeryRare
    case 'Legendary': return styles.rarityLegendary
    case 'Artifact': return styles.rarityArtifact
    case 'Varies': return styles.rarityVaries
    case 'Unknown': return styles.rarityUnknown
    default: return styles.rarityNone
  }
}

function attunementLabel(item: { requiresAttunement: boolean | null; attunement: string | null }): string {
  if (item.attunement === 'OPTIONAL') return 'Attunement Optional'
  if (item.attunement && item.attunement !== 'YES') return `Requires Attunement: ${item.attunement}`
  if (item.requiresAttunement) return 'Requires Attunement'
  return 'No Attunement Required'
}

function parseRequires(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null
  try {
    const obj = JSON.parse(raw)
    return obj && typeof obj === 'object' ? obj : null
  } catch {
    return null
  }
}

function describeRequires(raw: string | null): string {
  const obj = parseRequires(raw)
  if (!obj) return ''
  const parts: string[] = []
  if (obj.armor) parts.push('armor')
  if (obj.type) parts.push(TYPE_LABELS[obj.type as string] ?? (obj.type as string))
  if (obj.weapon) parts.push('weapons')
  if (obj.sword) parts.push('swords')
  if (obj.axe) parts.push('axes')
  if (obj.ammunition) parts.push('ammunition')
  if (obj.name) parts.push(obj.name as string)
  if (obj.dmgType) parts.push(`${DMG_TYPE_LABELS[obj.dmgType as string] ?? (obj.dmgType as string)} damage`)
  if (parts.length === 0) return ''
  return `Applies to ${parts.join(', ')}`
}

function parseVariantDetails(item: MagicItem): VariantDetails | null {
  if (!item.detailsJson) return null
  try {
    const obj = JSON.parse(item.detailsJson)
    return obj && typeof obj === 'object' ? obj : null
  } catch {
    return null
  }
}

function cleanMarkup(text: string): string {
  return text
    .replace(/\{@[a-zA-Z]+(?:\s+([^}]*))?\}/g, (_, arg) => (arg ?? '').trim())
    .replace(/ {2,}/g, ' ')
    .trim()
}

function cleanText(text: string): string {
  return text
    .replace(/(?:\btalic\b|(?<=\d)talic|\btem\b)/g, '')
    .replace(/ {2,}/g, ' ')
    .trim()
}

function flattenEntries(entries: unknown[]): string[] {
  const out: string[] = []
  for (const entry of entries) {
    if (typeof entry === 'string') {
      const cleaned = cleanMarkup(entry)
      if (cleaned && !cleaned.startsWith('Note:')) out.push(cleaned)
    } else if (entry && typeof entry === 'object' && Array.isArray((entry as { entries?: unknown[] }).entries)) {
      out.push(...flattenEntries((entry as { entries: unknown[] }).entries))
    }
  }
  return out
}

function variantRarity(item: MagicItem): string {
  const inherited = parseVariantDetails(item)?.inherits?.rarity
  if (typeof inherited === 'string' && inherited) return inherited
  return item.rarity ?? 'Unknown'
}

function variantDescription(item: MagicItem): string {
  if (item.description) return cleanText(item.description)
  const details = parseVariantDetails(item)
  const entries = details?.inherits?.entries
  if (Array.isArray(entries)) {
    const flattened = flattenEntries(entries)
    if (flattened.length > 0) return flattened.join('\n\n')
  }
  const resist = details?.inherits?.resist
  if (typeof resist === 'string' && resist) {
    return `You have resistance to ${resist} damage while you wear this armor.`
  }
  return ''
}

function baseItemsForMember(member: MagicItem): string[] {
  const requires = parseRequires(member.variantRequires)
  if (!requires) return []
  if (requires.type === 'S') return BASE_SHIELDS
  if (requires.type === 'HA') return BASE_HEAVY_ARMOR
  if (requires.type === 'MA') return BASE_MEDIUM_ARMOR
  if (requires.name) {
    const name = String(requires.name)
    const match = BASE_NETS.find((n) => n.toLowerCase() === name.toLowerCase())
    return match ? [match] : [name]
  }
  if (requires.armor) return BASE_ARMOR
  if (requires.axe) return BASE_AXES
  if (requires.sword && requires.dmgType === 'S') return BASE_SLASHING_SWORDS
  if (requires.sword) return BASE_SWORDS
  if (requires.weapon) return BASE_WEAPONS
  if (requires.ammunition) return BASE_AMMUNITION
  return []
}

function applicableBaseItemsForGroup(group: VariantGroup): string[] {
  const seen = new Set<string>()
  for (const member of group.members) {
    for (const name of baseItemsForMember(member)) seen.add(name)
  }
  return [...seen]
}

function concreteCardName(member: MagicItem, baseName: string): string {
  const details = parseVariantDetails(member)
  const prefix = details?.inherits?.namePrefix
  const suffix = details?.inherits?.nameSuffix
  if (typeof prefix === 'string' && prefix) return `${prefix}${baseName}`
  if (typeof suffix === 'string' && suffix) {
    const bonus = suffix.match(/^\s*([+-]\d+)\s*$/)
    if (bonus) return `${bonus[1]} ${baseName}`
    return `${baseName}${suffix}`
  }
  return `${member.name} (${baseName})`
}

function variantBonusLabel(member: MagicItem): string {
  const details = parseVariantDetails(member)
  const suffix = details?.inherits?.nameSuffix
  if (typeof suffix === 'string' && suffix) {
    const bonus = suffix.match(/^\s*([+-]\d+)\s*$/)
    return bonus ? bonus[1] : suffix.trim()
  }
  const prefix = details?.inherits?.namePrefix
  if (typeof prefix === 'string' && prefix) return prefix.trim()
  return member.name
}

function classifyVariant(item: MagicItem): SectionKey {
  const requires = parseRequires(item.variantRequires)
  if (requires) {
    if (requires.armor || requires.type === 'HA' || requires.type === 'MA' || requires.type === 'LA') return 'armor'
    if (requires.ammunition) return 'ammunition'
    if (requires.weapon || requires.sword || requires.axe || requires.name || requires.dmgType) return 'weapon'
  }
  const name = item.name.toLowerCase()
  if (name.includes('armor')) return 'armor'
  if (name.includes('ammunition')) return 'ammunition'
  if (name.includes('sword') || name.includes('axe') || name.includes('weapon')) return 'weapon'
  return 'other'
}

function buildSingleEntry(item: MagicItem): VariantPrintEntry {
  return {
    key: `variant-${item.id}`,
    name: item.name,
    description: variantDescription(item) || 'No description available.',
    rarity: variantRarity(item),
    appliesTo: describeRequires(item.variantRequires),
  }
}

function buildMergedEntry(groupKey: string, label: string, members: MagicItem[]): VariantPrintEntry {
  const rarities = [...new Set(members.map(variantRarity).filter((r) => r && r !== 'Unknown'))]
  const description = members.map(variantDescription).filter(Boolean).join('\n\n') || 'No description available.'
  const applies = [...new Set(members.map((v) => describeRequires(v.variantRequires)).filter(Boolean))]
  return {
    key: `variant-group-${groupKey}`,
    name: label,
    description,
    rarity: rarities.length > 1 ? rarities.join(' · ') : (rarities[0] ?? 'Unknown'),
    appliesTo: applies.join('; '),
  }
}

function buildVariantSections(variants: MagicItem[]): VariantSection[] {
  const collected = new Map<SectionKey, Map<string, VariantGroup>>()
  const sectionFor = (key: SectionKey): Map<string, VariantGroup> => {
    let groups = collected.get(key)
    if (!groups) {
      groups = new Map()
      collected.set(key, groups)
    }
    return groups
  }

  for (const variant of variants) {
    const family = PLUS_FAMILIES.find((f) => f.re.test(variant.name))
    if (family) {
      const groups = sectionFor('plus')
      const existing = groups.get(family.key)
      if (existing) {
        existing.members.push(variant)
      } else {
        groups.set(family.key, { key: family.key, label: family.label, members: [variant], entry: buildSingleEntry(variant) })
      }
    } else {
      const key = `single-${variant.id}`
      const groups = sectionFor(classifyVariant(variant))
      groups.set(key, { key, label: variant.name, members: [variant], entry: buildSingleEntry(variant) })
    }
  }

  return (Object.keys(SECTION_TITLES) as SectionKey[])
    .map((key) => {
      const groups = collected.get(key)
      if (!groups) return null
      return {
        title: SECTION_TITLES[key],
        groups: [...groups.values()]
          .map((group) => {
            const members = [...group.members].sort((a, b) => a.name.localeCompare(b.name))
            const entry = PLUS_FAMILY_KEYS.has(group.key)
              ? buildMergedEntry(group.key, group.label, members)
              : group.entry
            return { key: group.key, label: group.label, members, entry }
          })
          .sort((a, b) => a.label.localeCompare(b.label)),
      }
    })
    .filter((section): section is VariantSection => section !== null)
}

function printCardFromItem(item: MagicItem): PrintSelection {
  return {
    key: `item-${item.id}`,
    name: item.name,
    description: cleanText(item.description),
    rarity: item.rarity,
    type: item.type,
    weight: item.weight,
    requiresAttunement: item.requiresAttunement,
    attunement: item.attunement,
  }
}

export default function MagicItemsPage() {
  const [items, setItems] = useState<MagicItem[]>([])
  const [variants, setVariants] = useState<MagicItem[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState>(null)

  const [activeTab, setActiveTab] = useState<PageTab>('items')
  const [search, setSearch] = useState('')
  const [variantSearch, setVariantSearch] = useState('')
  const [rarityFilter, setRarityFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const [printSelection, setPrintSelection] = useState<PrintSelection[]>([])
  const [selectedVariantKeys, setSelectedVariantKeys] = useState<Record<string, boolean>>({})
  const [variantBonusChoice, setVariantBonusChoice] = useState<Record<string, number>>({})
  const [detailItem, setDetailItem] = useState<MagicItem | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MagicItem | null>(null)

  async function load() {
    const [itemsResult, variantsResult] = await Promise.allSettled([
      fetchMagicItems(),
      fetchAllMagicItemVariants(),
    ])
    if (itemsResult.status === 'fulfilled') {
      setItems(itemsResult.value)
    } else {
      setToast({ message: 'Failed to load magic items', type: 'error' })
    }
    if (variantsResult.status === 'fulfilled') {
      setVariants(variantsResult.value)
    } else {
      setToast({ message: 'Failed to load variant templates', type: 'error' })
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      await load()
      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = items
    if (q) {
      list = list.filter(
        (i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q),
      )
    }
    if (rarityFilter) list = list.filter((i) => i.rarity === rarityFilter)
    if (typeFilter) list = list.filter((i) => i.type === typeFilter)
    if (sourceFilter === 'official') list = list.filter((i) => !i.custom)
    if (sourceFilter === 'custom') list = list.filter((i) => i.custom)

    const dir = sortDir === 'asc' ? 1 : -1
    return [...list].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name) * dir
      if (sortBy === 'rarity') {
        const ra = a.rarity == null ? 99 : (RARITY_ORDER[a.rarity] ?? 98)
        const rb = b.rarity == null ? 99 : (RARITY_ORDER[b.rarity] ?? 98)
        return (ra - rb) * dir || a.name.localeCompare(b.name)
      }
      const ta = TYPE_LABELS[a.type ?? ''] ?? a.type ?? ''
      const tb = TYPE_LABELS[b.type ?? ''] ?? b.type ?? ''
      return ta.localeCompare(tb) * dir || a.name.localeCompare(b.name)
    })
  }, [items, search, rarityFilter, typeFilter, sourceFilter, sortBy, sortDir])

  const sections = useMemo(() => buildVariantSections(variants), [variants])

  const selectedVariantGroups = useMemo(
    () => sections.flatMap((section) => section.groups).filter((group) => !!selectedVariantKeys[group.entry.key]),
    [sections, selectedVariantKeys],
  )

  const visibleSections = useMemo(() => {
    const q = variantSearch.trim().toLowerCase()
    if (!q) return sections
    return sections
      .map((section) => ({
        ...section,
        groups: section.groups.filter((group) =>
          group.label.toLowerCase().includes(q) ||
          group.members.some((m) =>
            m.name.toLowerCase().includes(q) ||
            variantDescription(m).toLowerCase().includes(q) ||
            describeRequires(m.variantRequires).toLowerCase().includes(q),
          ),
        ),
      }))
      .filter((section) => section.groups.length > 0)
  }, [sections, variantSearch])

  const visibleGroupCount = visibleSections.reduce((n, s) => n + s.groups.length, 0)

  function handleSort(col: SortBy) {
    if (col === sortBy) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(col)
      setSortDir('asc')
    }
  }

  function isPrintSelected(item: MagicItem): boolean {
    return printSelection.some((p) => p.key === `item-${item.id}`)
  }

  function togglePrint(item: MagicItem) {
    const key = `item-${item.id}`
    setPrintSelection((prev) =>
      prev.some((p) => p.key === key)
        ? prev.filter((p) => p.key !== key)
        : [...prev, printCardFromItem(item)],
    )
  }

  function isVariantSelected(group: VariantGroup): boolean {
    return !!selectedVariantKeys[group.entry.key]
  }

  function toggleVariantGroup(group: VariantGroup) {
    const key = group.entry.key
    const wasSelected = selectedVariantKeys[key]
    setSelectedVariantKeys((prev) => {
      const next = { ...prev }
      if (next[key]) {
        delete next[key]
      } else {
        next[key] = true
      }
      return next
    })
    if (wasSelected) {
      setPrintSelection((prev) => prev.filter((p) => !p.key.startsWith(`concrete-${group.key}-`)))
    }
  }

  function addConcreteCard(group: VariantGroup, member: MagicItem, baseName: string) {
    const name = concreteCardName(member, baseName)
    const key = `concrete-${group.key}-${member.id}-${baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    setPrintSelection((prev) =>
      prev.some((p) => p.key === key)
        ? prev
        : [
            ...prev,
            {
              key,
              name,
              description: variantDescription(member) || 'No description available.',
              rarity: variantRarity(member),
              type: null,
              weight: null,
              requiresAttunement: null,
              attunement: null,
            },
          ],
    )
  }

  function handlePrint() {
    if (printSelection.length === 0) return
    window.print()
  }

  function openDetail(item: MagicItem) {
    setDetailItem(item)
  }

  function closeDetail() {
    setDetailItem(null)
  }

  function openCreateForm() {
    setEditingItem(null)
    setFormOpen(true)
  }

  function openEditForm(item: MagicItem) {
    setEditingItem(item)
    setFormOpen(true)
    setDetailItem(null)
  }

  async function handleDelete(id: number) {
    if (!globalThis.confirm('Delete this magic item?')) return
    try {
      await deleteMagicItem(id)
      setToast({ message: 'Magic item deleted', type: 'success' })
      setDetailItem(null)
      setPrintSelection((prev) => prev.filter((p) => p.key !== `item-${id}`))
      await load()
    } catch {
      setToast({ message: 'Failed to delete magic item', type: 'error' })
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.heading}>Magic Items</h1>
        <div className={styles.tabBar}>
          <button
            className={`${styles.tab} ${activeTab === 'items' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('items')}
          >
            Items
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'variants' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('variants')}
          >
            Variants
          </button>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.leftPanel}>
          {activeTab === 'items' ? (
            <>
              <div className={styles.filters}>
                <input
                  className={styles.search}
                  type="search"
                  placeholder="Search by name or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search magic items"
                />
                <select
                  value={rarityFilter}
                  onChange={(e) => setRarityFilter(e.target.value)}
                  aria-label="Filter by rarity"
                >
                  <option value="">All Rarities</option>
                  {RARITIES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  aria-label="Filter by type"
                >
                  <option value="">All Types</option>
                  {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
                  aria-label="Filter by source"
                >
                  <option value="all">All Items</option>
                  <option value="official">Official</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <p className={styles.count}>{visibleItems.length} item{visibleItems.length === 1 ? '' : 's'}</p>

              <div className={styles.table}>
                <div className={styles.tableHeader}>
                  <span className={styles.colCheck} />
                  <button
                    className={`${styles.colName} ${styles.sortable}`}
                    onClick={() => handleSort('name')}
                  >
                    Name{sortBy === 'name' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                  </button>
                  <button
                    className={`${styles.colRarity} ${styles.sortable}`}
                    onClick={() => handleSort('rarity')}
                  >
                    Rarity{sortBy === 'rarity' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                  </button>
                  <button
                    className={`${styles.colType} ${styles.sortable}`}
                    onClick={() => handleSort('type')}
                  >
                    Type{sortBy === 'type' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                  </button>
                </div>

                {visibleItems.length === 0 ? (
                  <p className={styles.emptyState}>No magic items match your filters.</p>
                ) : (
                  visibleItems.map((item) => (
                    <div
                      key={`item-${item.id}`}
                      className={styles.itemRow}
                      onClick={() => openDetail(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') openDetail(item) }}
                    >
                      <span
                        className={styles.colCheck}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          aria-label={`Select ${item.name} for printing`}
                          checked={isPrintSelected(item)}
                          onChange={() => togglePrint(item)}
                        />
                      </span>
                      <span className={styles.colName} title={item.name}>{item.name}</span>
                      <span className={styles.colRarity}>
                        <span className={`${styles.rarityBadge} ${rarityClass(item.rarity)}`}>
                          {item.rarity ?? 'None'}
                        </span>
                      </span>
                      <span className={styles.colType}>
                        {item.type && (
                          <span className={styles.typeBadge}>{TYPE_LABELS[item.type] ?? item.type}</span>
                        )}
                        {item.custom && <span className={styles.customBadge}>Custom</span>}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <div className={styles.filters}>
                <input
                  className={styles.search}
                  type="search"
                  placeholder="Search variants..."
                  value={variantSearch}
                  onChange={(e) => setVariantSearch(e.target.value)}
                  aria-label="Search variants"
                />
              </div>

              <p className={styles.count}>
                {visibleGroupCount} variant entr{visibleGroupCount === 1 ? 'y' : 'ies'}
              </p>

              <div className={styles.variantList}>
                {visibleSections.length === 0 ? (
                  <p className={styles.emptyState}>No variant templates match your filters.</p>
                ) : (
                  visibleSections.map((section) => (
                    <div key={section.title} className={styles.variantSection}>
                      <h4 className={styles.variantSectionTitle}>{section.title}</h4>
                      {section.groups.map((group) => (
                        <div key={group.key} className={styles.variantRow}>
                          <input
                            type="checkbox"
                            aria-label={`Select ${group.entry.name} for printing`}
                            checked={isVariantSelected(group)}
                            onChange={() => toggleVariantGroup(group)}
                          />
                          <div className={styles.variantRowInfo}>
                            <div className={styles.variantRowTop}>
                              <strong className={styles.variantRowName}>{group.entry.name}</strong>
                              {group.members.length > 1 && (
                                <span className={styles.variantMemberCount}>
                                  {group.members.length} variants
                                </span>
                              )}
                              <span className={`${styles.rarityBadge} ${rarityClass(group.entry.rarity)}`}>
                                {group.entry.rarity}
                              </span>
                            </div>
                            {group.entry.appliesTo && (
                              <span className={styles.variantRequires}>{group.entry.appliesTo}</span>
                            )}
                            {group.entry.description && (
                              <span className={styles.variantDesc}>{group.entry.description}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <div className={styles.rightPanel}>
          {activeTab === 'items' && (
            <button className={styles.btnPrimary} onClick={openCreateForm}>New Magic Item</button>
          )}
          <button
            className={styles.btnSecondary}
            onClick={handlePrint}
            disabled={printSelection.length === 0}
          >
            Print selected ({printSelection.length})
          </button>

          {activeTab === 'variants' && selectedVariantGroups.length > 0 && (
            <div className={styles.builderPanel}>
              <h4>Build variant cards</h4>
              {selectedVariantGroups.map((group) => {
                const members = group.members
                const choiceId = variantBonusChoice[group.key] ?? members[0].id
                const chosen = members.find((m) => m.id === choiceId) ?? members[0]
                const baseItems = applicableBaseItemsForGroup(group)
                return (
                  <div key={group.key} className={styles.builderGroup}>
                    <div className={styles.builderTitle}>{group.entry.name}</div>
                    {members.length > 1 && (
                      <label className={styles.builderBonus}>
                        Bonus:
                        <select
                          value={String(choiceId)}
                          onChange={(e) =>
                            setVariantBonusChoice((prev) => ({
                              ...prev,
                              [group.key]: Number(e.target.value),
                            }))
                          }
                          aria-label={`Bonus for ${group.entry.name}`}
                        >
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>{variantBonusLabel(m)}</option>
                          ))}
                        </select>
                      </label>
                    )}
                    {baseItems.length === 0 ? (
                      <p className={styles.builderEmpty}>No base item options available.</p>
                    ) : (
                      <div className={styles.builderButtons}>
                        {baseItems.map((base) => (
                          <button
                            key={base}
                            className={styles.builderButton}
                            onClick={() => addConcreteCard(group, chosen, base)}
                          >
                            {concreteCardName(chosen, base)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {printSelection.length > 0 && (
            <div className={styles.selectedList}>
              <h4>Selected for printing</h4>
              {printSelection.map((sel) => (
                <div key={sel.key} className={styles.selectedCard}>
                  <div className={styles.selectedCardHeader}>
                    <span className={styles.selectedCardName}>{sel.name}</span>
                    <button
                      className={styles.removeBtn}
                      onClick={() => setPrintSelection((prev) => prev.filter((p) => p.key !== sel.key))}
                      aria-label={`Remove ${sel.name} from printing`}
                    >
                      &times;
                    </button>
                  </div>
                  <div className={styles.selectedCardBadges}>
                    <span className={`${styles.rarityBadge} ${rarityClass(sel.rarity)}`}>
                      {sel.rarity ?? 'None'}
                    </span>
                    {sel.type && (
                      <span className={styles.typeBadge}>{TYPE_LABELS[sel.type] ?? sel.type}</span>
                    )}
                  </div>
                  {sel.description && <div className={styles.selectedCardBody}>{sel.description}</div>}
                  {sel.appliesTo && <div className={styles.selectedCardApplies}>{sel.appliesTo}</div>}
                  <div className={styles.selectedCardFooter}>
                    {sel.weight && <span>{sel.weight}</span>}
                    <span>{attunementLabel(sel)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className={styles.hint}>
            {activeTab === 'items'
              ? 'Click a row to see item details.'
              : 'Select a variant, then click a base item to build and print its card.'}
          </p>
        </div>
      </div>

      {detailItem && (
        <ItemDetailModal
          item={detailItem}
          onClose={closeDetail}
          onEdit={openEditForm}
          onDelete={handleDelete}
        />
      )}

      {formOpen && (
        <ItemFormModal
          item={editingItem}
          onClose={() => { setFormOpen(false); setEditingItem(null) }}
          onSaved={async () => {
            setFormOpen(false)
            setEditingItem(null)
            await load()
          }}
          notify={setToast}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <div className={styles.printArea} data-testid="print-area">
        <div className={styles.printGrid}>
          {printSelection.map((sel) => (
            <div key={sel.key} className={styles.printCard}>
              <div className={styles.printHeader}>
                <div className={styles.printName}>{sel.name}</div>
                <div className={styles.printBadges}>
                  <span className={`${styles.rarityBadge} ${rarityClass(sel.rarity)}`}>
                    {sel.rarity ?? 'None'}
                  </span>
                  {sel.type && (
                    <span className={styles.typeBadge}>{TYPE_LABELS[sel.type] ?? sel.type}</span>
                  )}
                </div>
              </div>
              {sel.description && <div className={styles.printBody}>{sel.description}</div>}
              {sel.appliesTo && <div className={styles.printApplies}>{sel.appliesTo}</div>}
              <div className={styles.printFooter}>
                {sel.weight && <span>{sel.weight}</span>}
                <span>{attunementLabel(sel)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ItemDetailModal({
  item,
  onClose,
  onEdit,
  onDelete,
}: {
  item: MagicItem
  onClose: () => void
  onEdit: (item: MagicItem) => void
  onDelete: (id: number) => void
}) {
  return (
    <Modal open onClose={onClose} title={item.name}>
      <div className={styles.detailBadges}>
        <span className={`${styles.rarityBadge} ${rarityClass(item.rarity)}`}>{item.rarity ?? 'None'}</span>
        {item.type && <span className={styles.typeBadge}>{TYPE_LABELS[item.type] ?? item.type}</span>}
        <span className={styles.customBadge}>{item.custom ? 'Custom' : 'Official'}</span>
        <span className={styles.attuneBadge}>{attunementLabel(item)}</span>
      </div>

      <div className={styles.detailBody}>
        <p className={styles.detailMeta}>
          {item.source && <span>Source: {item.source}{item.page ? `, p. ${item.page}` : ''}</span>}
          {item.weight && <span> | Weight: {item.weight}</span>}
        </p>
        <p className={styles.detailDesc}>{cleanText(item.description) || 'No description available.'}</p>
        {item.custom && (
          <div className={styles.detailActions}>
            <button className={styles.btnSecondary} onClick={() => onEdit(item)}>Edit</button>
            <button
              className={styles.btnDanger}
              onClick={() => onDelete(item.id)}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}

function ItemFormModal({
  item,
  onClose,
  onSaved,
  notify,
}: {
  item: MagicItem | null
  onClose: () => void
  onSaved: () => void
  notify: (t: ToastState) => void
}) {
  const [name, setName] = useState(item?.name ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [rarity, setRarity] = useState(item?.rarity ?? '')
  const [type, setType] = useState(item?.type ?? '')
  const [weight, setWeight] = useState(item?.weight ?? '')
  const [attune, setAttune] = useState(item?.requiresAttunement ?? false)

  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) {
      notify({ message: 'Name is required', type: 'error' })
      return
    }
    if (!description.trim()) {
      notify({ message: 'Description is required', type: 'error' })
      return
    }
    const input: MagicItemInput = {
      name: name.trim(),
      description: description.trim(),
      rarity: rarity || null,
      type: type || null,
      weight: weight.trim() || null,
      requiresAttunement: attune,
      attunement: null,
    }
    setSaving(true)
    try {
      if (item) {
        await updateMagicItem(item.id, input)
        notify({ message: 'Magic item updated', type: 'success' })
      } else {
        await createMagicItem(input)
        notify({ message: 'Magic item created', type: 'success' })
      }
      onSaved()
    } catch {
      notify({ message: item ? 'Failed to update magic item' : 'Failed to create magic item', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={item ? 'Edit Magic Item' : 'Create Magic Item'}>
      <div className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="magic-item-name">Name:</label>
          <input
            id="magic-item-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Staff of Fire"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="magic-item-description">Description:</label>
          <textarea
            id="magic-item-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this item does..."
            rows={4}
          />
        </div>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label htmlFor="magic-item-rarity">Rarity:</label>
            <select id="magic-item-rarity" value={rarity} onChange={(e) => setRarity(e.target.value)}>
              <option value="">None</option>
              {RARITIES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="magic-item-type">Type:</label>
            <select id="magic-item-type" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">None</option>
              {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="magic-item-weight">Weight:</label>
          <input
            id="magic-item-weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 2 lb."
          />
        </div>
        <div className={styles.field}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={attune}
              onChange={(e) => setAttune(e.target.checked)}
            />
            Requires Attunement
          </label>
        </div>
        <div className={styles.buttonRow}>
          <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : item ? 'Save Changes' : 'Create Item'}
          </button>
          <button className={styles.btnSecondary} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </Modal>
  )
}
