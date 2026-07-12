// src/types/project.ts — Project + Milestone entity contracts (§4 data model)
import type { Timestamp } from 'firebase/firestore'

export const PROJECT_STATUSES = [
  'backlog',
  'planned',
  'in_progress',
  'paused',
  'completed',
  'cancelled',
] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export interface Project {
  id: string
  name: string // required
  description: string
  icon: string
  color: string
  status: ProjectStatus
  leadId: string | null
  memberIds: string[]
  startDate: Timestamp | null
  targetDate: Timestamp | null
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string
}

// Lives at projects/{projectId}/milestones/{milestoneId} — a stage inside a project.
export interface Milestone {
  id: string
  name: string // required
  targetDate: Timestamp | null
  sortOrder: number
  createdAt: Timestamp
  updatedAt: Timestamp
}
