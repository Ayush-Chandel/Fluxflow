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
async function completeSignIn(user: User) {
  const workspaceId = await ensureWorkspaceClaim(user)

  useAuthStore.getState().setUser(Object.assign(user, { workspaceId }))
  useAuthStore.getState().setLoading(false)

  router.navigate('/app/issues', { replace: true }) // ← no useNavigate needed
  return user
}

export const authService = {
  async signUp(email: string, password: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    return completeSignIn(cred.user)
  },

  async logIn(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return completeSignIn(cred.user)
  },

  async signOut() {
    await signOut(auth)
    router.navigate('/login', { replace: true })
  },
}
