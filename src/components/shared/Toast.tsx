import { useEffect } from 'react'
import styles from './Toast.module.css'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onDismiss: () => void
  duration?: number
}

export function Toast({ message, type, onDismiss, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [onDismiss, duration])

  return (
    <div className={`${styles.toast} ${styles[type]}`} role="alert">
      <span>{message}</span>
      <button className={styles.dismiss} onClick={onDismiss} aria-label="Dismiss">&times;</button>
    </div>
  )
}
