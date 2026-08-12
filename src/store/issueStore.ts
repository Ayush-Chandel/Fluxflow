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
import { broadcastDelta } from '@/lib/broadcastChannel'
import { cacheKey, idb } from '@/lib/idb'
import { initialStatusStamps, statusStamps } from '@/lib/statusStamps'

interface IssueState {
  // Keyed by id for O(1) delta merges; views read the array via selectAll().
  issues: Record<string, Issue>

  // — sync engine binding (§6, Layer 1) —
  setAll: (docs: Issue[]) => void
  applyDelta: (delta: SnapshotDelta<Issue>) => void
  selectAll: () => Issue[]

  // — optimistic mutations (§6, Layer 2) —
  createIssue: (data: CreateIssueInput) => Promise<void>
  updateStatus: (id: string, status: IssueStatus) => Promise<void>
  updateIssue: (id: string, patch: Partial<Issue>) => Promise<void>
  deleteIssue: (id: string) => Promise<void>
}

// Persist the current map to IndexedDB in the SAME shape the engine writes back
// (an array via selectAll), so the next boot's setAll(cached) hydrates correctly.
function persist(ws: string, issues: Issue[]) {
  return idb.set(cacheKey.issues(ws), issues)
}

export const useIssueStore = create<IssueState>()(
  immer((set, get) => ({
    issues: {},

    setAll: (docs) =>
      set((s) => {
        s.issues = {}
        for (const doc of docs) s.issues[doc.id] = doc
      }),

    applyDelta: ({ type, doc }) =>
      set((s) => {
        if (type === 'removed') delete s.issues[doc.id]
        else s.issues[doc.id] = doc // 'added' | 'modified' both upsert
      }),

    selectAll: () => Object.values(get().issues),

    // Server-sequential create → temp-id dance (§6): show a placeholder instantly,
    // let onSnapshot deliver the real 'LIN-xxx' doc, then drop the placeholder.
    createIssue: async (data) => {
      const { user } = useAuthStore.getState()
      if (!user) return

      const tempId = `optimistic-${Date.now()}`
      const now = Timestamp.now()
      const status = data.status ?? 'backlog'
      const optimistic: Issue = {
        id: tempId,
        identifier: 'LIN-…',
        ...data,
        status,
        ...initialStatusStamps(status),
        createdAt: now,
        updatedAt: now,
        createdBy: user.uid,
      }

      set((s) => {
        s.issues[tempId] = optimistic
      })
      await persist(user.workspaceId, get().selectAll())
      broadcastDelta({ entity: 'issues', type: 'CREATE', id: tempId, payload: optimistic })

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
        const { id, identifier } = await issueService.create(user.workspaceId, data)
        // Swap the placeholder for the real doc keyed by its server id. When
        // onSnapshot echoes the same id it just upserts (no duplicate); in dev the
        // mock never writes to Firestore, so this swap is what keeps it on screen.
        const created: Issue = { ...optimistic, id, identifier }
        set((s) => {
          delete s.issues[tempId]
          s.issues[id] = created
        })
        await persist(user.workspaceId, get().selectAll())
        broadcastDelta({ entity: 'issues', type: 'DELETE', id: tempId })
        broadcastDelta({ entity: 'issues', type: 'CREATE', id, payload: created })
        if (live)
          notify.success('Issue created', {
            id: toastId,
            description: `${identifier} – ${created.title}`,
          })
      } catch {
        set((s) => {
          delete s.issues[tempId]
        })
        await persist(user.workspaceId, get().selectAll())
        broadcastDelta({ entity: 'issues', type: 'DELETE', id: tempId })
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

      set((s) => {
        Object.assign(s.issues[id], full)
      })
      await persist(user.workspaceId, get().selectAll())
      broadcastDelta({ entity: 'issues', type: 'UPDATE', id, payload: full })

      try {
        await issueService.updateIssue(user.workspaceId, id, full)
      } catch {
        set((s) => {
          s.issues[id] = previous
        })
        await persist(user.workspaceId, get().selectAll())
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
      broadcastDelta({ entity: 'issues', type: 'DELETE', id })

      try {
        await issueService.deleteIssue(user.workspaceId, id)
      } catch {
        set((s) => {
          s.issues[id] = previous
        })
        await persist(user.workspaceId, get().selectAll())
        notify.error('Failed to delete issue')
      }
    },
  })),
)
