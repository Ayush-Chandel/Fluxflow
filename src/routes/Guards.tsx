// src/routes/guards.tsx
import { useEffect } from 'react'
import { Navigate, Outlet, useNavigation } from 'react-router-dom'
import PageLoader from '@/components/common/PageLoader'
import { LANDING_BG } from '@/components/common/constants/constants'
import { SHOW_LANDING } from '@/lib/landing'
import { ensureAuthBootstrap, useAuthStore } from '@/store/authStore'

// Any guard that gates on `loading` has to make sure the Firebase listener is
// actually running, otherwise `loading` never flips and the loader sticks.
// main.tsx starts it eagerly for non-landing entries; this covers the case
// where the visitor arrived on the landing page and then navigated in.
function useAuthBootstrap() {
  useEffect(() => {
    void ensureAuthBootstrap()
  }, [])
}

// Wraps / — in prod, sends visitors straight to the app instead of the placeholder
export function PublicRoute() {
  const { user, loading } = useAuthStore()
  useAuthBootstrap()

  // The landing waits for auth before painting. It reads no auth state itself,
  // but Header does: gating here is what lets it render the right CTA on the
  // first frame instead of guessing and correcting. Landing background, but
  // only when the landing is what this guard will actually render.
  if (loading)
    return <PageLoader fullscreen className={SHOW_LANDING ? LANDING_BG : undefined} />
  if (SHOW_LANDING) return <Outlet />
  return <Navigate to={user ? '/app/issues' : '/login'} replace />
}

// Wraps /signup and /login — boots logged-in users away
export function AuthRoute() {
  const { user, loading } = useAuthStore()
  const navigation = useNavigation()
  useAuthBootstrap()

  const isEnteringWorkspace =
    navigation.state === 'loading' &&
    navigation.location?.pathname.startsWith('/app')

  // Same mark the boot loader was already showing, so the wait is continuous
  // rather than a blank frame between the two.
  if (loading) return <PageLoader fullscreen />
  if (isEnteringWorkspace) return <PageLoader fullscreen />
  if (user) return <Navigate to="/app/issues" replace />
  return <Outlet />
}

// Wraps all /app/* routes — boots unauthenticated users
export function ProtectedRoute() {
  const { user, loading } = useAuthStore()
  useAuthBootstrap()

  if (loading) return <PageLoader fullscreen />
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
