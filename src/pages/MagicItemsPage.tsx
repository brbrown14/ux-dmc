import { useEffect, useMemo, useState } from 'react'
import {
  fetchMagicItems,
  fetchMagicItemVariants,
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
type DetailTab = 'details' | 'variants'

interface PrintSelection {
  key: string
  name: string
  description: string
  rarity: string | null
  type: string | null
  weight: string | null
  requiresAttunement: boolean | null
  attunement: string | null
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

function describeRequires(raw: string | null): string {
  if (!raw) return ''
  try {
    const obj = JSON.parse(raw)
    const parts: string[] = []
    if (obj.armor) parts.push('armor')
    if (obj.type) parts.push(TYPE_LABELS[obj.type] ?? obj.type)
    if (obj.weapon) parts.push('weapons')
    if (obj.sword) parts.push('swords')
    if (obj.axe) parts.push('axes')
    if (obj.ammunition) parts.push('ammunition')
    if (obj.name) parts.push(obj.name)
    if (obj.dmgType) parts.push(`${obj.dmgType} damage`)
    if (parts.length === 0) return ''
    return `Applies to ${parts.join(', ')}`
  } catch {
    return ''
  }
}

function printCardFromItem(item: MagicItem): PrintSelection {
  return {
    key: `item-${item.id}`,
    name: item.name,
    description: item.description,
    rarity: item.rarity,
    type: item.type,
    weight: item.weight,
    requiresAttunement: item.requiresAttunement,
    attunement: item.attunement,
  }
}

function printCardFromVariant(item: MagicItem, variant: MagicItem): PrintSelection {
  return {
    key: `variant-${item.id}-${variant.name}`,
    name: `${variant.name} (${item.name})`,
    description: variant.description || item.description,
    rarity: variant.rarity ?? item.rarity,
    type: item.type,
    weight: item.weight,
    requiresAttunement: item.requiresAttunement,
    attunement: item.attunement,
  }
}

export default function MagicItemsPage() {
  const [items, setItems] = useState<MagicItem[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState>(null)

  const [search, setSearch] = useState('')
  const [rarityFilter, setRarityFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const [printSelection, setPrintSelection] = useState<PrintSelection[]>([])
  const [detailItem, setDetailItem] = useState<MagicItem | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MagicItem | null>(null)

  async function load() {
    try {
      const data = await fetchMagicItems()
      setItems(data)
    } catch {
      setToast({ message: 'Failed to load magic items', type: 'error' })
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

  function isVariantSelected(item: MagicItem, variant: MagicItem): boolean {
    return printSelection.some((p) => p.key === `variant-${item.id}-${variant.name}`)
  }

  function toggleVariantPrint(item: MagicItem, variant: MagicItem) {
    const key = `variant-${item.id}-${variant.name}`
    setPrintSelection((prev) =>
      prev.some((p) => p.key === key)
        ? prev.filter((p) => p.key !== key)
        : [...prev, printCardFromVariant(item, variant)],
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
      <h1 className={styles.heading}>Magic Items</h1>

      <div className={styles.body}>
        <div className={styles.leftPanel}>
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
        </div>

        <div className={styles.rightPanel}>
          <button className={styles.btnPrimary} onClick={openCreateForm}>New Magic Item</button>
          <button
            className={styles.btnSecondary}
            onClick={handlePrint}
            disabled={printSelection.length === 0}
          >
            Print selected ({printSelection.length})
          </button>

          {printSelection.length > 0 && (
            <div className={styles.selectedList}>
              <h4>Selected for printing</h4>
              {printSelection.map((sel) => (
                <div key={sel.key} className={styles.selectedRow}>
                  <span className={styles.selectedName}>{sel.name}</span>
                  <button
                    className={styles.removeBtn}
                    onClick={() => setPrintSelection((prev) => prev.filter((p) => p.key !== sel.key))}
                    aria-label={`Remove ${sel.name} from printing`}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className={styles.hint}>Click a row to see item details and matching variants.</p>
        </div>
      </div>

      {detailItem && (
        <ItemDetailModal
          item={detailItem}
          onClose={closeDetail}
          onEdit={openEditForm}
          onDelete={handleDelete}
          onToggleVariant={toggleVariantPrint}
          isVariantSelected={(v) => isVariantSelected(detailItem, v)}
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
  onToggleVariant,
  isVariantSelected,
}: {
  item: MagicItem
  onClose: () => void
  onEdit: (item: MagicItem) => void
  onDelete: (id: number) => void
  onToggleVariant: (item: MagicItem, variant: MagicItem) => void
  isVariantSelected: (variant: MagicItem) => boolean
}) {
  const [tab, setTab] = useState<DetailTab>('details')
  const [variants, setVariants] = useState<MagicItem[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchMagicItemVariants(item.id)
      .then((v) => { if (!cancelled) setVariants(v) })
      .catch(() => { if (!cancelled) setVariants([]) })
    return () => { cancelled = true }
  }, [item.id])

  const matches = variants && variants.length > 0

  return (
    <Modal open onClose={onClose} title={item.name}>
      <div className={styles.detailBadges}>
        <span className={`${styles.rarityBadge} ${rarityClass(item.rarity)}`}>{item.rarity ?? 'None'}</span>
        {item.type && <span className={styles.typeBadge}>{TYPE_LABELS[item.type] ?? item.type}</span>}
        <span className={styles.customBadge}>{item.custom ? 'Custom' : 'Official'}</span>
        <span className={styles.attuneBadge}>{attunementLabel(item)}</span>
      </div>

      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${tab === 'details' ? styles.tabActive : ''}`}
          onClick={() => setTab('details')}
        >
          Details
        </button>
        {matches && (
          <button
            className={`${styles.tab} ${tab === 'variants' ? styles.tabActive : ''}`}
            onClick={() => setTab('variants')}
          >
            Variants ({variants.length})
          </button>
        )}
      </div>

      {tab === 'details' ? (
        <div className={styles.detailBody}>
          <p className={styles.detailMeta}>
            {item.source && <span>Source: {item.source}{item.page ? `, p. ${item.page}` : ''}</span>}
            {item.weight && <span> | Weight: {item.weight}</span>}
          </p>
          <p className={styles.detailDesc}>{item.description || 'No description available.'}</p>
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
      ) : (
        <div className={styles.variantList}>
          {variants?.map((variant) => (
            <div key={`variant-${variant.id}`} className={styles.variantCard}>
              <button
                className={styles.variantToggle}
                onClick={() => onToggleVariant(item, variant)}
              >
                <input
                  type="checkbox"
                  readOnly
                  tabIndex={-1}
                  checked={isVariantSelected(variant)}
                  aria-label={`Select ${variant.name} for printing`}
                />
                <div className={styles.variantInfo}>
                  <strong>{variant.name}</strong>
                  {describeRequires(variant.variantRequires) && (
                    <span className={styles.variantRequires}>{describeRequires(variant.variantRequires)}</span>
                  )}
                  {variant.description && <span className={styles.variantDesc}>{variant.description}</span>}
                </div>
              </button>
            </div>
          ))}
        </div>
      )}
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
