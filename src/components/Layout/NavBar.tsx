import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import { ThemeToggle } from './ThemeToggle'
import styles from './NavBar.module.css'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/npcs', label: 'NPCs' },
  { to: '/encounters', label: 'Encounters' },
  { to: '/maps', label: 'Maps' },
  { to: '/story', label: 'Story' },
]

export function NavBar() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.brand}>
          DMC
        </NavLink>

        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span className={`${styles.bar} ${menuOpen ? styles.open : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.open : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.open : ''}`} />
        </button>

        <div className={`${styles.links} ${menuOpen ? styles.visible : ''}`}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.active : ''}`
              }
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
          <ThemeToggle />
          <button className={styles.link} onClick={handleLogout}>Log Out</button>
        </div>
      </div>
    </nav>
  )
}
