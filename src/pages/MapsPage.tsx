import { useState, useEffect } from 'react'
import { fetchMaps, uploadMap, updateMap, getMapImageUrl } from '../api/maps'
import { fetchNPCsByMap } from '../api/npcs'
import { LoadingSpinner } from '../components/shared/LoadingSpinner'
import { Modal } from '../components/shared/Modal'
import { Toast } from '../components/shared/Toast'
import type { WorldMap, NPC } from '../api/types'
import styles from './MapsPage.module.css'

type ToastState = { message: string; type: 'success' | 'error' } | null

export default function MapsPage() {
  const [maps, setMaps] = useState<WorldMap[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState>(null)

  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDesc, setUploadDesc] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const [detailMap, setDetailMap] = useState<WorldMap | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [npcList, setNpcList] = useState<NPC[]>([])
  const [activeTab, setActiveTab] = useState<'details' | 'npcs'>('details')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await fetchMaps()
        if (cancelled) return
        setMaps(data)
      } catch {
        if (!cancelled) setToast({ message: 'Failed to load maps', type: 'error' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  async function handleUpload() {
    if (!uploadTitle.trim() || !uploadDesc.trim()) {
      setToast({ message: 'Title and description are required', type: 'error' })
      return
    }
    try {
      const fd = new FormData()
      if (uploadFile) fd.append('image', uploadFile)
      fd.append('title', uploadTitle)
      fd.append('description', uploadDesc)
      await uploadMap(fd)
      setToast({ message: 'Map uploaded successfully!', type: 'success' })
      setUploadOpen(false)
      setUploadTitle('')
      setUploadDesc('')
      setUploadFile(null)
      setMaps(await fetchMaps())
    } catch {
      setToast({ message: 'Failed to upload map', type: 'error' })
    }
  }

  function openDetail(map: WorldMap) {
    setDetailMap(map)
    setEditTitle(map.title)
    setEditDesc(map.description)
    setActiveTab('details')
    setNpcList([])
  }

  async function handleSaveDetail() {
    if (!detailMap) return
    if (!editTitle.trim() || !editDesc.trim()) {
      setToast({ message: 'Title and description are required', type: 'error' })
      return
    }
    try {
      const updated = await updateMap(detailMap.id, { title: editTitle, description: editDesc })
      setDetailMap(updated)
      setToast({ message: 'Map updated!', type: 'success' })
      setMaps(await fetchMaps())
    } catch {
      setToast({ message: 'Failed to update map', type: 'error' })
    }
  }

  useEffect(() => {
    if (activeTab !== 'npcs' || !detailMap) return
    let cancelled = false
    ;(async () => {
      try {
        const npcs = await fetchNPCsByMap(detailMap.id)
        if (cancelled) return
        setNpcList(npcs)
      } catch {
        if (!cancelled) setToast({ message: 'Failed to load NPCs', type: 'error' })
      }
    })()
    return () => { cancelled = true }
  }, [activeTab, detailMap])

  if (loading) return <LoadingSpinner />

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>World Maps</h1>
        <button className={styles.btnPrimary} onClick={() => setUploadOpen(true)}>+ Upload Map</button>
      </div>

      {maps.length === 0 ? (
        <p className={styles.empty}>No maps uploaded yet. Click "Upload Map" to get started.</p>
      ) : (
        <div className={styles.gallery}>
          {maps.map((map) => (
            <div key={map.id} className={styles.card} onClick={() => openDetail(map)}>
              {map.imagePath ? (
                <img
                  src={getMapImageUrl(map.imagePath)}
                  alt={map.title}
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <div className={styles.placeholder}>No image</div>
              )}
              <div className={styles.cardBody}>
                <h3>{map.title}</h3>
                <p>{map.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Map">
        <div className={styles.modalForm}>
          <label>Title:</label>
          <input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Map title" />
          <label>Description:</label>
          <textarea value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} placeholder="Describe this map..." />
          <label>Image:</label>
          <input type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/bmp" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
          <div className={styles.modalActions}>
            <button className={styles.btnPrimary} onClick={handleUpload}>Upload</button>
            <button className={styles.btnSecondary} onClick={() => setUploadOpen(false)}>Cancel</button>
          </div>
        </div>
      </Modal>

      <Modal open={!!detailMap} onClose={() => setDetailMap(null)} title={detailMap?.title || ''}>
        {detailMap && (
          <>
            <div className={styles.tabs}>
              <button className={`${styles.tab} ${activeTab === 'details' ? styles.activeTab : ''}`} onClick={() => setActiveTab('details')}>Details</button>
              <button className={`${styles.tab} ${activeTab === 'npcs' ? styles.activeTab : ''}`} onClick={() => setActiveTab('npcs')}>NPCs ({npcList.length})</button>
            </div>

            {activeTab === 'details' && (
              <div className={styles.detailContent}>
                {detailMap.imagePath ? (
                  <img src={getMapImageUrl(detailMap.imagePath)} alt={detailMap.title} className={styles.detailImage} />
                ) : (
                  <div className={styles.placeholder}>No image</div>
                )}
                <div className={styles.editFields}>
                  <label>Title:</label>
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  <label>Description:</label>
                  <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                  <button className={styles.btnPrimary} onClick={handleSaveDetail}>Save Changes</button>
                </div>
              </div>
            )}

            {activeTab === 'npcs' && (
              <div className={styles.npcTab}>
                {npcList.length === 0 ? (
                  <p className={styles.empty}>No NPCs found at this location.</p>
                ) : (
                  npcList.map((npc) => (
                    <div key={npc.id} className={styles.npcEntry}>
                      <h4>{npc.name}</h4>
                      <p><strong>Occupation:</strong> {npc.occupation}</p>
                      <p><strong>Personality:</strong> {npc.personality}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  )
}
