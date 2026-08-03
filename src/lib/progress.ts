// src/lib/progress.ts — §4: progress is DERIVED client-side, never stored.
// The whole workspace's issues already live in the issue store, so a project /
// milestone / cycle bar is a plain array pass — no Firestore query, no counter
// document to keep in sync, and nothing to migrate when an issue is reassigned.
import type { Issue } from '@/types/issue'

export interface Progress {
  done: number
  total: number
  /** 0–100, rounded. 0 when nothing matches (renders as an empty bar). */
  pct: number
}

const EMPTY: Progress = { done: 0, total: 0, pct: 0 }

/** One pass over the issues, counting `status === 'done'` against everything that matches. */
export function computeProgress(issues: Issue[], match: (issue: Issue) => boolean): Progress {
  let done = 0
  let total = 0
  for (const issue of issues) {
    if (!match(issue)) continue
    total += 1
    if (issue.status === 'done') done += 1
  }
  return total === 0 ? EMPTY : { done, total, pct: Math.round((done / total) * 100) }
}

export const projectProgress = (issues: Issue[], projectId: string) =>
  computeProgress(issues, (issue) => issue.projectId === projectId)

// Used by build order 12 / 13 — same derivation, different foreign key.
export const milestoneProgress = (issues: Issue[], milestoneId: string) =>
  computeProgress(issues, (issue) => issue.milestoneId === milestoneId)

export const cycleProgress = (issues: Issue[], cycleId: string) =>
  computeProgress(issues, (issue) => issue.cycleId === cycleId)
