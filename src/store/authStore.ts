// src/store/authStore.ts
//
// Deliberately free of any Firebase import: this module is pulled by the
// landing page (via Header) and by the route guards, and importing
// `firebase/auth` here would put the whole SDK on the landing critical path.
// The listener that actually drives this store lives in ./authBootstrap and is
// loaded on demand through ensureAuthBootstrap().
import { create } from 'zustand'
import type { User } from 'firebase/auth'

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

// Starts the Firebase auth listener exactly once, whenever it is first needed.
// Safe to call from anywhere, any number of times; every caller shares the one
// in-flight import. Nothing reading `loading` will settle until this has run,
// so every code path that gates on auth must call it.
let bootstrap: Promise<unknown> | null = null

export function ensureAuthBootstrap() {
  bootstrap ??= import('./authBootstrap')
  return bootstrap
}
