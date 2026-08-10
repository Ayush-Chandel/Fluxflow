
import { toDate, type TimeInput } from './date'

const ORDER_STEP = 1000

export interface Orderable<S extends string = string> {
  id: string
  status: S
  sortOrder?: number
  createdAt: TimeInput
}

/** Groups keyed by status, each already in order — the shape a board holds. */
export type OrderGroups<T> = Record<string, T[]>

/** What a drop persists: the column it landed in, and where inside it. */
export interface DropPatch<S extends string> {
  status: S
  sortOrder: number
}

// Effective sort key: explicit sortOrder wins; items never reordered fall back
// to creation time, which keeps them chronological on the same numeric scale.
export function getSortKey(item: Orderable): number {
  return item.sortOrder ?? toDate(item.createdAt)?.getTime() ?? 0
}

export function sortByOrder<T extends Orderable>(items: T[]): T[] {
  return [...items].sort((a, b) => getSortKey(a) - getSortKey(b))
}

// Key that sorts strictly between two neighbours (either side may be absent —
// start/end of a group; both absent = empty group, stay on the shared scale).
export function orderBetween(prev?: Orderable, next?: Orderable): number {
  return prev && next ? (getSortKey(prev) + getSortKey(next)) / 2
    : prev ? getSortKey(prev) + ORDER_STEP
    : next ? getSortKey(next) - ORDER_STEP
    : Date.now()
}

export function appendOrder(items: { sortOrder?: number }[]): number {
  return items.reduce((max, item) => Math.max(max, item.sortOrder ?? 0), 0) + ORDER_STEP
}

export function findGroupOf<S extends string, T>(
  groups: OrderGroups<T>,
  id: string,
  statuses: readonly S[],
  idOf: (item: T) => string,
): S | null {
  return (
    statuses.find((status) => groups[status]?.some((item) => idOf(item) === id))
    ?? (statuses.includes(id as S) ? (id as S) : null)
  )
}

// What a drop landed on: the item under the pointer plus the column that implies —
// or, when the id is a column's own (an empty column, a group header), that column.
function resolveTarget<S extends string, T extends Orderable<S>>(
  overId: string,
  groups: OrderGroups<T>,
  statuses: readonly S[],
): { status: S; overItem: T | undefined } | null {
  const overItem = Object.values(groups).flat().find((item) => item.id === overId)
  const status = overItem?.status ?? (statuses.includes(overId as S) ? (overId as S) : null)
  return status ? { status, overItem } : null
}

// "Insert directly after the hovered row" drop — the list view's line-indicator
// pattern: rows never move during the drag; a line under the hovered row marks
// the landing slot. Returns null when the drop wouldn't change anything.
export function getDropAfterPatch<S extends string, T extends Orderable<S>>(
  active: T,
  overId: string,
  groups: OrderGroups<T>, // keyed by status, each group already sorted
  statuses: readonly S[],
): DropPatch<S> | null {
  if (overId === active.id) return null

  const target = resolveTarget(overId, groups, statuses)
  if (!target) return null
  const { status, overItem } = target

  const column = groups[status] ?? []
  const without = column.filter((item) => item.id !== active.id)

  // Dropped on the group header (overId is the status itself) → top of the group.
  if (!overItem) {
    if (status === active.status && column[0]?.id === active.id) return null // already first
    return { status, sortOrder: orderBetween(undefined, without[0]) }
  }

  // Already sitting directly after the hovered row → no-op.
  const activeIdx = column.findIndex((item) => item.id === active.id)
  if (status === active.status && activeIdx !== -1 && column[activeIdx - 1]?.id === overId) return null

  const idx = without.findIndex((item) => item.id === overId)
  return { status, sortOrder: orderBetween(without[idx], without[idx + 1]) }
}

// Translate a dnd drop (the dragged item + whatever it was released over: a
// card/row id or a status-column id) into the fields to persist.
// Returns null when the drop wouldn't change anything.
export function getDropPatch<S extends string, T extends Orderable<S>>(
  active: T,
  overId: string,
  groups: OrderGroups<T>, // keyed by status, each group already sorted
  statuses: readonly S[],
): DropPatch<S> | null {
  if (overId === active.id) return null

  const target = resolveTarget(overId, groups, statuses)
  if (!target) return null
  const { status, overItem } = target

  const column = groups[status] ?? []
  const without = column.filter((item) => item.id !== active.id)

  // Dropped on the column body (not a card) → end of the column.
  let insertAt = without.length
  if (overItem) {
    insertAt = without.findIndex((item) => item.id === overItem.id)
    // Moving down within the same column lands *after* the item it displaced
    // (arrayMove semantics); moving up, or in from another column, lands before.
    const fromIdx = column.findIndex((item) => item.id === active.id)
    const overIdx = column.findIndex((item) => item.id === overItem.id)
    if (fromIdx !== -1 && fromIdx < overIdx) insertAt += 1
  }

  const prev = without[insertAt - 1]
  const next = without[insertAt]

  // Same status and same neighbours → the drop didn't move it.
  if (status === active.status) {
    const fromIdx = column.findIndex((item) => item.id === active.id)
    if (column[fromIdx - 1]?.id === prev?.id && column[fromIdx + 1]?.id === next?.id) return null
  }

  return { status, sortOrder: orderBetween(prev, next) }
}
