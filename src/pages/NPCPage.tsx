import { useState, useEffect } from 'react'
import { fetchNPCs, createNPC, updateNPC, deleteNPC } from '../api/npcs'
import { fetchMaps } from '../api/maps'
import { LoadingSpinner } from '../components/shared/LoadingSpinner'
import { Toast } from '../components/shared/Toast'
import type { NPC, WorldMap } from '../api/types'
import styles from './NPCPage.module.css'

type ToastState = { message: string; type: 'success' | 'error' } | null

export default function NPCPage() {
  const [npcs, setNpcs] = useState<NPC[]>([])
  const [maps, setMaps] = useState<WorldMap[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState>(null)

  const [name, setName] = useState('')
  const [location, setLocation] = useState('Unknown')
  const [occupation, setOccupation] = useState('')
  const [history, setHistory] = useState('')
  const [personality, setPersonality] = useState('')
  const [editingNpc, setEditingNpc] = useState<NPC | null>(null)

  async function loadData() {
    const [npcData, mapData] = await Promise.all([fetchNPCs(), fetchMaps()])
    setNpcs(npcData)
    setMaps(mapData)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        await loadData()
      } catch {
        if (!cancelled) setToast({ message: 'Failed to load NPCs', type: 'error' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  function resetForm() {
    setName('')
    setLocation('Unknown')
    setOccupation('')
    setHistory('')
    setPersonality('')
    setEditingNpc(null)
  }

  function handleEdit(npc: NPC) {
    setName(npc.name)
    setLocation(npc.location)
    setOccupation(npc.occupation)
    setHistory(npc.history)
    setPersonality(npc.personality)
    setEditingNpc(npc)
  }

  async function handleSave() {
    if (!name.trim()) {
      setToast({ message: 'Name is required', type: 'error' })
      return
    }
    try {
      const data = { name, location, occupation, history, personality, worldMapId: null }
      if (editingNpc) {
        await updateNPC(editingNpc.id, data)
        setToast({ message: 'NPC updated successfully!', type: 'success' })
      } else {
        await createNPC(data)
        setToast({ message: 'NPC created successfully!', type: 'success' })
      }
      resetForm()
      await loadData()
    } catch {
      setToast({ message: editingNpc ? 'Failed to update NPC' : 'Failed to create NPC', type: 'error' })
    }
  }

  async function handleDelete(npc: NPC) {
    if (!globalThis.confirm(`Delete "${npc.name}"?`)) return
    try {
      await deleteNPC(npc.id)
      setToast({ message: 'NPC deleted successfully!', type: 'success' })
      if (editingNpc?.id === npc.id) resetForm()
      await loadData()
    } catch {
      setToast({ message: 'Failed to delete NPC', type: 'error' })
    }
  }

  async function handleRefresh() {
    setLoading(true)
    try {
      await loadData()
    } catch {
      setToast({ message: 'Failed to load NPCs', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const grouped = npcs.reduce<Record<string, NPC[]>>((acc, npc) => {
    const loc = npc.location || 'Unknown'
    if (!acc[loc]) acc[loc] = []
    acc[loc].push(npc)
    return acc
  }, {})

  const sortedLocations = Object.keys(grouped).sort((a, b) => {
    if (a === 'Unknown') return 1
    if (b === 'Unknown') return -1
    return a.localeCompare(b)
  })

  if (loading) return <LoadingSpinner />

  return (
    <div className={styles.page}>
      <h1>NPC Manager</h1>

      <section className={styles.createSection}>
        <h3>{editingNpc ? 'Edit NPC' : 'Create New NPC'}</h3>
        <div className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="npc-name">Name:</label>
            <input id="npc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Eldrin Whisperwind" />
          </div>
          <div className={styles.field}>
            <label htmlFor="npc-location">Location:</label>
            <select id="npc-location" value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="Unknown">Unknown</option>
              {maps.map((m) => <option key={m.id} value={m.title}>{m.title}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="npc-occupation">Occupation:</label>
            <input id="npc-occupation" value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="Elven Scout" />
          </div>
          <div className={styles.field}>
            <label htmlFor="npc-history">History:</label>
            <textarea id="npc-history" value={history} onChange={(e) => setHistory(e.target.value)} placeholder="Born in the ancient groves..." />
          </div>
          <div className={styles.field}>
            <label htmlFor="npc-personality">Personality:</label>
            <input id="npc-personality" value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder="Stoic, observant..." />
          </div>
          <div className={styles.buttonRow}>
            <button className={styles.btn} onClick={handleSave}>
              {editingNpc ? 'Update NPC' : 'Create NPC'}
            </button>
            {editingNpc && (
              <button className={styles.btnSecondary} onClick={resetForm}>Cancel</button>
            )}
          </div>
        </div>
      </section>

      <hr className={styles.divider} />

      <section>
        <h3>My NPCs <button className={styles.refreshBtn} onClick={handleRefresh}>Refresh List</button></h3>
        {npcs.length === 0 ? (
          <p className={styles.empty}>No NPCs yet.</p>
        ) : (
          sortedLocations.map((loc) => (
            <LocationGroup key={loc} location={loc} npcs={grouped[loc]} onEdit={handleEdit} onDelete={handleDelete} />
          ))
        )}
      </section>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  )
}

function LocationGroup({ location, npcs, onEdit, onDelete }: { location: string; npcs: NPC[]; onEdit: (npc: NPC) => void; onDelete: (npc: NPC) => void }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className={styles.locationGroup}>
      <button className={styles.locationHeader} onClick={() => setExpanded(!expanded)}>
        <h4>{location} ({npcs.length})</h4>
        <span className={`${styles.arrow} ${expanded ? styles.arrowExpanded : ''}`}>▼</span>
      </button>
      {expanded && npcs.map((npc) => <NPCCard key={npc.id} npc={npc} onEdit={onEdit} onDelete={onDelete} />)}
    </div>
  )
}

function NPCCard({ npc, onEdit, onDelete }: { npc: NPC; onEdit: (npc: NPC) => void; onDelete: (npc: NPC) => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`${styles.npcCard} ${expanded ? styles.expanded : ''}`} onClick={() => setExpanded(!expanded)}>
      <div className={styles.npcHeader}>
        <h4>{npc.name}</h4>
        <span className={`${styles.arrow} ${expanded ? styles.arrowExpanded : ''}`}>▼</span>
      </div>
      <p><strong>Location:</strong> {npc.location}</p>
      {expanded && (
        <div className={styles.npcDetails}>
          <p><strong>Occupation:</strong> {npc.occupation}</p>
          <p><strong>Personality:</strong> {npc.personality}</p>
          <p><strong>History:</strong> {npc.history}</p>
          <small>ID: {npc.id} | Owner: {npc.ownerUsername}</small>
          <div className={styles.npcActions}>
            <button className={styles.btn} onClick={(e) => { e.stopPropagation(); onEdit(npc) }}>Edit</button>
            <button className={styles.btnDanger} onClick={(e) => { e.stopPropagation(); onDelete(npc) }}>Delete</button>
          </div>
        </div>
      )}
    </div>
  )
}
