// src/hooks/useCycleSelectors.ts — read-side helpers for cycles, the counterpart
// to useProjectSelectors. Same reason for living outside the store: progress and
// the per-cycle issue list are derived from the ISSUE store (§4 stores no
// counters), so they cross stores and don't belong to either one.
import { useMemo } from 'react'
import { useCycleStore } from '@/store/cycleStore'
import { useIssueStore } from '@/store/issueStore'
import { cycleProgress, EMPTY_PROGRESS, progressByKey, type Progress } from '@/lib/progress'
import { toDate } from '@/lib/date'
import {
  CYCLE_STATUSES,
  cycleStatusFromDates,
  type Cycle,
  type CycleQuickView,
  type CycleStatus,
} from '@/types/cycle'
import type { Issue } from '@/types/issue'

/** A cycle paired with everything a row renders, so a row touches no store. */
export interface CycleRow {
  cycle: Cycle
  status: CycleStatus
  progress: Progress
}

/** Newest first — the timeline reads top-down from the furthest-out cycle. */
const byStartDesc = (a: CycleRow, b: CycleRow) =>
  (toDate(b.cycle.startDate)?.getTime() ?? 0) - (toDate(a.cycle.startDate)?.getTime() ?? 0)

function buildRows(cyclesMap: Record<string, Cycle>, issuesMap: Record<string, Issue>): CycleRow[] {
  const progress = progressByKey(Object.values(issuesMap), 'cycleId')
  // Status is derived per render rather than memoized against a clock: it only
  // changes when a boundary is crossed, and the store churns far more often than
  // that, so a timer would buy nothing a re-render doesn't already give us.
  const now = Date.now()
  return Object.values(cyclesMap).map((cycle) => ({
    cycle,
    status: cycleStatusFromDates(cycle.startDate, cycle.endDate, now),
    progress: progress[cycle.id] ?? EMPTY_PROGRESS,
  }))
}

/** Every cycle as a row, newest-start first. The timeline list renders this. */
export function useCycleRows(): CycleRow[] {
  const cyclesMap = useCycleStore((s) => s.cycles)
  const issuesMap = useIssueStore((s) => s.issues)
  return useMemo(() => buildRows(cyclesMap, issuesMap).sort(byStartDesc), [cyclesMap, issuesMap])
}

/**
 * Rows bucketed by derived status, every column present (empty ones included) —
 * the board's input, mirroring useProjectBoardGroups.
 *
 * There is no manual ordering here and no `sortOrder` on Cycle: a cycle's column
 * IS its date range, so a cross-column drop would have to rewrite the range
 * (§9E). Columns are chronological instead — soonest-first, so the next thing to
 * happen is at the top of Upcoming and the most recent finish tops Completed.
 */
export function useCycleBoardGroups(): Record<CycleStatus, CycleRow[]> {
  const cyclesMap = useCycleStore((s) => s.cycles)
  const issuesMap = useIssueStore((s) => s.issues)

  return useMemo(() => {
    const rows = buildRows(cyclesMap, issuesMap)
    return Object.fromEntries(
      CYCLE_STATUSES.map((status) => [
        status,
        rows
          .filter((row) => row.status === status)
          .sort(status === 'completed' ? byStartDesc : (a, b) => -byStartDesc(a, b)),
      ]),
    ) as Record<CycleStatus, CycleRow[]>
  }, [cyclesMap, issuesMap])
}

/** One cycle by id; undefined while the cache is cold or after a delete. */
export function useCycle(cycleId: string | undefined): Cycle | undefined {
  return useCycleStore((s) => (cycleId ? s.cycles[cycleId] : undefined))
}


export function useQuickViewCycle(view: CycleQuickView | undefined): Cycle | undefined {
  const cyclesMap = useCycleStore((s) => s.cycles)
  return useMemo(() => (view ? pickQuickViewCycle(cyclesMap, view) : undefined), [cyclesMap, view])
}

function pickQuickViewCycle(
  cyclesMap: Record<string, Cycle>,
  view: CycleQuickView,
): Cycle | undefined {
  const wanted: CycleStatus = view === 'current' ? 'active' : 'upcoming'
  const boundary = view === 'current' ? 'endDate' : 'startDate'
  const now = Date.now()

  return Object.values(cyclesMap)
    .filter((cycle) => cycleStatusFromDates(cycle.startDate, cycle.endDate, now) === wanted)
    .sort((a, b) => (toDate(a[boundary])?.getTime() ?? 0) - (toDate(b[boundary])?.getTime() ?? 0))[0]
}

/** All cycles as a stable array — the picker's option source. */
export function useCycleList(): Cycle[] {
  const cyclesMap = useCycleStore((s) => s.cycles)
  return useMemo(() => Object.values(cyclesMap), [cyclesMap])
}

/**
 * Issues scoped into a cycle — feeds IssueListView/IssueKanbanView unsorted,
 * exactly like useProjectIssues (both views group and sort internally).
 */
export function useCycleIssues(cycleId: string | undefined): Issue[] {
  const issuesMap = useIssueStore((s) => s.issues)
  return useMemo(
    () => (cycleId ? Object.values(issuesMap).filter((issue) => issue.cycleId === cycleId) : []),
    [issuesMap, cycleId],
  )
}

/** done / total / pct for a cycle's issues (§4 — derived, never stored). */
export function useCycleProgress(cycleId: string | undefined): Progress {
  const issuesMap = useIssueStore((s) => s.issues)
  return useMemo(
    () => cycleProgress(cycleId ? Object.values(issuesMap) : [], cycleId ?? ''),
    [issuesMap, cycleId],
  )
}
