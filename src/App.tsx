import { lazy, Suspense, Fragment } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout/Layout'
import { LoadingSpinner } from './components/shared/LoadingSpinner'
import { useTheme } from './hooks/useTheme'
import './index.css'

function ThemeInit() {
  useTheme()
  return null
}

const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const NPCPage = lazy(() => import('./pages/NPCPage'))
const EncounterBuilderPage = lazy(() => import('./pages/EncounterBuilderPage'))
const MapsPage = lazy(() => import('./pages/MapsPage'))
const StoryPlannerPage = lazy(() => import('./pages/StoryPlannerPage'))
const MagicItemsPage = lazy(() => import('./pages/MagicItemsPage'))

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
}

function App() {
  return (
    <Fragment>
      <ThemeInit />
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<SuspenseWrapper><LoginPage /></SuspenseWrapper>} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<SuspenseWrapper><DashboardPage /></SuspenseWrapper>} />
              <Route path="/npcs" element={<SuspenseWrapper><NPCPage /></SuspenseWrapper>} />
              <Route path="/encounters" element={<SuspenseWrapper><EncounterBuilderPage /></SuspenseWrapper>} />
              <Route path="/maps" element={<SuspenseWrapper><MapsPage /></SuspenseWrapper>} />
              <Route path="/story" element={<SuspenseWrapper><StoryPlannerPage /></SuspenseWrapper>} />
              <Route path="/magic-items" element={<SuspenseWrapper><MagicItemsPage /></SuspenseWrapper>} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </Fragment>
  )
}

export default App
