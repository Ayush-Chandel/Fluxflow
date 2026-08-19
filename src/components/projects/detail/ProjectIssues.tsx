
import { useMemo } from 'react'
import { useOpenIssue } from '@/hooks/useOpenIssue'
import { useIssueFilters } from '@/hooks/useIssueFilters'
import { filterIssues, type FilterField } from '@/lib/issueFilters'
import { projectIssuesViewId, useProjectIssues } from '@/hooks/useProjectSelectors'
import { useCreateIssueDialog } from '@/store/createIssueDialogStore'
import FilterBar from '@/components/common/FilterBar'
import NoFilterMatches from '@/components/common/NoFilterMatches'
import ViewSurface from '@/components/common/ViewSurface'
import ViewToggle from '@/components/common/ViewToggle'
import IssueKanbanView from '@/components/issues/kanban-view/IssueKanbanView'
import IssueListView from '@/components/issues/list-view/IssueListView'
import { PlusIcon } from '@/components/icons'
import type { Project } from '@/types/project'

const HIDE_PROJECT: readonly FilterField[] = ['project']

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className='flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center'>
      <div>
        <p className='text-sm font-medium text-foreground'>No issues in this project</p>
        <p className='text-lsm text-muted'>
          Pull work in from an issue's project picker, or start a new one here.
        </p>
      </div>
      <button
        type='button'
        onClick={onCreate}
        className='rounded-2xl bg-brand px-3 py-1.5 text-lsm text-white transition-colors hover:bg-brand-hover'
      >
        New issue
      </button>
    </div>
  )
}

function useCreateInProject(projectId: string) {
  const openCreateIssue = useCreateIssueDialog((s) => s.openWith)
  return () => openCreateIssue({ projectId })
}


export function ProjectIssuesBar({ project }: { project: Project }) {
  const all = useProjectIssues(project.id)
  const { filter } = useIssueFilters()
  const issues = useMemo(() => filterIssues(all, filter), [all, filter])
  const createInProject = useCreateInProject(project.id)

  return (
    <>
      {/* The count follows the filter — it describes what is on screen. */}
      <span className='tabular-nums'>
        {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
      </span>
      {all.length > 0 && <div className='ml-0.5'><FilterBar hide={HIDE_PROJECT} /></div>}
      <div className='ml-auto flex items-center gap-2'>
        <ViewToggle viewId={projectIssuesViewId(project.id)} />
        <button
            type='button'
            onClick={createInProject}
            aria-label='New issue in this project'
            className='rounded-full p-1 text-muted transition-colors hover:bg-hover hover:text-foreground'
          >
          <PlusIcon size={14} />
        </button>
      </div>
    </>
  )
}

function ProjectIssues({ project }: { project: Project }) {
  const all = useProjectIssues(project.id)
  const { filter, clear, active } = useIssueFilters()
  const issues = useMemo(() => filterIssues(all, filter), [all, filter])
  const openIssue = useOpenIssue()
  const createInProject = useCreateInProject(project.id)

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      {all.length === 0 ? (
        <EmptyState onCreate={createInProject} />
      ) : issues.length === 0 ? (
        <NoFilterMatches onClear={clear} />
      ) : (
        <ViewSurface
          viewId={projectIssuesViewId(project.id)}
          list={<IssueListView issues={issues} onOpenIssue={openIssue} sortable={!active} />}
          board={
            <IssueKanbanView
              issues={issues}
              onOpenIssue={openIssue}
              sortable={!active}
              // A column's `+` here means "new issue in THIS project", the same
              // as the `+` in the bar above — the column only adds its status.
              createPrefill={{ projectId: project.id }}
            />
          }
        />
      )}
    </div>
  )
}

export default ProjectIssues
