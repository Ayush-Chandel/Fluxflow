import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { Timestamp } from 'firebase/firestore'
import { notify } from '@/lib/notify'
import type {
  CreateTemplateInput,
  NewTemplateDoc,
  Template,
  TemplateType,
} from '@/types/template'
import type { SnapshotDelta } from '@/hooks/useEntitySync'
import { templateService } from '@/services/templateService'
import { useAuthStore } from '@/store/authStore'
import { broadcastDelta, type EntityBroadcast } from '@/lib/broadcastChannel'
import { cacheKey, idb } from '@/lib/idb'
import { reconcileInto, rollbackPatch, withoutOptimistic } from '@/lib/optimistic'

interface TemplateState {

  templates: Record<string, Template>
  setAll: (docs: Template[]) => void
  applyDelta: (delta: SnapshotDelta<Template>) => void
  selectAll: () => Template[]

  // — peer-tab binding (§6, pipeline step 3) —
  applyBroadcast: (delta: EntityBroadcast<'templates'>) => void

  createTemplate: (input: CreateTemplateInput) => Promise<string | undefined>
  updateTemplate: (id: string, input: CreateTemplateInput) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
  setDefault: (id: string, isDefault: boolean) => Promise<void>
}


// Templates mint their own id, so there are no placeholders to strip — the filter
// is here for uniformity with the other stores (see issueStore.persist).
function persist(ws: string, templates: Template[]) {
  return idb.set(cacheKey.templates(ws), withoutOptimistic(templates))
}


function currentDefaultId(
  templates: Record<string, Template>,
  type: TemplateType,
  exceptId?: string,
): string | null {
  const holder = Object.values(templates).find(
    (t) => t.type === type && t.isDefault && t.id !== exceptId,
  )
  return holder?.id ?? null
}

/**
 * The default template of a type, read imperatively. The create dialogs seed
 * their drafts with it as they open — which happens inside a store action, not
 * a render — so they can't use the hook form (useDefaultTemplate).
 */
export function getDefaultTemplate(type: TemplateType): Template | undefined {
  const templates = useTemplateStore.getState().templates
  const id = currentDefaultId(templates, type)
  return id ? templates[id] : undefined
}

