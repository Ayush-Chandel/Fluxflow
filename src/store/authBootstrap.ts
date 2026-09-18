// src/store/authBootstrap.ts
//
// The Firebase side of the auth store, split out of ./authStore so that
// importing the store does not import the Firebase SDK. Loaded on demand by
// ensureAuthBootstrap(); importing this module registers the listener as a
// side effect, which is why it has no exports worth using.
import { onIdTokenChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuthStore } from './authStore'

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
