// Manual ordering for issues (list rows / kanban cards) via fractional indexing:
// dropping an issue writes a single `sortOrder` on it — the midpoint of its new
// neighbours' keys — so no other document ever needs rewriting.
import { ISSUE_STATUSES, type Issue, type IssueStatus } from '@/types/issue'
import { toDate } from './date'

// Gap left when dropping at a group's edge. Keys share the epoch-millis scale
// (see getIssueSortKey), so this is "1 second" of headroom — midpoint inserts
// subdivide gaps rather than consume them, so it never runs out in practice.
const ORDER_STEP = 1000

// Effective sort key: explicit sortOrder wins; issues never reordered fall back
// to creation time, which keeps them chronological on the same numeric scale.
export function getIssueSortKey(issue: Issue): number {
  return issue.sortOrder ?? toDate(issue.createdAt)?.getTime() ?? 0
}

export function sortIssues(issues: Issue[]): Issue[] {
  return [...issues].sort((a, b) => getIssueSortKey(a) - getIssueSortKey(b))
}

// Translate a dnd drop (the dragged issue + whatever it was released over: a
// card/row id or a status-column id) into the fields to persist.
// Returns null when the drop wouldn't change anything.
export function getDropPatch(
  active: Issue,
  overId: string,
  groups: Record<string, Issue[]>, // keyed by status, each group already sorted
): { status: IssueStatus; sortOrder: number } | null {
  if (overId === active.id) return null

  const overIssue = Object.values(groups).flat().find((i) => i.id === overId)
  const status = overIssue?.status
    ?? (ISSUE_STATUSES.includes(overId as IssueStatus) ? (overId as IssueStatus) : null)
  if (!status) return null

  const column = groups[status] ?? []
  const without = column.filter((i) => i.id !== active.id)

  // Dropped on the column body (not a card) → end of the column.
  let insertAt = without.length
  if (overIssue) {
    insertAt = without.findIndex((i) => i.id === overIssue.id)
    // Moving down within the same column lands *after* the item it displaced
    // (arrayMove semantics); moving up, or in from another column, lands before.
    const fromIdx = column.findIndex((i) => i.id === active.id)
    const overIdx = column.findIndex((i) => i.id === overIssue.id)
    if (fromIdx !== -1 && fromIdx < overIdx) insertAt += 1
  }

  const prev = without[insertAt - 1]
  const next = without[insertAt]

  // Same status and same neighbours → the drop didn't move it.
  if (status === active.status) {
    const fromIdx = column.findIndex((i) => i.id === active.id)
    if (column[fromIdx - 1]?.id === prev?.id && column[fromIdx + 1]?.id === next?.id) return null
  }

  const sortOrder =
    prev && next ? (getIssueSortKey(prev) + getIssueSortKey(next)) / 2
    : prev ? getIssueSortKey(prev) + ORDER_STEP
    : next ? getIssueSortKey(next) - ORDER_STEP
    : Date.now() // empty column: any key works; stay on the shared scale

  return { status, sortOrder }
}
