import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout/Layout'
import { LoadingSpinner } from './components/shared/LoadingSpinner'
import './index.css'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const NPCPage = lazy(() => import('./pages/NPCPage'))
const EncounterBuilderPage = lazy(() => import('./pages/EncounterBuilderPage'))
const MapsPage = lazy(() => import('./pages/MapsPage'))
const StoryPlannerPage = lazy(() => import('./pages/StoryPlannerPage'))

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<SuspenseWrapper><LoginPage /></SuspenseWrapper>} />
        <Route element={<Layout />}>
          <Route path="/" element={<SuspenseWrapper><DashboardPage /></SuspenseWrapper>} />
          <Route path="/npcs" element={<SuspenseWrapper><NPCPage /></SuspenseWrapper>} />
          <Route path="/encounters" element={<SuspenseWrapper><EncounterBuilderPage /></SuspenseWrapper>} />
          <Route path="/maps" element={<SuspenseWrapper><MapsPage /></SuspenseWrapper>} />
          <Route path="/story" element={<SuspenseWrapper><StoryPlannerPage /></SuspenseWrapper>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
