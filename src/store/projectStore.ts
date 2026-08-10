import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { Timestamp } from 'firebase/firestore'
import { notify } from '@/lib/notify'
import type {
  CreateMilestoneInput,
  CreateProjectInput,
  Milestone,
  NewProjectDoc,
  Project,
} from '@/types/project'
import type { SnapshotDelta } from '@/hooks/useEntitySync'
import { projectService } from '@/services/projectService'
import { useAuthStore } from '@/store/authStore'
import { broadcastDelta } from '@/lib/broadcastChannel'
import { appendOrder } from '@/lib/ordering'
import { cacheKey, idb } from '@/lib/idb'

interface ProjectState {

  projects: Record<string, Project>
  setAll: (docs: Project[]) => void
  applyDelta: (delta: SnapshotDelta<Project>) => void
  selectAll: () => Project[]

  createProject: (data: CreateProjectInput) => Promise<string | undefined>
  updateProject: (id: string, patch: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  createMilestone: (projectId: string, input: CreateMilestoneInput) => Promise<string | undefined>
  updateMilestone: (
    projectId: string,
    milestoneId: string,
    patch: Partial<Milestone>,
  ) => Promise<void>
  deleteMilestone: (projectId: string, milestoneId: string) => Promise<void>
}


function persist(ws: string, projects: Project[]) {
  return idb.set(cacheKey.projects(ws), projects)
}

/** Create-project drafts → the keyed map the document stores, in typed order. */
function buildMilestoneMap(
  drafts: CreateMilestoneInput[] | undefined,
  now: Timestamp,
): Record<string, Milestone> {
  const map: Record<string, Milestone> = {}
  for (const draft of drafts ?? []) {
    const id = projectService.newMilestoneId()
    // Re-reading the partial map each time walks the shared 1000-step scale.
    map[id] = { ...draft, id, sortOrder: appendOrder(Object.values(map)), createdAt: now, updatedAt: now }
  }
  return map
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

      const { milestones, ...fields } = data

      const docData: NewProjectDoc = {
        ...fields,
        status: data.status ?? 'backlog',
        priority: data.priority ?? 'no_priority',
        milestones: buildMilestoneMap(milestones, now),
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

    // --- Milestones (map field on the project doc) ---------------------------
    // Rollback restores the milestones MAP rather than the whole project, so a
    // failed milestone write can't also revert an unrelated edit to the project
    // that landed in between.

    createMilestone: async (projectId, input) => {
      const { user } = useAuthStore.getState()
      if (!user) return

      const project = get().projects[projectId]
      if (!project) return

      const previous = project.milestones ?? {}
      const id = projectService.newMilestoneId()
      const now = Timestamp.now()
      const milestone: Milestone = {
        ...input,
        id,
        sortOrder: appendOrder(Object.values(previous)),
        createdAt: now,
        updatedAt: now,
      }

      set((s) => {
        const target = s.projects[projectId]
        if (!target) return
        if (!target.milestones) target.milestones = {}
        target.milestones[id] = milestone
      })
      await persist(user.workspaceId, get().selectAll())
      broadcastDelta({ entity: 'milestones', type: 'CREATE', id, payload: { projectId, milestone } })

      try {
        await projectService.createMilestone(user.workspaceId, projectId, milestone)
        return id
      } catch {
        set((s) => {
          const target = s.projects[projectId]
          if (target) target.milestones = previous
        })
        await persist(user.workspaceId, get().selectAll())
        broadcastDelta({ entity: 'milestones', type: 'DELETE', id, payload: { projectId } })
        notify.error('Failed to create milestone', { description: milestone.name })
      }
    },

    updateMilestone: async (projectId, milestoneId, patch) => {
      const { user } = useAuthStore.getState()
      if (!user) return

      const previous = get().projects[projectId]?.milestones?.[milestoneId]
      if (!previous) return

      // Stamped here, not in the service, so the optimistic row and the written
      // document carry the same value.
      const stamped: Partial<Milestone> = { ...patch, updatedAt: Timestamp.now() }

      set((s) => {
        const target = s.projects[projectId]?.milestones?.[milestoneId]
        if (target) Object.assign(target, stamped)
      })
      await persist(user.workspaceId, get().selectAll())
      broadcastDelta({
        entity: 'milestones',
        type: 'UPDATE',
        id: milestoneId,
        payload: { projectId, patch: stamped },
      })

      try {
        await projectService.updateMilestone(user.workspaceId, projectId, milestoneId, stamped)
      } catch {
        set((s) => {
          const milestones = s.projects[projectId]?.milestones
          if (milestones) milestones[milestoneId] = previous
        })
        await persist(user.workspaceId, get().selectAll())
        notify.error('Failed to update milestone')
      }
    },

    deleteMilestone: async (projectId, milestoneId) => {
      const { user } = useAuthStore.getState()
      if (!user) return

      const previous = get().projects[projectId]?.milestones?.[milestoneId]
      if (!previous) return

      set((s) => {
        const milestones = s.projects[projectId]?.milestones
        if (milestones) delete milestones[milestoneId]
      })
      await persist(user.workspaceId, get().selectAll())
      broadcastDelta({
        entity: 'milestones',
        type: 'DELETE',
        id: milestoneId,
        payload: { projectId },
      })

      try {
        await projectService.removeMilestone(user.workspaceId, projectId, milestoneId)
      } catch {
        set((s) => {
          const target = s.projects[projectId]
          if (!target) return
          if (!target.milestones) target.milestones = {}
          target.milestones[milestoneId] = previous
        })
        await persist(user.workspaceId, get().selectAll())
        notify.error('Failed to delete milestone')
      }
    },
  })),
)
