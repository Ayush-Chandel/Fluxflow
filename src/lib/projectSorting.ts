// src/lib/projectSorting.ts — column sorting for the projects table (§9C).
// Kept out of the view so the header buttons only have to say WHICH column is
// sorted (viewPreferenceStore.toggleSort) and never how a column compares.
//
// Two rules the UI can rely on:
//  · Missing values always sort LAST, in both directions — an empty Lead or
//    Target date never buries the rows that actually have one.
//  · The sort is stable on ties, falling back to creation order.
import { ISSUE_PRIORITIES } from '@/types/issue'
import { PROJECT_STATUSES, type Project } from '@/types/project'
import type { OrderBy, SortDir } from '@/store/viewPreferenceStore'
import { toDate } from '@/lib/date'
import type { Progress } from '@/lib/progress'

/** A table row: the project plus its derived counts, computed once by the hook. */
export interface ProjectRow {
  project: Project
  progress: Progress
}

// Both unions are declared in workflow order, so the tuple index IS the rank:
// urgent(0) → no_priority(4), backlog(0) → cancelled(4).
const priorityRank = (project: Project) => ISSUE_PRIORITIES.indexOf(project.priority)
const statusRank = (project: Project) => PROJECT_STATUSES.indexOf(project.status)

const millis = (value: Parameters<typeof toDate>[0]) => toDate(value)?.getTime() ?? null

/** The comparable value for a column — null means "no value" (always sorts last). */
function sortValue({ project, progress }: ProjectRow, orderBy: OrderBy): string | number | null {
  switch (orderBy) {
    // 'title' is the issue table's wording for the same column.
    case 'name':
    case 'title':
      return project.name.trim().toLowerCase() || null
    case 'priority':
      return priorityRank(project)
    case 'status':
      return statusRank(project)
    // Raw id for now — swap to the member's name once a member entity exists.
    case 'lead':
      return project.leadId
    case 'target':
      return millis(project.targetDate)
    case 'issues':
      return progress.total
    case 'progress':
      return progress.pct
    case 'updated':
      return millis(project.updatedAt)
    // Projects carry no `sortOrder` (unlike issues), so 'manual' has nothing to
    // read and behaves as 'created' — newest ordering is the only manual-free default.
    case 'created':
    case 'manual':
    default:
      return millis(project.createdAt)
  }
}

// Columns whose natural comparator order runs opposite to how the column reads
// in the table. Every numeric column agrees with `asc` out of the box (earliest
// date, fewest issues, most-urgent priority first), but the alphabetical one
// landed Z→A under the same flag — so it gets its own flip rather than moving
// the arrow, which would have broken all the others.
const REVERSED_COLUMNS = new Set<OrderBy>(['name', 'title'])

function compare(a: string | number | null, b: string | number | null): number {
  if (a === null && b === null) return 0
  if (a === null) return 1 // nulls last…
  if (b === null) return -1 // …regardless of direction (applied by the caller)
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b)
  return (a as number) - (b as number)
}

export function sortProjectRows(rows: ProjectRow[], orderBy: OrderBy, dir: SortDir): ProjectRow[] {
  const factor = (dir === 'desc' ? -1 : 1) * (REVERSED_COLUMNS.has(orderBy) ? -1 : 1)

  return [...rows].sort((rowA, rowB) => {
    const a = sortValue(rowA, orderBy)
    const b = sortValue(rowB, orderBy)

    // Absent values are pinned to the bottom before the direction is applied.
    if (a === null || b === null) return compare(a, b)

    const result = compare(a, b)
    if (result !== 0) return result * factor

    // Stable tie-break so equal cells never shuffle between renders.
    return compare(millis(rowA.project.createdAt), millis(rowB.project.createdAt))
  })
}
