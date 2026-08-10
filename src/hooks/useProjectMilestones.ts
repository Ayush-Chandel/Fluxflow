
import { useMemo } from 'react'
import { useIssueStore } from '@/store/issueStore'
import { useProjectStore } from '@/store/projectStore'
import { EMPTY_PROGRESS, progressByKey, type Progress } from '@/lib/progress'
import type { Milestone } from '@/types/project'

export interface MilestoneRow {
  milestone: Milestone
  progress: Progress
}

// Module scope so the identity is stable — a fresh [] per render would
// invalidate the memos below on every keystroke elsewhere in the page.
const NO_MILESTONES: Milestone[] = []


export function useProjectMilestoneList(projectId: string | undefined | null): Milestone[] {

  const milestonesMap = useProjectStore((s) =>
    projectId ? s.projects[projectId]?.milestones : undefined,
  )

  return useMemo(() => {
    if (!milestonesMap) return NO_MILESTONES
    return Object.values(milestonesMap).sort((a, b) => a.sortOrder - b.sortOrder)
  }, [milestonesMap])
}


export function useProjectMilestones(projectId: string | undefined | null): MilestoneRow[] {
  const issuesMap = useIssueStore((s) => s.issues)
  const milestones = useProjectMilestoneList(projectId)

  return useMemo(() => {
    if (!projectId || milestones.length === 0) return []
    const progress = progressByKey(Object.values(issuesMap), 'milestoneId')
    return milestones.map((milestone) => ({
      milestone,
      progress: progress[milestone.id] ?? EMPTY_PROGRESS,
    }))
  }, [issuesMap, milestones, projectId])
}
