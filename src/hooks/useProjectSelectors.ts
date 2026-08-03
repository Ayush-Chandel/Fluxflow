// src/hooks/useProjectSelectors.ts — read-side helpers for the projects feature.
// Kept out of the stores (which stay pure Zustand, matching issueStore) because
// two of these derive across stores: progress and the per-project issue list are
// computed from the ISSUE store, since §4 stores no counters and no back-refs.
import { useMemo } from 'react'
import { useIssueStore } from '@/store/issueStore'
import { useProjectStore } from '@/store/projectStore'
import { projectProgress, type Progress } from '@/lib/progress'
import type { Issue } from '@/types/issue'
import type { Project } from '@/types/project'

/** All projects as a stable array — subscribes to the map, rebuilds on change. */
export function useProjectList(): Project[] {
  const projectsMap = useProjectStore((s) => s.projects)
  return useMemo(() => Object.values(projectsMap), [projectsMap])
}

/** One project by id; undefined while the cache is cold or after a delete. */
export function useProject(projectId: string | undefined): Project | undefined {
  return useProjectStore((s) => (projectId ? s.projects[projectId] : undefined))
}

/**
 * Issues belonging to a project — feed straight into IssueListView /
 * IssueKanbanView (they group + sort internally, so this stays unsorted).
 */
export function useProjectIssues(projectId: string | undefined): Issue[] {
  const issuesMap = useIssueStore((s) => s.issues)
  return useMemo(
    () =>
      projectId ? Object.values(issuesMap).filter((issue) => issue.projectId === projectId) : [],
    [issuesMap, projectId],
  )
}

/** done / total / pct for a project's issues (§4 — derived, never stored). */
export function useProjectProgress(projectId: string | undefined): Progress {
  const issuesMap = useIssueStore((s) => s.issues)
  return useMemo(
    () => projectProgress(projectId ? Object.values(issuesMap) : [], projectId ?? ''),
    [issuesMap, projectId],
  )
}
