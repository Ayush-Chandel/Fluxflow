
import { ISSUE_PRIORITIES, ISSUE_STATUSES, type Issue } from '@/types/issue'

export const FILTER_FIELDS = ['status', 'priority', 'project', 'cycle'] as const
export type FilterField = (typeof FILTER_FIELDS)[number]

export const NO_PROJECT = '__no_project__'
export const NO_CYCLE = '__no_cycle__'


export type IssueFilter = Partial<Record<FilterField, string[]>>


export function isFilterActive(filter: IssueFilter): boolean {
  return FILTER_FIELDS.some((field) => (filter[field]?.length ?? 0) > 0)
}

// Values a hand-edited URL may not invent. Entity ids can't be checked against
// a static list, so they pass through and simply match nothing when stale —
// the same tolerance ProjectPicker shows a deleted project's id (§11).
const GUARDS: Record<FilterField, (value: string) => boolean> = {
  status: (v) => (ISSUE_STATUSES as readonly string[]).includes(v),
  priority: (v) => (ISSUE_PRIORITIES as readonly string[]).includes(v),
  project: (v) => v.length > 0,
  cycle: (v) => v.length > 0,
}

export const isValidValue = (field: FilterField, value: string) => GUARDS[field](value)

function matches(selected: string[] | undefined, actual: string | null, whenNull: string): boolean {
  if (!selected || selected.length === 0) return true
  return selected.includes(actual ?? whenNull)
}

/**
 * One pass, and the SAME array reference back when nothing is filtered — a
 * caller's useMemo downstream must not invalidate just because this ran.
 */
export function filterIssues(issues: Issue[], filter: IssueFilter): Issue[] {
  if (!isFilterActive(filter)) return issues

  return issues.filter(
    (issue) =>
      // status/priority are non-nullable, so their sentinel is never reached.
      matches(filter.status, issue.status, '') &&
      matches(filter.priority, issue.priority, '') &&
      matches(filter.project, issue.projectId, NO_PROJECT) &&
      matches(filter.cycle, issue.cycleId, NO_CYCLE),
  )
}
