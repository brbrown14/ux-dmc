import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import { LoadingSpinner } from './shared/LoadingSpinner'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <LoadingSpinner />

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <Outlet />
}
