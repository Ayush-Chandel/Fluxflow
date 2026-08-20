// src/hooks/useEntitySync.ts — the sync engine (§6, Layer 1).
// One generic hook that runs the whole boot-and-subscribe cycle so it isn't
// copy-pasted per entity: useIssues / useProjects / useCycles / useTemplates are
// all thin wrappers that call this with their own path / cacheKey / binding.
import { useEffect } from 'react'
import {
  collection,
  onSnapshot,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { idb } from '@/lib/idb'
import { notify } from '@/lib/notify'
import { withoutOptimistic } from '@/lib/optimistic'
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
  setAll: (docs: T[]) => void // replace state with authoritative full state
  applyDelta: (delta: SnapshotDelta<T>) => void // merge one Firestore change
  selectAll: () => T[] // read current state back out for write-back
}

// A serverTimestamp() that hasn't been acknowledged yet reads back as NULL under
// Firestore's default behaviour. Every service stamps `updatedAt` that way, so
// the snapshot echoing a local write would blank the very field the write set —
// '2h ago' flickering to '' on every edit, a project sorted by "updated" jumping
// to the bottom, and that null persisted into the cache (indefinitely, offline).
// 'estimate' fills it from the local clock until the server's value lands.
const READ = { serverTimestamps: 'estimate' } as const

// Backoff for rebuilding a listener Firestore has torn down. Capped, and the
// last step repeats — a listener that can't come back should keep trying quietly
// rather than escalate forever.
const RETRY_MS = [1_000, 2_000, 5_000, 10_000, 30_000]

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
    let unsubscribe: Unsubscribe | undefined
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let attempt = 0

    // 'workspaces/{ws}/issues' → 'issues', for error copy.
    const label = collectionPath.split('/').pop() ?? 'data'
    const toDoc = (snap: QueryDocumentSnapshot) => ({ id: snap.id, ...snap.data(READ) }) as T

    // 1. Instant read from IndexedDB → store (0–5ms, no spinner). Guard against a
    //    late resolve after unmount so we never write into a torn-down store.
    idb.get<T[]>(cacheKey).then((cached) => {
      if (cancelled || hasSnapshot || !cached) return
      setAll(cached)
    })

    // 2. Firestore realtime subscription → merge only what changed → write back.
    const subscribe = () => {
      unsubscribe = onSnapshot(
        collection(db, collectionPath),
        (snapshot) => {
          attempt = 0

          if (!hasSnapshot) {
            hasSnapshot = true
            setAll(snapshot.docs.map(toDoc))
          } else {
            snapshot.docChanges().forEach((change) => {
              applyDelta({ type: change.type, doc: toDoc(change.doc) })
            })
          }

          // Persist the merged result so the next boot paints fresh (§6, step 3),
          // minus placeholders — see lib/optimistic.
          idb.set(cacheKey, withoutOptimistic(selectAll()))
        },
        (error) => {
          if (cancelled) return

          hasSnapshot = false

          if (error.code === 'permission-denied') {
            // Retrying a denial just loops; the user needs to re-authenticate.
            notify.error(`Can't read ${label}`, {
              description: 'Your access to this workspace has changed. Try signing in again.',
            })
            return
          }

          if (attempt === 0) {
            notify.error(`Lost live updates for ${label}`, {
              description: 'Showing cached data while reconnecting…',
            })
          }
          retryTimer = setTimeout(subscribe, RETRY_MS[Math.min(attempt, RETRY_MS.length - 1)])
          attempt += 1
        },
      )
    }

    subscribe()

    return () => {
      cancelled = true
      clearTimeout(retryTimer)
      unsubscribe?.()
    }
    // Re-subscribe only when the workspace (hence path/key) changes. The store
    // actions from the binding are stable Zustand references by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.workspaceId, collectionPath, cacheKey])
}
