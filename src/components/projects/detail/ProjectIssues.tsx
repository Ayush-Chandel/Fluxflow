// src/components/projects/detail/ProjectIssues.tsx — the project's Issues tab.
//
// Everything the step-15 tab strip has to mount: the project-scoped issues,
// BOTH layouts, the empty state, and a create that lands in this project. The
// panel owns its layout preference under `project:<id>:issues`, so the step-15
// toggle only ever calls setLayout(viewId, …) and nothing in here changes.
//
// The two layouts need different shells, which is why the branch lives here and
// not in the caller: the list scrolls vertically, while the board must NOT sit
// in a vertical scroller (its columns scroll internally and its height is the
// viewport's).
import { useOpenIssue } from '@/hooks/useOpenIssue'
import { projectIssuesViewId, useProjectIssues } from '@/hooks/useProjectSelectors'
import { useCreateIssueDialog } from '@/store/createIssueDialogStore'
import { DEFAULT_PREFERENCE, useViewPreferenceStore } from '@/store/viewPreferenceStore'
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

function ProjectIssues({ project }: { project: Project }) {
  const issues = useProjectIssues(project.id)
  const openIssue = useOpenIssue()
  const openCreateIssue = useCreateIssueDialog((s) => s.openWith)

  // Select the primitive, not getPreference() — that returns a fresh object on
  // every call and would re-render this panel on unrelated store writes.
  const layout = useViewPreferenceStore(
    (s) => (s.preferences[projectIssuesViewId(project.id)] ?? DEFAULT_PREFERENCE).layout,
  )

  // Prefills the project so an issue created from this page lands in the one
  // the user is looking at — the same move the cycle detail's `+` makes.
  const createInProject = () => openCreateIssue({ projectId: project.id })

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      {/* Above the empty branch on purpose: the count is a fact about the
          project ("zero in scope") and the create stays reachable either way. */}
      <div className='flex shrink-0 items-center gap-2 px-4 pt-3 text-xs text-muted'>
        <span className='tabular-nums'>
          {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
        </span>
        <button
          type='button'
          onClick={createInProject}
          aria-label='New issue in this project'
          className='ml-auto rounded-full p-1 text-muted transition-colors hover:bg-hover hover:text-foreground'
        >
          <PlusIcon size={14} />
        </button>
      </div>

      {issues.length === 0 ? (
        <EmptyState onCreate={createInProject} />
      ) : layout === 'list' ? (
        <div className='min-h-0 flex-1 overflow-y-auto'>
          <IssueListView issues={issues} onOpenIssue={openIssue} />
        </div>
      ) : (
        <IssueKanbanView issues={issues} onOpenIssue={openIssue} />
      )}
    </div>
  )
}

export default ProjectIssues
