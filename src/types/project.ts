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
  description: string
  icon: string
  color: string
  status: ProjectStatus
  priority: ProjectPriority
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

// Fields a client supplies when creating a project — mirrors CreateIssueInput.
// `id` is client-generated (Firestore auto-id via doc(), §6) and timestamps /
// `createdBy` are stamped by the store+service, never passed in. `status` and
// `priority` are optional — they default to 'backlog' / 'no_priority'.
export type CreateProjectInput = Pick<
  Project,
  'name' | 'description' | 'icon' | 'color' | 'leadId' | 'memberIds' | 'startDate' | 'targetDate'
> & { status?: ProjectStatus; priority?: ProjectPriority }

// The exact document body written to Firestore on create: the user fields plus
// the ones the client owns after defaulting. Timestamps are added by the service
// (serverTimestamp) and `id` is the doc key, so neither is stored in the document.
export type NewProjectDoc = CreateProjectInput & {
  status: ProjectStatus
  priority: ProjectPriority
  createdBy: string
}
