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


function persist(ws: string, templates: Template[]) {
  return idb.set(cacheKey.templates(ws), templates)
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
        s.templates = {}
        for (const doc of docs) s.templates[doc.id] = doc
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

      set((s) => {
        s.templates[id] = optimistic
        if (demoted) s.templates[demoted.id].isDefault = false
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
          if (demoted) s.templates[demoted.id] = demoted
        })
        await persist(user.workspaceId, get().selectAll())
        broadcastDelta({
          entity: 'templates',
          workspaceId: user.workspaceId,
          type: 'DELETE',
          id,
        })
        if (demoted) {
          broadcastDelta({
            entity: 'templates',
            workspaceId: user.workspaceId,
            type: 'UPDATE',
            id: demoted.id,
            payload: { isDefault: true },
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

      set((s) => {
        Object.assign(s.templates[id], input)
        if (demoted) s.templates[demoted.id].isDefault = false
      })
      await persist(user.workspaceId, get().selectAll())
      broadcastDelta({
        entity: 'templates',
        workspaceId: user.workspaceId,
        type: 'UPDATE',
        id,
        payload: input,
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
        await templateService.update(user.workspaceId, id, input, demoted?.id)
      } catch {
        // Both affected rows go back, not just the edited one.
        set((s) => {
          s.templates[id] = previous
          if (demoted) s.templates[demoted.id] = demoted
        })
        await persist(user.workspaceId, get().selectAll())
        broadcastDelta({
          entity: 'templates',
          workspaceId: user.workspaceId,
          type: 'UPDATE',
          id,
          payload: previous,
        })
        if (demoted) {
          broadcastDelta({
            entity: 'templates',
            workspaceId: user.workspaceId,
            type: 'UPDATE',
            id: demoted.id,
            payload: { isDefault: true },
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

      set((s) => {
        s.templates[id].isDefault = isDefault
        if (demoted) s.templates[demoted.id].isDefault = false
      })
      await persist(user.workspaceId, get().selectAll())
      broadcastDelta({
        entity: 'templates',
        workspaceId: user.workspaceId,
        type: 'UPDATE',
        id,
        payload: { isDefault },
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
        // nextId null → the service only clears; clearing this id is the demote case.
        await templateService.setDefault(
          user.workspaceId,
          isDefault ? id : null,
          isDefault ? (demoted?.id ?? null) : id,
        )
      } catch {
        set((s) => {
          s.templates[id].isDefault = target.isDefault
          if (demoted) s.templates[demoted.id].isDefault = true
        })
        await persist(user.workspaceId, get().selectAll())
        broadcastDelta({
          entity: 'templates',
          workspaceId: user.workspaceId,
          type: 'UPDATE',
          id,
          payload: { isDefault: target.isDefault },
        })
        if (demoted) {
          broadcastDelta({
            entity: 'templates',
            workspaceId: user.workspaceId,
            type: 'UPDATE',
            id: demoted.id,
            payload: { isDefault: true },
          })
        }
        notify.error('Failed to update default template')
      }
    },
  })),
)
