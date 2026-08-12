
import { useMemo } from 'react'
import { useIssueStore } from '@/store/issueStore'
import { useProjectStore } from '@/store/projectStore'
import { EMPTY_PROGRESS, progressByKey } from '@/lib/progress'
import { sortMilestones, type MilestoneRow } from '@/lib/milestones'
import type { Milestone } from '@/types/project'

// Re-exported from its original home so existing importers don't have to care
// that the shape now lives in lib alongside the derivation that builds it.
export type { MilestoneRow }


export function useProjectMilestoneList(projectId: string | undefined | null): Milestone[] {

  const milestonesMap = useProjectStore((s) =>
    projectId ? s.projects[projectId]?.milestones : undefined,
  )

  return useMemo(() => sortMilestones(milestonesMap), [milestonesMap])
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
