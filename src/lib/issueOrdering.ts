// Manual ordering for issues (list rows / kanban cards). The rules themselves —
// fractional indexing, arrayMove vs insert-after drop semantics — live in
// `lib/ordering.ts`, shared with projects; this file is the issue-typed face of
// them, so the views keep importing one module and never pass ISSUE_STATUSES in.
import { ISSUE_STATUSES, type Issue, type IssueStatus } from '@/types/issue'
import {
  getDropAfterPatch as dropAfterPatch,
  getDropPatch as dropPatch,
  getSortKey,
  orderBetween as orderBetweenItems,
  sortByOrder,
  type DropPatch,
  type OrderGroups,
} from './ordering'

/** Groups keyed by status, each already sorted — what both issue views hold. */
export type IssueGroups = OrderGroups<Issue>

export type IssueDropPatch = DropPatch<IssueStatus>

/** Explicit sortOrder, else creation time on the same epoch-millis scale. */
export const getIssueSortKey = (issue: Issue): number => getSortKey(issue)

export const sortIssues = (issues: Issue[]): Issue[] => sortByOrder(issues)

/** A key strictly between two neighbours; either side may be absent (group edge). */
export const orderBetween = (prev?: Issue, next?: Issue): number =>
  orderBetweenItems(prev, next)

/** List view: "insert directly after the hovered row" (line-indicator pattern). */
export const getDropAfterPatch = (
  active: Issue,
  overId: string,
  groups: IssueGroups,
): IssueDropPatch | null => dropAfterPatch(active, overId, groups, ISSUE_STATUSES)

/** Kanban: arrayMove semantics — the card lands in the slot it visually occupies. */
export const getDropPatch = (
  active: Issue,
  overId: string,
  groups: IssueGroups,
): IssueDropPatch | null => dropPatch(active, overId, groups, ISSUE_STATUSES)
