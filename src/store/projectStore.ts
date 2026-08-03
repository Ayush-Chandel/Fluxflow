import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { Timestamp } from 'firebase/firestore'
import { notify } from '@/lib/notify'
import type { CreateProjectInput, NewProjectDoc, Project } from '@/types/project'
import type { SnapshotDelta } from '@/hooks/useEntitySync'
import { projectService } from '@/services/projectService'
import { useAuthStore } from '@/store/authStore'
import { broadcastDelta } from '@/lib/broadcastChannel'
import { cacheKey, idb } from '@/lib/idb'

interface ProjectState {

  projects: Record<string, Project>
  setAll: (docs: Project[]) => void
  applyDelta: (delta: SnapshotDelta<Project>) => void
  selectAll: () => Project[]

  createProject: (data: CreateProjectInput) => Promise<string | undefined>
  updateProject: (id: string, patch: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
}


function persist(ws: string, projects: Project[]) {
  return idb.set(cacheKey.projects(ws), projects)
}

export const useProjectStore = create<ProjectState>()(
  immer((set, get) => ({
    projects: {},

    setAll: (docs) =>
      set((s) => {
        s.projects = {}
        for (const doc of docs) s.projects[doc.id] = doc
      }),

    applyDelta: ({ type, doc }) =>
      set((s) => {
        if (type === 'removed') delete s.projects[doc.id]
        else s.projects[doc.id] = doc // 'added' | 'modified' both upsert
      }),

    selectAll: () => Object.values(get().projects),

    createProject: async (data) => {
      const { user } = useAuthStore.getState()
      if (!user) return

      const id = projectService.newId(user.workspaceId)
      const now = Timestamp.now()

      const docData: NewProjectDoc = {
        ...data,
        status: data.status ?? 'backlog',
        priority: data.priority ?? 'no_priority',
        createdBy: user.uid,
      }
      const optimistic: Project = { ...docData, id, createdAt: now, updatedAt: now }

      set((s) => {
        s.projects[id] = optimistic
      })
      await persist(user.workspaceId, get().selectAll())
      broadcastDelta({ entity: 'projects', type: 'CREATE', id, payload: optimistic })

      try {
        await projectService.create(user.workspaceId, id, docData)
        return id
      } catch {
        set((s) => {
          delete s.projects[id]
        })
        await persist(user.workspaceId, get().selectAll())
        broadcastDelta({ entity: 'projects', type: 'DELETE', id })
        notify.error('Failed to create project', {
          description: docData.name,
          action: { label: 'Retry', onClick: () => void get().createProject(data) },
        })
      }
    },

    updateProject: async (id, patch) => {
      const { user } = useAuthStore.getState()
      if (!user) return

      const previous = get().projects[id]
      if (!previous) return

      set((s) => {
        Object.assign(s.projects[id], patch)
      })
      await persist(user.workspaceId, get().selectAll())
      broadcastDelta({ entity: 'projects', type: 'UPDATE', id, payload: patch })

      try {
        await projectService.update(user.workspaceId, id, patch)
      } catch {
        set((s) => {
          s.projects[id] = previous
        })
        await persist(user.workspaceId, get().selectAll())
        notify.error('Failed to update project')
      }
    },

    deleteProject: async (id) => {
      const { user } = useAuthStore.getState()
      if (!user) return

      const previous = get().projects[id]
      if (!previous) return

      set((s) => {
        delete s.projects[id]
      })
      await persist(user.workspaceId, get().selectAll())
      broadcastDelta({ entity: 'projects', type: 'DELETE', id })

      try {
        await projectService.remove(user.workspaceId, id)
      } catch {
        set((s) => {
          s.projects[id] = previous
        })
        await persist(user.workspaceId, get().selectAll())
        notify.error('Failed to delete project')
      }
    },
  })),
)
