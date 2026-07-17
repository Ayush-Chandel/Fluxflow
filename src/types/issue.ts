// src/types/issue.ts — Issue entity contract (§4 data model)
import type { Timestamp } from 'firebase/firestore'

// Derive the union from a runtime tuple so views can iterate the values
// (columns, filters) AND get compile-time narrowing from the same source.
export const ISSUE_STATUSES = ['backlog', 'todo', 'in_progress', 'done', 'cancelled'] as const
export type IssueStatus = (typeof ISSUE_STATUSES)[number];


export const ISSUE_PRIORITIES = ['urgent', 'high', 'medium', 'low', 'no_priority'] as const
export type IssuePriority = (typeof ISSUE_PRIORITIES)[number]

export interface Issue {
  id: string
  identifier: string // 'LIN-123' — server-generated (Vercel Fn), never client-set
  title: string
  description: string
  status: IssueStatus
  priority: IssuePriority
  assigneeId: string | null
  labelIds: string[]
  projectId: string | null // issue belongs to a project
  milestoneId: string | null // issue belongs to a project milestone
  cycleId: string | null // issue scoped into a cycle
  // Manual position within a status group (fractional indexing: drops write the
  // midpoint of the new neighbours' keys).
  sortOrder?: number
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string
}

// Fields a client supplies when creating an issue. `identifier`, `id`, timestamps
// and `createdBy` are server/system-set (Vercel Fn), never passed in. `status`
// is optional — defaults to 'backlog'.
export type CreateIssueInput = Pick<
  Issue,
  'title' | 'description' | 'priority' | 'assigneeId' | 'labelIds' | 'projectId' | 'milestoneId' | 'cycleId'
> & { status?: IssueStatus }
