// src/services/authService.ts
import { auth } from '@/lib/firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { router } from '@/router'
import { useAuthStore } from '@/store/authStore'
import { WorkspaceClaimError } from '@/lib/authErrors'

const AUTH_TRANSITION_LOADER_MS = 2_000

async function waitForAuthTransition(startedAt: number) {
  const remaining = AUTH_TRANSITION_LOADER_MS - (Date.now() - startedAt)
  if (remaining <= 0) return

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, remaining)
  })
}

async function ensureWorkspaceClaim(user: User): Promise<string> {
  const existing = (await user.getIdTokenResult()).claims['workspaceId'] as string | undefined
  if (existing) return existing

  const token = await user.getIdToken()
  const res = await fetch('/api/setWorkspaceClaims', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ uid: user.uid }),
  })
  if (!res.ok) throw new WorkspaceClaimError()

  const { workspaceId } = (await res.json()) as { workspaceId: string }

  await user.getIdToken(true)
  return workspaceId
}

// Both entry points land in the same state: claim minted, store patched, routed.
async function completeSignIn(user: User, startedAt: number) {
  const workspaceId = await ensureWorkspaceClaim(user)

  useAuthStore.getState().setUser(Object.assign(user, { workspaceId }))
  await waitForAuthTransition(startedAt)
  useAuthStore.getState().setLoading(false)

  router.navigate('/app/issues', { replace: true }) // ← no useNavigate needed
  return user
}

export const authService = {
  async signUp(email: string, password: string) {
    const startedAt = Date.now()
    useAuthStore.getState().setLoading(true)

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      return await completeSignIn(cred.user, startedAt)
    } catch (error) {
      useAuthStore.getState().setLoading(false)
      throw error
    }
  },

  async logIn(email: string, password: string) {
    const startedAt = Date.now()
    useAuthStore.getState().setLoading(true)

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      return await completeSignIn(cred.user, startedAt)
    } catch (error) {
      useAuthStore.getState().setLoading(false)
      throw error
    }
  },

  async signOut() {
    await signOut(auth)
    router.navigate('/login', { replace: true })
  },
}
