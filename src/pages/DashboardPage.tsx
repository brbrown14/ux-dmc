import { useNavigate } from 'react-router-dom'
import styles from './DashboardPage.module.css'

const tools = [
  { path: '/npcs', title: 'NPC Tool', desc: 'Manage and create NPCs for your campaign.' },
  { path: '/encounters', title: 'Encounter Builder', desc: 'Build and manage combat encounters.' },
  { path: '/maps', title: 'World Map', desc: 'Upload and manage campaign maps.' },
  { path: '/story', title: 'Game Story Line', desc: 'Plan and write your campaign story.' },
]

export default function DashboardPage() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Dungeon Master's Companion</h1>
      <div className={styles.grid}>
        {tools.map((tool) => (
          <button
            key={tool.path}
            className={styles.card}
            onClick={() => navigate(tool.path)}
          >
            <h3>{tool.title}</h3>
            <p>{tool.desc}</p>
          </button>
        ))}
      </div>
      <form action="/logout" method="post" className={styles.logoutForm}>
        <button type="submit" className={styles.logout}>Logout</button>
      </form>
    </div>
  )
}
