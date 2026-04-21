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
  console.log(loading,'loagin');
  
  console.log(user,'user');
  console.log('check');
  
  
  if (loading) return <AppSplash />  // prevents /login flash on hard refresh
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}