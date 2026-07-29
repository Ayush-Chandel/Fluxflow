// src/hooks/useEntitySync.ts — the sync engine (§6, Layer 1).
// One generic hook that runs the whole boot-and-subscribe cycle so it isn't
// copy-pasted per entity: useIssues / useProjects / useCycles / useTemplates are
// all thin wrappers that call this with their own path / cacheKey / binding.
import { useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { idb } from '@/lib/idb'
import { useAuthStore } from '@/store/authStore'

// A single Firestore document change, normalized. This is the SNAPSHOT delta
// (distinct from the cross-tab BroadcastDelta) — `doc` already has `id` merged in.
export type DocChangeType = 'added' | 'modified' | 'removed'

export interface SnapshotDelta<T> {
  type: DocChangeType
  doc: T
}

// The three store operations the engine drives. Each entity store implements
// these; the engine stays entity-agnostic.
export interface SyncBinding<T extends { id: string }> {
  setAll: (docs: T[]) => void // hydrate from cache in one shot
  applyDelta: (delta: SnapshotDelta<T>) => void // merge one Firestore change
  selectAll: () => T[] // read current state back out for write-back
}

export function useEntitySync<T extends { id: string }>(
  collectionPath: string,
  cacheKey: string,
  { setAll, applyDelta, selectAll }: SyncBinding<T>,
) {
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    // No workspace yet → nothing to sync. (collectionPath is '' until authed.)
    if (!user || !collectionPath) return

    let cancelled = false
    let hasSnapshot = false

    // 1. Instant read from IndexedDB → store (0–5ms, no spinner). Guard against a
    //    late resolve after unmount so we never write into a torn-down store.
    idb.get<T[]>(cacheKey).then((cached) => {
      if (cancelled || hasSnapshot || !cached) return
      setAll(cached)
    })

    // 2. Firestore realtime subscription → merge only what changed → write back.
    const unsubscribe = onSnapshot(collection(db, collectionPath), (snapshot) => {
      hasSnapshot = true
      snapshot.docChanges().forEach((change) => {
        applyDelta({
          type: change.type,
          doc: { id: change.doc.id, ...change.doc.data() } as T,
        })
      })
      // Persist the merged result so the next boot paints fresh (§6, step 3).
      idb.set(cacheKey, selectAll())
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
    // Re-subscribe only when the workspace (hence path/key) changes. The store
    // actions from the binding are stable Zustand references by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.workspaceId, collectionPath, cacheKey])
}
