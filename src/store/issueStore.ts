// src/store/issueStore.ts — §6 Layer 2 reference implementation.
// This is THE pattern projects/cycles/templates copy: entities live in a keyed
// map, the sync engine drives setAll/applyDelta/selectAll, and every mutation
// runs the optimistic pipeline — store → IndexedDB → BroadcastChannel → Firestore
// — rolling back the store on failure with a toast.
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { Timestamp } from 'firebase/firestore'
import { notify } from '@/lib/notify'
import type { CreateIssueInput, Issue, IssueStatus } from '@/types/issue'
import type { SnapshotDelta } from '@/hooks/useEntitySync'
import { issueService } from '@/services/issueService'
import { useAuthStore } from '@/store/authStore'
import { broadcastDelta, type EntityBroadcast } from '@/lib/broadcastChannel'
import { cacheKey, idb } from '@/lib/idb'
import {
  beginOptimistic,
  endOptimistic,
  placeholderIdFor,
  reconcileInto,
  rollbackPatch,
  withoutOptimistic,
} from '@/lib/optimistic'
import { initialStatusStamps, statusStamps } from '@/lib/statusStamps'

interface IssueState {
  // Keyed by id for O(1) delta merges; views read the array via selectAll().
  issues: Record<string, Issue>

  // — sync engine binding (§6, Layer 1) —
  setAll: (docs: Issue[]) => void
  applyDelta: (delta: SnapshotDelta<Issue>) => void
  selectAll: () => Issue[]

  applyBroadcast: (delta: EntityBroadcast<'issues'>) => void

  // — optimistic mutations (§6, Layer 2) —
  createIssue: (data: CreateIssueInput) => Promise<void>
  updateStatus: (id: string, status: IssueStatus) => Promise<void>
  updateIssue: (id: string, patch: Partial<Issue>) => Promise<void>
  deleteIssue: (id: string) => Promise<void>
}

// Persist the current map to IndexedDB in the SAME shape the engine writes back
// (an array via selectAll), so the next boot's setAll(cached) hydrates correctly.
// Placeholders are stripped: nothing that has no server document may enter the
// cache, or a tab closed mid-create leaves a row no snapshot can remove (§6).
function persist(ws: string, issues: Issue[]) {
  return idb.set(cacheKey.issues(ws), withoutOptimistic(issues))
}

