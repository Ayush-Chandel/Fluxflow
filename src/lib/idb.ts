// src/lib/idb.ts — thin typed wrapper over idb-keyval.
// This is Layer 1 of the data pipeline (§6): instant IndexedDB reads on boot so
// the UI paints cached data in 0–5ms before Firestore's onSnapshot responds.
import { del as idbDel, get as idbGet, set as idbSet } from 'idb-keyval'

export const idb = {
  // Returns undefined when the key was never written (cold first load).
  get: <T>(key: string) => idbGet<T>(key),
  set: <T>(key: string, value: T) => idbSet(key, value),
  del: (key: string) => idbDel(key),
}

// Canonical cache keys, workspace-scoped so switching workspaces never mixes data.
export const cacheKey = {
  issues: (ws: string) => `issues:${ws}`,
  projects: (ws: string) => `projects:${ws}`,
  cycles: (ws: string) => `cycles:${ws}`,
  templates: (ws: string) => `templates:${ws}`,
}
