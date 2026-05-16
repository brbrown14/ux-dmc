import { Outlet } from 'react-router-dom'
import { NavBar } from './NavBar'
import styles from './Layout.module.css'

export function Layout() {
  return (
    <div className={styles.layout}>
      <NavBar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
