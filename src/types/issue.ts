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
  // The ONLY stored history in the model (§4). `updatedAt` is last-write-wins, so
  // without these a todo → in_progress → done issue loses its start forever and
  // nothing can reconstruct it later. Stamped by lib/statusStamps.ts, never by
  // hand. Optional because every issue written before they existed lacks them.
  startedAt?: Timestamp | null // first move into in_progress OR done; never cleared
  completedAt?: Timestamp | null // move into done; cleared on reopen
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string
  // Idempotency key: the client mints it, api/createIssue stores it verbatim, and
  // issueStore.applyDelta uses it to recognise an incoming document as the one a
  // local placeholder is standing in for (lib/optimistic). Server-written and
  // immutable afterwards, exactly like `identifier` — firestore.rules keeps it
  // off issueMutable(), so a client can never change it. Optional: every issue
  // written before it existed lacks it, and it is null for anything the UI
  // didn't create optimistically.
  clientRequestId?: string | null
}

// Fields a client supplies when creating an issue. `identifier`, `id`, timestamps
// and `createdBy` are server/system-set (Vercel Fn), never passed in. `status`
// is optional — defaults to 'backlog'.
export type CreateIssueInput = Pick<
  Issue,
  'title' | 'description' | 'priority' | 'assigneeId' | 'labelIds' | 'projectId' | 'milestoneId' | 'cycleId'
> & { status?: IssueStatus }


export const PILL_TRIGGER =
  'gap-1.5 !h-6 rounded-full border border-edge !bg-transparent !px-2 !py-0.5 text-xs !font-normal !text-muted !shadow-none hover:!bg-elevated'

export const HEADER_BTN =
  'flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-foreground'