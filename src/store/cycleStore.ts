
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { Timestamp } from 'firebase/firestore'
import { notify } from '@/lib/notify'
import type { CreateCycleInput, Cycle } from '@/types/cycle'
import type { SnapshotDelta } from '@/hooks/useEntitySync'
import { cycleService } from '@/services/cycleService'
import { useAuthStore } from '@/store/authStore'
import { broadcastDelta, type EntityBroadcast } from '@/lib/broadcastChannel'
import { cacheKey, idb } from '@/lib/idb'

interface CycleState {
  cycles: Record<string, Cycle>

  // — sync engine binding (§6, Layer 1) —
  setAll: (docs: Cycle[]) => void
  applyDelta: (delta: SnapshotDelta<Cycle>) => void
  selectAll: () => Cycle[]

  // — peer-tab binding (§6, pipeline step 3) —
  applyBroadcast: (delta: EntityBroadcast<'cycles'>) => void

  // — optimistic mutations (§6, Layer 2) —
  createCycle: (data: CreateCycleInput) => Promise<string | undefined>
  updateCycle: (id: string, patch: Partial<Cycle>) => Promise<void>
  deleteCycle: (id: string) => Promise<void>
}

function persist(ws: string, cycles: Cycle[]) {
  return idb.set(cacheKey.cycles(ws), cycles)
}

export const useCycleStore = create<CycleState>()(
  immer((set, get) => ({
    cycles: {},

    setAll: (docs) =>
      set((s) => {
        s.cycles = {}
        for (const doc of docs) s.cycles[doc.id] = doc
      }),

    applyDelta: ({ type, doc }) =>
      set((s) => {
        if (type === 'removed') delete s.cycles[doc.id]
        else s.cycles[doc.id] = doc
      }),

    selectAll: () => Object.values(get().cycles),

    // Store only — no persist, no re-broadcast, no service call (issueStore).
    applyBroadcast: (delta) =>
      set((s) => {
        if (delta.type === 'DELETE') {
          delete s.cycles[delta.id]
          return
        }
        if (delta.type === 'CREATE') {
          s.cycles[delta.id] = delta.payload
          return
        }
        const target = s.cycles[delta.id]
        if (target) Object.assign(target, delta.payload)
      }),

    createCycle: async (data) => {
      const { user } = useAuthStore.getState()
      if (!user) return

      const tempId = `optimistic-${Date.now()}`
      const now = Timestamp.now()
      const optimistic: Cycle = {
        ...data,
        id: tempId,
        number: 0,
        createdAt: now,
        updatedAt: now,
        createdBy: user.uid,
      }

      set((s) => {
        s.cycles[tempId] = optimistic
      })
      await persist(user.workspaceId, get().selectAll())
      broadcastDelta({
        entity: 'cycles',
        workspaceId: user.workspaceId,
        type: 'CREATE',
        id: tempId,
        payload: optimistic,
      })

      try {
        const { id, number } = await cycleService.create(user.workspaceId, data)
        const created: Cycle = { ...optimistic, id, number }
        set((s) => {
          delete s.cycles[tempId]
          s.cycles[id] = created
        })
        await persist(user.workspaceId, get().selectAll())
        broadcastDelta({
          entity: 'cycles',
          workspaceId: user.workspaceId,
          type: 'DELETE',
          id: tempId,
        })
        broadcastDelta({
          entity: 'cycles',
          workspaceId: user.workspaceId,
          type: 'CREATE',
          id,
          payload: created,
        })
        return id
      } catch {
        set((s) => {
          delete s.cycles[tempId]
        })
        await persist(user.workspaceId, get().selectAll())
        broadcastDelta({
          entity: 'cycles',
          workspaceId: user.workspaceId,
          type: 'DELETE',
          id: tempId,
        })
        notify.error('Failed to create cycle', {
          action: { label: 'Retry', onClick: () => void get().createCycle(data) },
        })
      }
    },

    updateCycle: async (id, patch) => {
      const { user } = useAuthStore.getState()
      if (!user) return

      const previous = get().cycles[id]
      if (!previous) return

      set((s) => {
        Object.assign(s.cycles[id], patch)
      })
      await persist(user.workspaceId, get().selectAll())
      broadcastDelta({
        entity: 'cycles',
        workspaceId: user.workspaceId,
        type: 'UPDATE',
        id,
        payload: patch,
      })

      try {
        await cycleService.update(user.workspaceId, id, patch)
      } catch {
        set((s) => {
          s.cycles[id] = previous
        })
        await persist(user.workspaceId, get().selectAll())
        broadcastDelta({
          entity: 'cycles',
          workspaceId: user.workspaceId,
          type: 'UPDATE',
          id,
          payload: previous,
        })
        notify.error('Failed to update cycle')
      }
    },

    deleteCycle: async (id) => {
      const { user } = useAuthStore.getState()
      if (!user) return

      const previous = get().cycles[id]
      if (!previous) return

      set((s) => {
        delete s.cycles[id]
      })
      await persist(user.workspaceId, get().selectAll())
      broadcastDelta({
        entity: 'cycles',
        workspaceId: user.workspaceId,
        type: 'DELETE',
        id,
      })

      try {
        await cycleService.remove(user.workspaceId, id)
      } catch {
        set((s) => {
          s.cycles[id] = previous
        })
        await persist(user.workspaceId, get().selectAll())
        broadcastDelta({
          entity: 'cycles',
          workspaceId: user.workspaceId,
          type: 'CREATE',
          id,
          payload: previous,
        })
        notify.error('Failed to delete cycle')
      }
    },
  })),
)
