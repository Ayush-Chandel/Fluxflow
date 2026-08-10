// src/lib/progress.ts — §4: progress is DERIVED client-side, never stored.
// The whole workspace's issues already live in the issue store, so a project /
// milestone / cycle bar is a plain array pass — no Firestore query, no counter
// document to keep in sync, and nothing to migrate when an issue is reassigned.
import type { Issue } from '@/types/issue'

export interface Progress {
  done: number
  /** Issues IN SCOPE — cancelled ones are excluded, see `inScope` below. */
  total: number
  /** 0–100, rounded. 0 when nothing matches (renders as an empty bar). */
  pct: number
}

export const EMPTY_PROGRESS: Progress = { done: 0, total: 0, pct: 0 }

const EMPTY = EMPTY_PROGRESS

// The two halves of the ratio, defined ONCE: both loops below count with these,
// so the rule can't drift between the single-id and the by-key implementation.
//
// Cancelled issues are out of scope entirely — neither done nor outstanding.
// Counting them in the denominator (as this did until 2026-08-10) meant
// abandoning any issue permanently capped its project below 100%: 4 done + 1
// cancelled read 80% forever. Linear treats cancelled as removed from scope
// rather than as unfinished work, and so do we.
const inScope = (issue: Issue) => issue.status !== 'cancelled'
const isDone = (issue: Issue) => issue.status === 'done'

/** One pass over the issues, counting done against everything in scope that matches. */
export function computeProgress(issues: Issue[], match: (issue: Issue) => boolean): Progress {
  let done = 0
  let total = 0
  for (const issue of issues) {
    if (!match(issue) || !inScope(issue)) continue
    total += 1
    if (isDone(issue)) done += 1
  }
  return total === 0 ? EMPTY : { done, total, pct: Math.round((done / total) * 100) }
}

export const projectProgress = (issues: Issue[], projectId: string) =>
  computeProgress(issues, (issue) => issue.projectId === projectId)

/** Which foreign key on an issue the progress is bucketed by. */
export type ProgressKey = 'projectId' | 'milestoneId' | 'cycleId'

/**
 * Progress for EVERY id in one pass, keyed by that id. A table should use this
 * once instead of calling projectProgress() per row — that would be O(rows ×
 * issues) and would re-scan the whole workspace for each visible row.
 * Ids with no issues are simply absent; callers fall back to EMPTY_PROGRESS.
 * Same scope rule as computeProgress — an id whose issues are ALL cancelled is
 * absent here too, and so reads 0/0 rather than 0%-of-something.
 */
export function progressByKey(issues: Issue[], key: ProgressKey): Record<string, Progress> {
  const counts: Record<string, { done: number; total: number }> = {}

  for (const issue of issues) {
    const id = issue[key]
    if (!id || !inScope(issue)) continue
    let bucket = counts[id]
    if (!bucket) {
      bucket = { done: 0, total: 0 }
      counts[id] = bucket
    }
    bucket.total += 1
    if (isDone(issue)) bucket.done += 1
  }

  const result: Record<string, Progress> = {}
  for (const [id, { done, total }] of Object.entries(counts)) {
    result[id] = { done, total, pct: Math.round((done / total) * 100) }
  }
  return result
}

// Used by build order 12 / 13 — same derivation, different foreign key.
export const milestoneProgress = (issues: Issue[], milestoneId: string) =>
  computeProgress(issues, (issue) => issue.milestoneId === milestoneId)

export const cycleProgress = (issues: Issue[], cycleId: string) =>
  computeProgress(issues, (issue) => issue.cycleId === cycleId)
