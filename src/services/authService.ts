// src/services/authService.ts
import { auth } from '@/lib/firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { router } from '@/router'
import { useAuthStore } from '@/store/authStore'

export const authService = {
  async signUp(email: string, password: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const token = await cred.user.getIdToken()

    const res = await fetch('/api/setWorkspaceClaims', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ uid: cred.user.uid }),
    })
    console.log('here after res of api');
    
    if (!res.ok) throw new Error('Failed to set workspace claims')

    const { workspaceId } = await res.json()  // ← 'mock-workspace' in dev, real id in prod

  await cred.user.getIdToken(true) // still force-refresh for prod (writes real claim)

  // Manually patch the store with workspaceId from response
  // covers both dev (claim never set) and prod (claim now in token)
  useAuthStore.getState().setUser(
    Object.assign(cred.user, { workspaceId })
  )
  useAuthStore.getState().setLoading(false)
  
    router.navigate('/app/issues', { replace: true }) // ← no useNavigate needed
    return cred.user
  },

  async logIn(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    router.navigate('/app/issues', { replace: true })
    return cred.user
  },

  async signOut() {
    await signOut(auth)
    router.navigate('/login', { replace: true })
  },
}