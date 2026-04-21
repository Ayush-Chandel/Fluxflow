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

// Registered outside React — fires once on page load from persisted session
// then only re-fires when auth state actually changes
onIdTokenChanged(auth, (firebaseUser) => {
  if (firebaseUser) {
    firebaseUser.getIdTokenResult().then((result) => {
      const workspaceId = result.claims['workspaceId'] as string
      useAuthStore.getState().setUser(
        Object.assign(firebaseUser, { workspaceId })
      )
      useAuthStore.getState().setLoading(false)
    })
  } else {
    useAuthStore.getState().setUser(null)
    useAuthStore.getState().setLoading(false)
  }
})