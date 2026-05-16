import { useState, useEffect } from 'react'
import { fetchNPCs, createNPC } from '../api/npcs'
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

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [npcData, mapData] = await Promise.all([fetchNPCs(), fetchMaps()])
        if (cancelled) return
        setNpcs(npcData)
        setMaps(mapData)
      } catch {
        if (!cancelled) setToast({ message: 'Failed to load NPCs', type: 'error' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  async function handleCreate() {
    if (!name.trim()) {
      setToast({ message: 'Name is required', type: 'error' })
      return
    }
    try {
      await createNPC({ name, location, occupation, history, personality, worldMapId: null })
      setToast({ message: 'NPC created successfully!', type: 'success' })
      setName('')
      setLocation('Unknown')
      setOccupation('')
      setHistory('')
      setPersonality('')
      const [npcData, mapData] = await Promise.all([fetchNPCs(), fetchMaps()])
      setNpcs(npcData)
      setMaps(mapData)
    } catch {
      setToast({ message: 'Failed to create NPC', type: 'error' })
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
        <h3>Create New NPC</h3>
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
          <button className={styles.btn} onClick={handleCreate}>Create NPC</button>
        </div>
      </section>

      <hr className={styles.divider} />

      <section>
        <h3>My NPCs <button className={styles.refreshBtn} onClick={async () => { setLoading(true); try { const [npcData, mapData] = await Promise.all([fetchNPCs(), fetchMaps()]); setNpcs(npcData); setMaps(mapData) } catch { setToast({ message: 'Failed to load NPCs', type: 'error' }) } finally { setLoading(false) } }}>Refresh List</button></h3>
        {npcs.length === 0 ? (
          <p className={styles.empty}>No NPCs yet.</p>
        ) : (
          sortedLocations.map((loc) => (
            <LocationGroup key={loc} location={loc} npcs={grouped[loc]} />
          ))
        )}
      </section>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  )
}

function LocationGroup({ location, npcs }: { location: string; npcs: NPC[] }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className={styles.locationGroup}>
      <button className={styles.locationHeader} onClick={() => setExpanded(!expanded)}>
        <h4>{location} ({npcs.length})</h4>
        <span className={`${styles.arrow} ${expanded ? styles.arrowExpanded : ''}`}>▼</span>
      </button>
      {expanded && npcs.map((npc) => <NPCCard key={npc.id} npc={npc} />)}
    </div>
  )
}

function NPCCard({ npc }: { npc: NPC }) {
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
        </div>
      )}
    </div>
  )
}
