// src/store/authStore.ts
import { create } from 'zustand'
import { onIdTokenChanged, type User } from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface AuthUser extends User {
  workspaceId: string
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (v: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,   // ← true until onAuthStateChanged fires ONCE
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}))

const INITIAL_AUTH_LOADER_MS = 2_000
const initialAuthLoadStartedAt = Date.now()
let awaitingInitialAuthState = true

async function finishInitialAuthLoading() {
  // This runs only when the app first loads (including a browser refresh).
  // Successful auth flows control their own transition loader in authService.
  if (!awaitingInitialAuthState) return

  awaitingInitialAuthState = false
  const remaining = INITIAL_AUTH_LOADER_MS - (Date.now() - initialAuthLoadStartedAt)
  if (remaining > 0) {
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, remaining)
    })
  }
  useAuthStore.getState().setLoading(false)
}

// Registered outside React — fires once on page load from persisted session
// then only re-fires when auth state actually changes. A failed token refresh
// (for example, when the local Auth emulator is not running) must always clear
// the boot state; otherwise the route guards render their loader forever.
onIdTokenChanged(
  auth,
  async (firebaseUser) => {
    try {
      if (firebaseUser) {
        const result = await firebaseUser.getIdTokenResult()
        const workspaceId = result.claims['workspaceId'] as string
        useAuthStore.getState().setUser(
          Object.assign(firebaseUser, { workspaceId })
        )
      } else {
        useAuthStore.getState().setUser(null)
      }
    } catch (error) {
      // A cached user is not usable without a valid ID token. Treat it as
      // signed out and let the auth page display rather than wedging the app.
      console.error('[auth] Failed to refresh the Firebase ID token.', error)
      useAuthStore.getState().setUser(null)
    } finally {
      await finishInitialAuthLoading()
    }
  },
  (error) => {
    console.error('[auth] Firebase auth-state listener failed.', error)
    useAuthStore.getState().setUser(null)
    void finishInitialAuthLoading()
  },
)
