// src/lib/projectOrdering.ts — the project-typed face of `lib/ordering.ts` (§9C).
// Only the BOARD needs this: the projects table orders by whichever column is
// sorted (`lib/projectSorting.ts`), while a board column is always in manual,
// drag-defined order — the two never compete because they read different fields.
//
// These take groups of ProjectRow, not Project: the board renders rows (project
// paired with its derived progress) exactly like the table, so the view can hand
// back the same structure it holds instead of unwrapping at the drop site.
import { PROJECT_STATUSES, type Project, type ProjectStatus } from '@/types/project'
import type { ProjectRow } from '@/lib/projectSorting'
import {
  findGroupOf as findGroupOfItem,
  getDropPatch as dropPatch,
  getSortKey,
  orderBetween as orderBetweenItems,
  type DropPatch,
  type OrderGroups,
} from './ordering'

/** Board columns keyed by status, each already in manual order. */
export type ProjectGroups = OrderGroups<ProjectRow>

export type ProjectDropPatch = DropPatch<ProjectStatus>

const projectsOf = (groups: ProjectGroups): OrderGroups<Project> =>
  Object.fromEntries(
    Object.entries(groups).map(([status, rows]) => [status, rows.map((row) => row.project)]),
  )

/** Manual order within one board column — the counterpart to the table's
 *  `sortProjectRows(rows, orderBy, dir)`, which sorts by column instead. */
export function orderProjectRows(rows: ProjectRow[]): ProjectRow[] {
  return [...rows].sort((a, b) => getSortKey(a.project) - getSortKey(b.project))
}

/** Which column a card sits in mid-drag — or the column itself, for a column id.
 *  Matches on the project's id: that's what a card's dnd id is. */
export const findGroupOf = (groups: ProjectGroups, id: string): ProjectStatus | null =>
  findGroupOfItem(groups, id, PROJECT_STATUSES, (row) => row.project.id)

/** A key strictly between two cards; either side may be absent (column edge). */
export const orderBetween = (prev?: ProjectRow, next?: ProjectRow): number =>
  orderBetweenItems(prev?.project, next?.project)

/**
 * Translate a drop (the dragged project + whatever it was released over: a card
 * id or a column id, which is the status itself) into the fields to persist —
 * feed the result straight to `updateProject(id, patch)`. Null = nothing moved.
 */
export const getDropPatch = (
  active: Project,
  overId: string,
  groups: ProjectGroups,
): ProjectDropPatch | null => dropPatch(active, overId, projectsOf(groups), PROJECT_STATUSES)
