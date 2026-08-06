// src/hooks/useProjectSelectors.ts — read-side helpers for the projects feature.
// Kept out of the stores (which stay pure Zustand, matching issueStore) because
// two of these derive across stores: progress and the per-project issue list are
// computed from the ISSUE store, since §4 stores no counters and no back-refs.
import { useMemo } from 'react'
import { useIssueStore } from '@/store/issueStore'
import { useProjectStore } from '@/store/projectStore'
import { DEFAULT_PREFERENCE, useViewPreferenceStore } from '@/store/viewPreferenceStore'
import { EMPTY_PROGRESS, progressByKey, projectProgress, type Progress } from '@/lib/progress'
import { sortProjectRows, type ProjectRow } from '@/lib/projectSorting'
import type { Issue } from '@/types/issue'
import type { Project } from '@/types/project'

/** Default viewId for the projects table — its sort lives under this key. */
export const PROJECTS_VIEW_ID = 'projects'

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

export function useProjectRows(viewId: string = PROJECTS_VIEW_ID): ProjectRow[] {
  const projectsMap = useProjectStore((s) => s.projects)
  const issuesMap = useIssueStore((s) => s.issues)

  // Select the primitives, not getPreference() — that returns a fresh object
  // each call and would invalidate the memo on every render.
  const orderBy = useViewPreferenceStore(
    (s) => (s.preferences[viewId] ?? DEFAULT_PREFERENCE).orderBy,
  )
  const sortDir = useViewPreferenceStore(
    (s) => (s.preferences[viewId] ?? DEFAULT_PREFERENCE).sortDir ?? DEFAULT_PREFERENCE.sortDir,
  )

  return useMemo(() => {
    const progress = progressByKey(Object.values(issuesMap), 'projectId')
    const rows = Object.values(projectsMap).map((project) => ({
      project,
      progress: progress[project.id] ?? EMPTY_PROGRESS,
    }))
    return sortProjectRows(rows, orderBy, sortDir)
  }, [projectsMap, issuesMap, orderBy, sortDir])
}

/** done / total / pct for a project's issues (§4 — derived, never stored). */
export function useProjectProgress(projectId: string | undefined): Progress {
  const issuesMap = useIssueStore((s) => s.issues)
  return useMemo(
    () => projectProgress(projectId ? Object.values(issuesMap) : [], projectId ?? ''),
    [issuesMap, projectId],
  )
}