export const useTemplateStore = create<TemplateState>()(
  immer((set, get) => ({
    templates: {},

    setAll: (docs) =>
      set((s) => {
        reconcileInto(s.templates, docs)
      }),

    applyDelta: ({ type, doc }) =>
      set((s) => {
        if (type === 'removed') delete s.templates[doc.id]
        else s.templates[doc.id] = doc // 'added' | 'modified' both upsert
      }),

    selectAll: () => Object.values(get().templates),

    applyBroadcast: (delta) =>
      set((s) => {
        if (delta.type === 'DELETE') {
          delete s.templates[delta.id]
          return
        }
        if (delta.type === 'CREATE') {
          s.templates[delta.id] = delta.payload
          return
        }
        const target = s.templates[delta.id]
        if (target) Object.assign(target, delta.payload)
      }),

    createTemplate: async (input) => {
      const { user } = useAuthStore.getState()
      if (!user) return

      const id = templateService.newId(user.workspaceId)
      const now = Timestamp.now()

      const docData: NewTemplateDoc = { ...input, createdBy: user.uid }
      // Server stamps are serverTimestamp(); Timestamp.now() is close enough that
      // the list doesn't jump when the snapshot echoes back.
      const optimistic = { ...docData, id, createdAt: now, updatedAt: now } as Template

      // A new template submitted as default demotes the incumbent, in one batch.
      const demotedId = input.isDefault ? currentDefaultId(get().templates, input.type) : null
      const demoted = demotedId ? get().templates[demotedId] : undefined
      // The demotion is a real write with its own serverTimestamp(); stamp the
      // store copy so the incumbent's "updated" reading doesn't blank out.
      const demotion: Partial<Template> = { isDefault: false, updatedAt: now }
      const undoDemotion = demoted ? rollbackPatch(demoted, demotion) : null

      set((s) => {
        s.templates[id] = optimistic
        if (demoted) Object.assign(s.templates[demoted.id], demotion)
      })
      await persist(user.workspaceId, get().selectAll())
      broadcastDelta({
        entity: 'templates',
        workspaceId: user.workspaceId,
        type: 'CREATE',
        id,
        payload: optimistic,
      })
      if (demoted) {
        broadcastDelta({
          entity: 'templates',
          workspaceId: user.workspaceId,
          type: 'UPDATE',
          id: demoted.id,
          payload: { isDefault: false },
        })
      }

      try {
        await templateService.create(user.workspaceId, id, docData, demoted?.id)
        return id
      } catch {
        set((s) => {
          delete s.templates[id]
          const incumbent = demoted && s.templates[demoted.id]
          if (incumbent && undoDemotion) Object.assign(incumbent, undoDemotion)
        })
        await persist(user.workspaceId, get().selectAll())
        broadcastDelta({
          entity: 'templates',
          workspaceId: user.workspaceId,
          type: 'DELETE',
          id,
        })
        if (demoted && undoDemotion) {
          broadcastDelta({
            entity: 'templates',
            workspaceId: user.workspaceId,
            type: 'UPDATE',
            id: demoted.id,
            payload: undoDemotion,
          })
        }
        notify.error('Failed to create template', {
          description: docData.name,
          action: { label: 'Retry', onClick: () => void get().createTemplate(input) },
        })
      }
    },

    updateTemplate: async (id, input) => {
      const { user } = useAuthStore.getState()
      if (!user) return

      const previous = get().templates[id]
      if (!previous) return

      const demotedId = input.isDefault
        ? currentDefaultId(get().templates, previous.type, id)
        : null
      const demoted = demotedId ? get().templates[demotedId] : undefined

      const now = Timestamp.now()
      // Local `updatedAt` for the store only; the service writes serverTimestamp().
      const optimistic: Partial<Template> = { ...input, updatedAt: now }
      const demotion: Partial<Template> = { isDefault: false, updatedAt: now }
      // Undo only the touched keys on each affected row, never the whole document.
      const undo = rollbackPatch(previous, optimistic)
      const undoDemotion = demoted ? rollbackPatch(demoted, demotion) : null

      set((s) => {
        Object.assign(s.templates[id], optimistic)
        if (demoted) Object.assign(s.templates[demoted.id], demotion)
      })
      await persist(user.workspaceId, get().selectAll())
      broadcastDelta({
        entity: 'templates',
        workspaceId: user.workspaceId,
        type: 'UPDATE',
        id,
        payload: optimistic,
      })
      if (demoted) {
        broadcastDelta({
          entity: 'templates',
          workspaceId: user.workspaceId,
          type: 'UPDATE',
          id: demoted.id,
          payload: demotion,
        })
      }

      try {
        // `input`, not `optimistic` — the local timestamp must not reach the wire.
        await templateService.update(user.workspaceId, id, input, demoted?.id)
      } catch {
        // Both affected rows go back, not just the edited one.
        set((s) => {
          const target = s.templates[id]
          if (target) Object.assign(target, undo)
          const incumbent = demoted && s.templates[demoted.id]
          if (incumbent && undoDemotion) Object.assign(incumbent, undoDemotion)
        })
        await persist(user.workspaceId, get().selectAll())
        broadcastDelta({
          entity: 'templates',
          workspaceId: user.workspaceId,
          type: 'UPDATE',
          id,
          payload: undo,
        })
        if (demoted && undoDemotion) {
          broadcastDelta({
            entity: 'templates',
            workspaceId: user.workspaceId,
            type: 'UPDATE',
            id: demoted.id,
            payload: undoDemotion,
          })
        }
        notify.error('Failed to update template')
      }
    },

    deleteTemplate: async (id) => {
      const { user } = useAuthStore.getState()
      if (!user) return

      const previous = get().templates[id]
      if (!previous) return

      set((s) => {
        delete s.templates[id]
      })
      await persist(user.workspaceId, get().selectAll())
      broadcastDelta({
        entity: 'templates',
        workspaceId: user.workspaceId,
        type: 'DELETE',
        id,
      })

      try {
        await templateService.remove(user.workspaceId, id)
      } catch {
        set((s) => {
          s.templates[id] = previous
        })
        await persist(user.workspaceId, get().selectAll())
        broadcastDelta({
          entity: 'templates',
          workspaceId: user.workspaceId,
          type: 'CREATE',
          id,
          payload: previous,
        })
        notify.error('Failed to delete template')
      }
    },

    setDefault: async (id, isDefault) => {
      const { user } = useAuthStore.getState()
      if (!user) return

      const target = get().templates[id]
      if (!target || target.isDefault === isDefault) return

      const demotedId = isDefault ? currentDefaultId(get().templates, target.type, id) : null
      const demoted = demotedId ? get().templates[demotedId] : undefined

      const now = Timestamp.now()
      // Local `updatedAt` for the store only; the service writes serverTimestamp().
      const promotion: Partial<Template> = { isDefault, updatedAt: now }
      const demotion: Partial<Template> = { isDefault: false, updatedAt: now }
      const undo = rollbackPatch(target, promotion)
      const undoDemotion = demoted ? rollbackPatch(demoted, demotion) : null

      set((s) => {
        Object.assign(s.templates[id], promotion)
        if (demoted) Object.assign(s.templates[demoted.id], demotion)
      })
      await persist(user.workspaceId, get().selectAll())
      broadcastDelta({
        entity: 'templates',
        workspaceId: user.workspaceId,
        type: 'UPDATE',
        id,
        payload: promotion,
      })
      if (demoted) {
        broadcastDelta({
          entity: 'templates',
          workspaceId: user.workspaceId,
          type: 'UPDATE',
          id: demoted.id,
          payload: demotion,
        })
      }

      try {
        // nextId null → the service only clears; clearing this id is the demote case.
        await templateService.setDefault(
          user.workspaceId,
          isDefault ? id : null,
          isDefault ? (demoted?.id ?? null) : id,
        )
      } catch {
        set((s) => {
          const promoted = s.templates[id]
          if (promoted) Object.assign(promoted, undo)
          const incumbent = demoted && s.templates[demoted.id]
          if (incumbent && undoDemotion) Object.assign(incumbent, undoDemotion)
        })
        await persist(user.workspaceId, get().selectAll())
        broadcastDelta({
          entity: 'templates',
          workspaceId: user.workspaceId,
          type: 'UPDATE',
          id,
          payload: undo,
        })
        if (demoted && undoDemotion) {
          broadcastDelta({
            entity: 'templates',
            workspaceId: user.workspaceId,
            type: 'UPDATE',
            id: demoted.id,
            payload: undoDemotion,
          })
        }
        notify.error('Failed to update default template')
      }
    },
  })),
)
