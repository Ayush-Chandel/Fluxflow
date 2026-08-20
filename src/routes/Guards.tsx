// src/routes/guards.tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

function AppSplash() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
    </div>
  )
}

// The landing page is still a placeholder, so it only shows in local dev.
// Set VITE_SHOW_LANDING=true to opt back in once it's real (in any env).
const showLanding =
  import.meta.env.DEV || import.meta.env.VITE_SHOW_LANDING === 'true'

// Wraps / — in prod, sends visitors straight to the app instead of the placeholder
export function LandingRoute() {
  const { user, loading } = useAuthStore()

  if (showLanding) return <Outlet />
  if (loading) return <AppSplash />  // avoids a /login flash for signed-in users
  return <Navigate to={user ? '/app/issues' : '/login'} replace />
}

// Wraps /signup and /login — boots logged-in users away
export function AuthRoute() {
  const { user, loading } = useAuthStore()
  if (loading) return null  // brief invisible wait, no flash
  if (user) return <Navigate to="/app/issues" replace />
  return <Outlet />
}

// Wraps all /app/* routes — boots unauthenticated users
export function ProtectedRoute() {
  const { user, loading } = useAuthStore();

  if (loading) return <AppSplash />  // prevents /login flash on hard refresh
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}