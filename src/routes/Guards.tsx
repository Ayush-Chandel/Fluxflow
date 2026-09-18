// src/routes/guards.tsx
import { useEffect } from 'react'
import { Navigate, Outlet, useNavigation } from 'react-router-dom'
import PageLoader from '@/components/common/PageLoader'
import { LANDING_BG } from '@/components/common/constants/constants'
import { ensureAuthBootstrap, useAuthStore } from '@/store/authStore'

// Any guard that gates on `loading` has to make sure the Firebase listener is
// actually running, otherwise `loading` never flips and the loader sticks.
// main.tsx already starts it on boot; this is the belt-and-braces call, and it
// is idempotent.
function useAuthBootstrap() {
  useEffect(() => {
    void ensureAuthBootstrap()
  }, [])
}

// Wraps / — the landing page, public in every environment.
export function PublicRoute() {
  const loading = useAuthStore((state) => state.loading)
  useAuthBootstrap()

  // The landing waits for auth before painting. It reads no auth state itself,
  // but Header does: gating here is what lets it render the right CTA on the
  // first frame instead of guessing and correcting.
  if (loading) return <PageLoader fullscreen className={LANDING_BG} />
  return <Outlet />
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