export const useIssueStore = create<IssueState>()(
  immer((set, get) => ({
    issues: {},

    setAll: (docs) =>
      set((s) => {
        reconcileInto(s.issues, docs)
      }),

    applyDelta: ({ type, doc }) =>
      set((s) => {
        if (type === 'removed') {
          delete s.issues[doc.id]
          return
        }
        // The arriving document may be the one a placeholder is standing in for.
        // Dropping it in the SAME commit is what stops the 'LIN-…' row and the
        // real row from rendering side by side when the snapshot beats the POST
        // response back — a race the create can't win, since the id is minted
        // server-side and only the response knows it.
        const placeholder = placeholderIdFor(doc)
        if (placeholder) delete s.issues[placeholder]

        s.issues[doc.id] = doc // 'added' | 'modified' both upsert
      }),

    selectAll: () => Object.values(get().issues),

    applyBroadcast: (delta) =>
      set((s) => {
        if (delta.type === 'DELETE') {
          delete s.issues[delta.id]
          return
        }
        if (delta.type === 'CREATE') {
          s.issues[delta.id] = delta.payload
          return
        }

        const target = s.issues[delta.id]
        if (target) Object.assign(target, delta.payload)
      }),

    // Server-sequential create → temp-id dance (§6): show a placeholder instantly,
    // let onSnapshot deliver the real 'LIN-xxx' doc, then drop the placeholder.
    createIssue: async (data) => {
      const { user } = useAuthStore.getState()
      if (!user) return

      // `clientRequestId` rides along to the Fn and comes back on the created
      // document, so applyDelta can retire this placeholder the instant the real
      // one lands — whichever way the race goes.
      const { tempId, clientRequestId } = beginOptimistic()
      const now = Timestamp.now()
      const status = data.status ?? 'backlog'
      const optimistic: Issue = {
        id: tempId,
        identifier: 'LIN-…',
        ...data,
        status,
        ...initialStatusStamps(status),
        clientRequestId,
        createdAt: now,
        updatedAt: now,
        createdBy: user.uid,
      }

      set((s) => {
        s.issues[tempId] = optimistic
      })
      await persist(user.workspaceId, get().selectAll())
      broadcastDelta({
        entity: 'issues',
        workspaceId: user.workspaceId,
        type: 'CREATE',
        id: tempId,
        payload: optimistic,
      })

      let live = true
      const dismissed = () => {
        live = false
      }
      const toastId = notify.success('Issue created', {
        description: optimistic.title,
        pending: true,
        onAutoClose: dismissed,
        onDismiss: dismissed,
      })

      try {
        const { id, identifier } = await issueService.create(user.workspaceId, data, clientRequestId)
        const created: Issue = { ...optimistic, id, identifier }
        endOptimistic(tempId)
        set((s) => {
          delete s.issues[tempId]
          // The snapshot may have delivered the real document already (and its
          // server timestamps beat our local estimates), so don't overwrite it.
          if (!s.issues[id]) s.issues[id] = created
        })
        await persist(user.workspaceId, get().selectAll())
        broadcastDelta({
          entity: 'issues',
          workspaceId: user.workspaceId,
          type: 'DELETE',
          id: tempId,
        })
        broadcastDelta({
          entity: 'issues',
          workspaceId: user.workspaceId,
          type: 'CREATE',
          id,
          payload: created,
        })
        if (live)
          notify.success('Issue created', {
            id: toastId,
            description: `${identifier} – ${created.title}`,
          })
      } catch {
        endOptimistic(tempId)
        set((s) => {
          delete s.issues[tempId]
        })
        await persist(user.workspaceId, get().selectAll())
        broadcastDelta({
          entity: 'issues',
          workspaceId: user.workspaceId,
          type: 'DELETE',
          id: tempId,
        })
        notify.error('Failed to create issue', {
          id: toastId,
          description: optimistic.title,
          action: { label: 'Retry', onClick: () => void get().createIssue(data) },
        })
      }
    },

    updateStatus: (id, status) => get().updateIssue(id, { status }),

    updateIssue: async (id, patch) => {
      const { user } = useAuthStore.getState()
      if (!user) return

      const previous = get().issues[id]
      if (!previous) return

      const full: Partial<Issue> =
        patch.status && patch.status !== previous.status
          ? { ...patch, ...statusStamps(previous, patch.status) }
          : patch

      // `updatedAt` is stamped locally for the STORE only. The service writes
      // serverTimestamp() (firestore.rules requires updatedAt == request.time),
      // which reads back as null until the server acknowledges — so without a
      // local value the row's "2h ago" would blank out on every edit.
      const optimistic: Partial<Issue> = { ...full, updatedAt: Timestamp.now() }
      // Undo only the keys this write touches, so a failure can't also revert an
      // unrelated field a snapshot landed in between.
      const undo = rollbackPatch(previous, optimistic)

      set((s) => {
        const target = s.issues[id]
        if (target) Object.assign(target, optimistic)
      })
      await persist(user.workspaceId, get().selectAll())
      broadcastDelta({
        entity: 'issues',
        workspaceId: user.workspaceId,
        type: 'UPDATE',
        id,
        payload: optimistic,
      })

      try {
        // `full`, not `optimistic` — the local timestamp must not reach the wire.
        await issueService.updateIssue(user.workspaceId, id, full)
      } catch {
        set((s) => {
          const target = s.issues[id]
          if (target) Object.assign(target, undo)
        })
        await persist(user.workspaceId, get().selectAll())
        broadcastDelta({
          entity: 'issues',
          workspaceId: user.workspaceId,
          type: 'UPDATE',
          id,
          payload: undo,
        })
        notify.error('Failed to update issue')
      }
    },

    deleteIssue: async (id) => {
      const { user } = useAuthStore.getState()
      if (!user) return

      const previous = get().issues[id]
      if (!previous) return

      set((s) => {
        delete s.issues[id]
      })
      await persist(user.workspaceId, get().selectAll())
      broadcastDelta({
        entity: 'issues',
        workspaceId: user.workspaceId,
        type: 'DELETE',
        id,
      })

      try {
        await issueService.deleteIssue(user.workspaceId, id)
      } catch {
        set((s) => {
          s.issues[id] = previous
        })
        await persist(user.workspaceId, get().selectAll())
        broadcastDelta({
          entity: 'issues',
          workspaceId: user.workspaceId,
          type: 'CREATE',
          id,
          payload: previous,
        })
        notify.error('Failed to delete issue')
      }
    },
  })),
)
