import { useState, useEffect } from 'react'
import { fetchMonsters } from '../api/monsters'
import {
  fetchEncounters, fetchEncounter, createEncounter, deleteEncounter,
  addMonsterToEncounter, updateMonsterInEncounter,
} from '../api/encounters'
import { LoadingSpinner } from '../components/shared/LoadingSpinner'
import { Modal } from '../components/shared/Modal'
import { Toast } from '../components/shared/Toast'
import { calcEncounterDifficulty, getDifficultyLabel } from '../components/EncounterBuilder/difficulty'
import type { Monster, Encounter as EncounterType } from '../api/types'
import styles from './EncounterBuilderPage.module.css'

interface EncounterMonsterEntry {
  monsterId: number
  linkId: number | null
  name: string
  type: string
  cr: string
  ac: number
  hp: number
  xp: number
  quantity: number
  initiative: number | null
}

type ToastState = { message: string; type: 'success' | 'error' } | null

function monsterImageUrl(monster: Monster): string | null {
  if (!monster.imagePath) return null
  return `/monster-images/${monster.imagePath.split('/').map(encodeURIComponent).join('/')}`
}

export default function EncounterBuilderPage() {
  const [allMonsters, setAllMonsters] = useState<Monster[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState>(null)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [crFilter, setCrFilter] = useState('')
  const [crRangeMin, setCrRangeMin] = useState(0)
  const [crRangeMax, setCrRangeMax] = useState(30)
  const [sortField, setSortField] = useState<'name' | 'type' | 'cr'>('name')
  const [sortAsc, setSortAsc] = useState(true)

  const [encounterName, setEncounterName] = useState('')
  const [encounterId, setEncounterId] = useState<number | null>(null)
  const [encounterMonsters, setEncounterMonsters] = useState<EncounterMonsterEntry[]>([])

  const [partySize, setPartySize] = useState(4)
  const [playerLevels, setPlayerLevels] = useState<number[]>([1, 1, 1, 1])
  const [savedEncounters, setSavedEncounters] = useState<EncounterType[]>([])

  const [detailMonster, setDetailMonster] = useState<Monster | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [monsters, encounters] = await Promise.all([fetchMonsters(), fetchEncounters()])
        if (cancelled) return
        setAllMonsters(monsters)
        setSavedEncounters(encounters)
      } catch {
        if (!cancelled) setToast({ message: 'Failed to load monsters', type: 'error' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  function cleanName(s: string) {
    return s ? s.replace(/^"+|"+$/g, '').replace(/""/g, '"') : s
  }

  function crSortVal(cr: string) {
    if (!cr) return -1
    if (cr === '1/8') return 0.125
    if (cr === '1/4') return 0.25
    if (cr === '1/2') return 0.5
    return parseInt(cr) || 0
  }

  function formatCr(val: number): string {
    if (val === 0.125) return '1/8'
    if (val === 0.25) return '1/4'
    if (val === 0.5) return '1/2'
    return String(Math.round(val))
  }

  const types = [...new Set(allMonsters.map((m) => m.type).filter(Boolean))].sort()
  const crs = [...new Set(allMonsters.map((m) => m.challengeRating).filter(Boolean))].sort((a, b) => crSortVal(a) - crSortVal(b))

  function getFiltered() {
    let filtered = allMonsters.map((m) => ({ ...m, name: cleanName(m.name) }))
    if (search) filtered = filtered.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    if (typeFilter) filtered = filtered.filter((m) => m.type === typeFilter)
    if (crFilter) filtered = filtered.filter((m) => m.challengeRating === crFilter)
    filtered = filtered.filter((m) => {
      const val = crSortVal(m.challengeRating)
      return val >= crRangeMin && val <= crRangeMax
    })
    filtered.sort((a, b) => {
      let va: string | number, vb: string | number
      if (sortField === 'name') { va = a.name.toLowerCase(); vb = b.name.toLowerCase() }
      else if (sortField === 'type') { va = (a.type || '').toLowerCase(); vb = (b.type || '').toLowerCase() }
      else { va = crSortVal(a.challengeRating); vb = crSortVal(b.challengeRating) }
      return va < vb ? (sortAsc ? -1 : 1) : va > vb ? (sortAsc ? 1 : -1) : 0
    })
    return filtered
  }

  function toggleSort(field: 'name' | 'type' | 'cr') {
    if (sortField === field) setSortAsc(!sortAsc)
    else { setSortField(field); setSortAsc(true) }
  }

  function addToEncounter(monster: Monster) {
    setEncounterMonsters((prev) => {
      const existing = prev.find((e) => e.monsterId === monster.id)
      if (existing) {
        return prev.map((e) => e.monsterId === monster.id ? { ...e, quantity: e.quantity + 1 } : e)
      }
      return [...prev, {
        monsterId: monster.id, linkId: null, name: cleanName(monster.name), type: monster.type,
        cr: monster.challengeRating, ac: monster.armorClass, hp: monster.hitPoints,
        xp: monster.xp, quantity: 1, initiative: null,
      }]
    })
  }

  function adjustQty(idx: number, delta: number) {
    setEncounterMonsters((prev) => prev.map((e, i) =>
      i === idx ? { ...e, quantity: Math.max(1, e.quantity + delta) } : e,
    ))
  }

  function removeFromEncounter(idx: number) {
    setEncounterMonsters((prev) => prev.filter((_, i) => i !== idx))
  }

  const diffResult = calcEncounterDifficulty(
    playerLevels,
    encounterMonsters.map((m) => ({ xp: m.xp, quantity: m.quantity })),
  )

  async function handleSave() {
    if (!encounterName.trim()) { setToast({ message: 'Please enter an encounter name.', type: 'error' }); return }
    if (encounterMonsters.length === 0) { setToast({ message: 'Add at least one monster.', type: 'error' }); return }
    try {
      let eid = encounterId
      if (!eid) {
        const created = await createEncounter(encounterName)
        eid = created.id
        setEncounterId(eid)
      }
      const updated = await Promise.all(encounterMonsters.map(async (e) => {
        if (e.linkId) {
          await updateMonsterInEncounter(eid, e.linkId, { quantity: e.quantity, initiative: e.initiative })
          return e
        }
        const link = await addMonsterToEncounter(eid, { monsterId: e.monsterId, quantity: e.quantity })
        return { ...e, linkId: link.id }
      }))
      setEncounterMonsters(updated)
      setToast({ message: 'Encounter saved!', type: 'success' })
      setSavedEncounters(await fetchEncounters())
    } catch { setToast({ message: 'Error saving encounter', type: 'error' }) }
  }

  function newEncounter() {
    setEncounterId(null)
    setEncounterName('')
    setEncounterMonsters([])
  }

  async function handleLoad(id: number) {
    try {
      const data = await fetchEncounter(id)
      const enc = data.encounter
      setEncounterId(enc.id)
      setEncounterName(enc.name)
      const monsters: EncounterMonsterEntry[] = []
      for (const link of data.monsters) {
        const m = allMonsters.find((m) => m.id === link.monsterId)
        if (m) {
          monsters.push({
            monsterId: link.monsterId, linkId: link.id, name: cleanName(m.name), type: m.type,
            cr: m.challengeRating, ac: m.armorClass, hp: m.hitPoints, xp: m.xp,
            quantity: link.quantity, initiative: link.initiative,
          })
        }
      }
      setEncounterMonsters(monsters)
    } catch { setToast({ message: 'Failed to load encounter', type: 'error' }) }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this encounter?')) return
    try {
      await deleteEncounter(id)
      if (encounterId === id) newEncounter()
      setSavedEncounters(await fetchEncounters())
    } catch { setToast({ message: 'Error deleting encounter', type: 'error' }) }
  }

  function updatePartyLevels(size: number) {
    setPartySize(size)
    setPlayerLevels((prev) => {
      const updated = [...prev]
      while (updated.length < size) updated.push(1)
      while (updated.length > size) updated.pop()
      return updated
    })
  }

  function updatePlayerLevel(idx: number, level: number) {
    setPlayerLevels((prev) => prev.map((l, i) => i === idx ? Math.min(Math.max(level, 1), 20) : l))
  }

  if (loading) return <LoadingSpinner />

  const avgLevel = playerLevels.length > 0 ? Math.round(playerLevels.reduce((a, b) => a + b, 0) / playerLevels.length) : 0

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Encounter Builder</h1>
      </header>

      <div className={styles.body}>
        <aside className={styles.leftPanel}>
          <h3 className={styles.panelTitle}>Monster Browser</h3>
          <div className={styles.filters}>
            <input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              {types.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={crFilter} onChange={(e) => setCrFilter(e.target.value)}>
              <option value="">All CR</option>
              {crs.map((cr) => <option key={cr} value={cr}>{cr}</option>)}
            </select>
            <div className={styles.crRangeSlider}>
              <span className={styles.crRangeLabel}>{formatCr(crRangeMin)}</span>
              <div className={styles.rangeTrack}>
                <input type="range" min={0} max={30} step={0.125} value={crRangeMin} onChange={(e) => setCrRangeMin(Math.min(parseFloat(e.target.value), crRangeMax))} className={styles.rangeInput} />
                <input type="range" min={0} max={30} step={0.125} value={crRangeMax} onChange={(e) => setCrRangeMax(Math.max(parseFloat(e.target.value), crRangeMin))} className={styles.rangeInput} />
              </div>
              <span className={styles.crRangeLabel}>{formatCr(crRangeMax)}</span>
            </div>
          </div>
          <div className={styles.monsterCount}>{getFiltered().length} monsters</div>
          <div className={styles.monsterTable}>
            <div className={styles.tableHeader}>
              <button className={styles.colName} onClick={() => toggleSort('name')}>Name {sortField === 'name' ? (sortAsc ? '\u25B2' : '\u25BC') : ''}</button>
              <button className={styles.colType} onClick={() => toggleSort('type')}>Type {sortField === 'type' ? (sortAsc ? '\u25B2' : '\u25BC') : ''}</button>
              <button className={styles.colCr} onClick={() => toggleSort('cr')}>CR {sortField === 'cr' ? (sortAsc ? '\u25B2' : '\u25BC') : ''}</button>
              <span className={styles.colAdd}></span>
            </div>
            {getFiltered().map((m) => (
              <div key={m.id} className={styles.monsterRow} onClick={() => setDetailMonster(m)}>
                <span className={styles.colName}>{m.name}</span>
                <span className={styles.colType}>{m.type || '-'}</span>
                <span className={styles.colCr}><span className={styles.crTag}>{m.challengeRating || '?'}</span></span>
                <span className={styles.colAdd}>
                  <button className={styles.addBtn} onClick={(e) => { e.stopPropagation(); addToEncounter(m) }}>+</button>
                </span>
              </div>
            ))}
          </div>
        </aside>

        <div className={styles.rightPanel}>
          <div className={styles.partySetup}>
            <div className={styles.partyHeader}>
              <h3 className={styles.panelTitle}>Party Setup</h3>
              <span className={styles.diffBadge}>
                {diffResult ? getDifficultyLabel(diffResult.diffIdx).charAt(0).toUpperCase() + getDifficultyLabel(diffResult.diffIdx).slice(1) : 'No party set'}
              </span>
            </div>
            <div className={styles.partyBody}>
              <div className={styles.partyRow}>
                <label>Party Size:</label>
                <input type="number" min={1} max={20} value={partySize} onChange={(e) => updatePartyLevels(parseInt(e.target.value) || 1)} />
                <label>Avg Lvl: {avgLevel}</label>
              </div>
              <div className={styles.playerLevels}>
                {playerLevels.map((lvl, i) => (
                  <input key={i} type="number" min={1} max={20} value={lvl} onChange={(e) => updatePlayerLevel(i, parseInt(e.target.value) || 1)} className={styles.lvlInput} title={`Player ${i + 1} level`} />
                ))}
              </div>
              {diffResult && (
                <div className={styles.diffDisplay}>
                  <div className={styles.diffBar}>
                    {diffResult.monsterCount > 0 ? (() => {
                      const label = getDifficultyLabel(diffResult.diffIdx).charAt(0).toUpperCase() + getDifficultyLabel(diffResult.diffIdx).slice(1)
                      const idx = diffResult.diffIdx >= 0 ? diffResult.diffIdx : 0
                      const className = diffResult.diffIdx >= 0 ? styles[`diff${label}`] : styles.diffInactive
                      return (
                        <div className={`${styles.diffSegment} ${className}`}>
                          {label} &le; {diffResult.thresholds[idx].toLocaleString()}
                        </div>
                      )
                    })() : (
                      <div className={`${styles.diffSegment} ${styles.diffInactive}`}>
                        No monsters
                      </div>
                    )}
                  </div>
                  {diffResult.monsterCount > 0 && (
                    <div className={styles.diffDetail}>
                      {diffResult.monsterCount} monster{diffResult.monsterCount !== 1 ? 's' : ''} &bull; Base XP: {diffResult.totalXp.toLocaleString()} &bull; Multiplier: &times;{diffResult.multiplier} &bull; Adjusted XP: {diffResult.adjustedXp.toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className={styles.encounterHeader}>
            <input type="text" placeholder="Encounter name..." value={encounterName} onChange={(e) => setEncounterName(e.target.value)} />
            <button className={styles.btnPrimary} onClick={handleSave}>Save</button>
            <button className={styles.btnSecondary} onClick={newEncounter}>New</button>
          </div>

          <div className={styles.encounterList}>
            {encounterMonsters.length === 0 ? (
              <div className={styles.emptyState}>No monsters in encounter. Click <strong>+</strong> to add monsters.</div>
            ) : (
              encounterMonsters.map((e, idx) => (
                <div key={idx} className={styles.encounterRow}>
                  <div className={styles.qtyControls}>
                    <button onClick={() => adjustQty(idx, -1)}>-</button>
                    <span>{e.quantity}</span>
                    <button onClick={() => adjustQty(idx, 1)}>+</button>
                  </div>
                  <div className={styles.monsterInfo}>
                    <div className={styles.monsterName}>{e.name}</div>
                    <div className={styles.monsterStats}>AC {e.ac ?? '?'} | HP {e.hp ?? '?'} | CR {e.cr || '?'}</div>
                  </div>
                  <button className={styles.removeBtn} onClick={() => removeFromEncounter(idx)}>&times;</button>
                </div>
              ))
            )}
          </div>

          {savedEncounters.length > 0 && (
            <div className={styles.savedSection}>
              <h4>Saved Encounters</h4>
              {savedEncounters.map((enc) => (
                <div key={enc.id} className={styles.savedRow}>
                  <span>{enc.name} <small>({new Date(enc.createdAt).toLocaleDateString()})</small></span>
                  <div>
                    <button className={styles.btnPrimary} onClick={() => handleLoad(enc.id)}>Load</button>
                    <button className={styles.btnDanger} onClick={() => handleDelete(enc.id)}>Del</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={!!detailMonster} onClose={() => setDetailMonster(null)} title={detailMonster?.name || ''}>
        {detailMonster && <StatBlock monster={detailMonster} />}
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  )
}

function StatBlock({ monster }: { monster: Monster }) {
  const [imgError, setImgError] = useState(false)
  const imageUrl = monsterImageUrl(monster)

  function mod(score: number | null) {
    if (score == null) return ''
    const m = Math.floor((score - 10) / 2)
    return (m >= 0 ? '+' : '') + m
  }

  function parseJsonArray(val: string | null | undefined): { name: string; entries?: string[] }[] {
    if (!val) return []
    try { return JSON.parse(val) } catch { return [] }
  }

  function parseJsonObj(val: string | null | undefined): Record<string, string> {
    if (!val) return {}
    try { return JSON.parse(val) } catch { return {} }
  }

  function parseSpeed(speed: string | null | undefined): string {
    if (!speed) return '-'
    try {
      const sp = JSON.parse(speed)
      return Object.entries(sp).map(([k, v]) => `${k} ${v}`).join(', ')
    } catch { return speed }
  }

  function joinArray(val: string | null | undefined): string {
    if (!val) return '-'
    try {
      const arr = JSON.parse(val)
      return Array.isArray(arr) ? arr.join(', ') : val
    } catch { return val }
  }

  const abilities = [
    { abbr: 'STR', score: monster.strength },
    { abbr: 'DEX', score: monster.dexterity },
    { abbr: 'CON', score: monster.constitution },
    { abbr: 'INT', score: monster.intelligence },
    { abbr: 'WIS', score: monster.wisdom },
    { abbr: 'CHA', score: monster.charisma },
  ]

  return (
    <div className={styles.statBlock}>
      <div className={styles.statHeader}>
        <div className={styles.statFields}>
          <p><strong>Source:</strong> {monster.source || '-'}</p>
          {monster.size && <p><strong>Size:</strong> {monster.size}</p>}
          {monster.type && <p><strong>Type:</strong> {monster.type}</p>}
          {monster.alignment && <p><strong>Alignment:</strong> {monster.alignment}</p>}
          {monster.armorClass != null && <p><strong>Armor Class:</strong> {monster.armorClass}</p>}
          {monster.hitPoints != null && <p><strong>Hit Points:</strong> {monster.hitPoints}{monster.hitPointsFormula ? ` (${monster.hitPointsFormula})` : ''}</p>}
          <p><strong>Speed:</strong> {parseSpeed(monster.speed)}</p>
          {monster.challengeRating && <p><strong>Challenge Rating:</strong> {monster.challengeRating}{monster.xp ? ` (${monster.xp} XP)` : ''}</p>}
        </div>
        {imageUrl && !imgError && (
          <div className={styles.monsterImage}>
            <img src={imageUrl} alt={monster.name} onError={() => setImgError(true)} loading="lazy" />
          </div>
        )}
      </div>

      <h4 className={styles.sectionTitle}>Ability Scores</h4>
      <div className={styles.abilityScores}>
        {abilities.map((a) => (
          <div key={a.abbr} className={styles.ability}>
            <div className={styles.abilityAbbr}>{a.abbr}</div>
            <div className={styles.abilityScore}>{a.score != null ? a.score : '-'}</div>
            <div className={styles.abilityMod}>{a.score != null ? mod(a.score) : ''}</div>
          </div>
        ))}
      </div>

      {monster.skills && <p><strong>Skills:</strong> {joinArray(monster.skills)}</p>}
      {monster.passive != null && <p><strong>Passive Perception:</strong> {monster.passive}</p>}
      {monster.languages && <p><strong>Languages:</strong> {joinArray(monster.languages)}</p>}
      {monster.senses && <p><strong>Senses:</strong> {Object.entries(parseJsonObj(monster.senses)).map(([k, v]) => `${k} ${v}`).join(', ')}</p>}
      {monster.damageResistances && <p><strong>Damage Resistances:</strong> {joinArray(monster.damageResistances)}</p>}
      {monster.damageImmunities && <p><strong>Damage Immunities:</strong> {joinArray(monster.damageImmunities)}</p>}
      {monster.conditionImmunities && <p><strong>Condition Immunities:</strong> {joinArray(monster.conditionImmunities)}</p>}

      {[
        ['Traits', monster.traits],
        ['Actions', monster.actions],
        ['Legendary Actions', monster.legendaryActions],
        ['Reactions', monster.reactions],
      ].map(([section, json]) => {
        const entries = parseJsonArray(json as string | null | undefined)
        if (entries.length === 0) return null
        return (
          <div key={section}>
            <h4 className={styles.sectionTitle}>{section}</h4>
            {entries.map((item, i) => (
              <p key={i} className={styles.entry}>
                <em>{item.name}.</em> {item.entries?.join(' ')}
              </p>
            ))}
          </div>
        )
      })}
    </div>
  )
}
