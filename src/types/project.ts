// src/types/project.ts — Project + Milestone entity contracts (§4 data model)
import type { Timestamp } from 'firebase/firestore'
import { ISSUE_PRIORITIES, type IssuePriority } from '@/types/issue'

export const PROJECT_STATUSES = [
  'backlog',
  'planned',
  'in_progress',
  'completed',
  'cancelled',
] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

// Projects use the SAME priority scale as issues — one vocabulary across the
// app, so PRIORITY_MAP and the existing picker work unchanged. Aliased rather
// than re-declared so the two can never drift apart.
export const PROJECT_PRIORITIES = ISSUE_PRIORITIES
export type ProjectPriority = IssuePriority

export interface Project {
  id: string
  name: string // required
  /** One-line summary — what list rows and hover cards show. */
  description: string
  /** Long-form project brief. Plain text for now; the editor lands later. */
  content: string
  icon: string
  color: string
  status: ProjectStatus
  priority: ProjectPriority
  leadId: string | null
  memberIds: string[]
  startDate: Timestamp | null
  targetDate: Timestamp | null
  sortOrder?: number
  milestones?: Record<string, Milestone>
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string
}

export interface Milestone {
  id: string
  name: string // required
  /** Free-text note under the name in the project's milestone list. */
  description: string
  targetDate: Timestamp | null
  sortOrder: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type CreateMilestoneInput = Pick<Milestone, 'name' | 'description' | 'targetDate'>


export type CreateProjectInput = Pick<
  Project,
  | 'name'
  | 'description'
  | 'content'
  | 'icon'
  | 'color'
  | 'leadId'
  | 'memberIds'
  | 'startDate'
  | 'targetDate'
> & {
  status?: ProjectStatus
  priority?: ProjectPriority
  milestones?: CreateMilestoneInput[]
}

export type NewProjectDoc = Omit<CreateProjectInput, 'milestones'> & {
  status: ProjectStatus
  priority: ProjectPriority
  milestones: Record<string, Milestone>
  createdBy: string
}
