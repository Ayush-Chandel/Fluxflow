// src/routes/guards.tsx
import { Navigate, Outlet } from 'react-router-dom'
import PageLoader from '@/components/common/PageLoader'
import { useAuthStore } from '@/store/authStore'

// The landing page is still a placeholder, so it only shows in local dev.
// Set VITE_SHOW_LANDING=true to opt back in once it's real (in any env).
const showLanding =
  import.meta.env.DEV || import.meta.env.VITE_SHOW_LANDING === 'true'

// Wraps / — in prod, sends visitors straight to the app instead of the placeholder
export function LandingRoute() {
  const { user, loading } = useAuthStore()

  if (showLanding) return <Outlet />
  if (loading) return <PageLoader fullscreen />  // avoids a /login flash for signed-in users
  return <Navigate to={user ? '/app/issues' : '/login'} replace />
}

// Wraps /signup and /login — boots logged-in users away
export function AuthRoute() {
  const { user, loading } = useAuthStore()

  // Same mark the boot loader was already showing, so the wait is continuous
  // rather than a blank frame between the two.
  if (loading) return <PageLoader fullscreen />
  if (user) return <Navigate to="/app/issues" replace />
  return <Outlet />
}

// Wraps all /app/* routes — boots unauthenticated users
export function ProtectedRoute() {
  const { user, loading } = useAuthStore();

  if (loading) return <PageLoader delay={5000} fullscreen />  // prevents /login flash on hard refresh
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
