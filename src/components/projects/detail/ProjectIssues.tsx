
import { useOpenIssue } from '@/hooks/useOpenIssue'
import { projectIssuesViewId, useProjectIssues } from '@/hooks/useProjectSelectors'
import { useCreateIssueDialog } from '@/store/createIssueDialogStore'
import ViewSurface from '@/components/common/ViewSurface'
import ViewToggle from '@/components/common/ViewToggle'
import IssueKanbanView from '@/components/issues/kanban-view/IssueKanbanView'
import IssueListView from '@/components/issues/list-view/IssueListView'
import { PlusIcon } from '@/components/icons'
import type { Project } from '@/types/project'

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
  const issues = useProjectIssues(project.id)
  const createInProject = useCreateInProject(project.id)

  return (
    <>
      <span className='tabular-nums'>
        {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
      </span>
      <div className='ml-auto flex items-center gap-1'>
        <button
          type='button'
          onClick={createInProject}
          aria-label='New issue in this project'
          className='rounded-full p-1 text-muted transition-colors hover:bg-hover hover:text-foreground'
        >
          <PlusIcon size={14} />
        </button>
        <ViewToggle viewId={projectIssuesViewId(project.id)} />
      </div>
    </>
  )
}

function ProjectIssues({ project }: { project: Project }) {
  const issues = useProjectIssues(project.id)
  const openIssue = useOpenIssue()
  const createInProject = useCreateInProject(project.id)

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      {issues.length === 0 ? (
        <EmptyState onCreate={createInProject} />
      ) : (
        <ViewSurface
          viewId={projectIssuesViewId(project.id)}
          list={<IssueListView issues={issues} onOpenIssue={openIssue} />}
          board={<IssueKanbanView issues={issues} onOpenIssue={openIssue} />}
        />
      )}
    </div>
  )
}

export default ProjectIssues
