import { useState, useEffect } from 'react'
import { fetchChapters, createChapter, updateChapter } from '../api/story'
import { LoadingSpinner } from '../components/shared/LoadingSpinner'
import { Toast } from '../components/shared/Toast'
import type { Chapter } from '../api/types'
import styles from './StoryPlannerPage.module.css'

type ToastState = { message: string; type: 'success' | 'error' } | null

export default function StoryPlannerPage() {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState>(null)

  const [currentId, setCurrentId] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await fetchChapters()
        if (cancelled) return
        setChapters(data)
      } catch {
        if (!cancelled) setToast({ message: 'Failed to load chapters', type: 'error' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  function selectChapter(chapter: Chapter) {
    setCurrentId(chapter.id)
    setTitle(chapter.title)
    setContent(chapter.content)
  }

  function newChapter() {
    setCurrentId(null)
    setTitle('')
    setContent('')
  }

  function getPreview(text: string) {
    return text.length > 80 ? text.substring(0, 80) + '...' : text
  }

  async function saveChapter() {
    if (!title.trim() || !content.trim()) {
      setToast({ message: 'Title and content are required', type: 'error' })
      return
    }
    try {
      if (currentId) {
        const saved = await updateChapter(currentId, { title: title.trim(), content: content.trim() })
        setCurrentId(saved.id)
        setToast({ message: 'Chapter updated!', type: 'success' })
      } else {
        const saved = await createChapter({ title: title.trim(), content: content.trim() })
        setCurrentId(saved.id)
        setToast({ message: 'Chapter created!', type: 'success' })
      }
      setChapters(await fetchChapters())
    } catch {
      setToast({ message: 'Failed to save chapter', type: 'error' })
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className={styles.page}>
      <h1>Game Story Planner</h1>

      <div className={styles.container}>
        <aside className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>Chapters</h3>
          <button className={styles.btnSuccess} onClick={newChapter}>+ New Chapter</button>
          <div className={styles.chapterList}>
            {chapters.length === 0 ? (
              <p className={styles.empty}>No chapters yet.</p>
            ) : (
              chapters.map((ch) => (
                <div
                  key={ch.id}
                  className={`${styles.chapterItem} ${ch.id === currentId ? styles.selected : ''}`}
                  onClick={() => selectChapter(ch)}
                >
                  <h4>{ch.title}</h4>
                  <small>{getPreview(ch.content)}</small>
                </div>
              ))
            )}
          </div>
        </aside>

        <div className={styles.editor}>
          <h3>{currentId ? 'Edit Chapter' : 'New Chapter'}</h3>
          <div className={styles.field}>
            <label htmlFor="chapter-title">Title:</label>
            <input id="chapter-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Chapter title" />
          </div>
          <div className={styles.field}>
            <label htmlFor="chapter-content">Content:</label>
            <textarea id="chapter-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your chapter content here..." />
          </div>
          <div className={styles.actions}>
            <button className={styles.btnPrimary} onClick={saveChapter}>Save Chapter</button>
            <button className={styles.btnSecondary} onClick={newChapter}>Clear</button>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  )
}
