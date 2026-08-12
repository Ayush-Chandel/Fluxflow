// src/lib/milestones.ts — milestone derivation (§4: nothing here is stored).
// Lives in lib rather than in the hook so the detail list and the projects table
// share ONE definition of milestone order and of which milestone is "current".
import { EMPTY_PROGRESS, type Progress } from '@/lib/progress'
import type { Milestone, Project } from '@/types/project'

/** A milestone plus its derived counts. */
export interface MilestoneRow {
  milestone: Milestone
  progress: Progress
}

// Module scope so the identity is stable — a fresh [] per call would invalidate
// the memos that depend on this.
const NO_MILESTONES: Milestone[] = []

/** A project's milestones as an array, in list order. */
export function sortMilestones(milestones: Project['milestones']): Milestone[] {
  if (!milestones) return NO_MILESTONES
  return Object.values(milestones).sort((a, b) => a.sortOrder - b.sortOrder)
}

/**
 * The single milestone a row leads with: the first unfinished one, in the same
 * order the detail list shows. All finished → the last one, so a completed
 * project keeps its final stage on the row instead of going blank.
 *
 * `progressById` is progressByKey(issues, 'milestoneId') — computed ONCE for the
 * whole table, never per row (that would be O(rows × issues), see progress.ts).
 */
export function currentMilestone(
  project: Project,
  progressById: Record<string, Progress>,
): MilestoneRow | null {
  const milestones = sortMilestones(project.milestones)
  if (milestones.length === 0) return null

  // A milestone with no issues in scope reads 0% and so counts as unfinished —
  // which is what "current" should mean for a stage nobody has scoped yet.
  const milestone =
    milestones.find((row) => (progressById[row.id] ?? EMPTY_PROGRESS).pct < 100) ??
    milestones[milestones.length - 1]

  return { milestone, progress: progressById[milestone.id] ?? EMPTY_PROGRESS }
}
