
import { useMemo } from 'react'
import { useIssueStore } from '@/store/issueStore'
import { EMPTY_PROGRESS, progressByKey, type Progress } from '@/lib/progress'
import type { Milestone } from '@/types/project'

export interface MilestoneRow {
  milestone: Milestone
  progress: Progress
}

// Module scope so the identity is stable — a fresh [] per render would
// invalidate the memo below on every keystroke elsewhere in the page.
const NO_MILESTONES: Milestone[] = []

export function useProjectMilestones(projectId: string | undefined): MilestoneRow[] {
  const issuesMap = useIssueStore((s) => s.issues)

  // TODO(build order 12): useMilestoneStore((s) => s.byProject[projectId] ?? [])
  const milestones = NO_MILESTONES

  return useMemo(() => {
    if (!projectId || milestones.length === 0) return []
    const progress = progressByKey(Object.values(issuesMap), 'milestoneId')
    return milestones.map((milestone) => ({
      milestone,
      progress: progress[milestone.id] ?? EMPTY_PROGRESS,
    }))
  }, [issuesMap, milestones, projectId])
}
