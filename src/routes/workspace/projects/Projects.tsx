import { useProjectStore } from '@/store/projectStore'
import { useCreateProjectDialog } from '@/store/createProjectDialogStore'
import { useOpenProject } from '@/hooks/useOpenProject'
import { PROJECTS_VIEW_ID } from '@/hooks/useProjectSelectors'
import { BoxIcon } from '@/components/icons'
import ViewBar from '@/components/common/ViewBar'
import ViewSurface from '@/components/common/ViewSurface'
import ViewToggle from '@/components/common/ViewToggle'
import ProjectKanbanView from '@/components/projects/kanban-view/ProjectKanbanView'
import ProjectListView from '@/components/projects/list-view/ProjectListView'

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className='flex h-full flex-col items-center justify-center gap-3 text-center'>
      <BoxIcon size={28} color='currentColor' />
      <div>
        <p className='text-sm font-medium text-foreground'>No projects yet</p>
        <p className='text-lsm text-muted'>Group issues toward an outcome with a target date.</p>
      </div>
      <button
        type='button'
        onClick={onCreate}
        className='rounded-2xl bg-brand px-3 py-1.5 text-lsm text-white transition-colors hover:bg-brand-hover'
      >
        New project
      </button>
    </div>
  )
}

function Projects() {
  // Only the emptiness matters here — each view derives its own rows/groups.
  const isEmpty = useProjectStore((s) => Object.keys(s.projects).length === 0)
  const openCreateProject = useCreateProjectDialog((s) => s.openWith)
  const openProject = useOpenProject()

  if (isEmpty) {
    return (
      <div className='min-h-0 flex-1 pt-2'>
        <EmptyState onCreate={() => openCreateProject()} />
      </div>
    )
  }

  return (
    <>
      <ViewBar>
        <ViewToggle viewId={PROJECTS_VIEW_ID} className='ml-auto' />
      </ViewBar>
      <ViewSurface
        viewId={PROJECTS_VIEW_ID}
        list={<ProjectListView onOpenProject={openProject} />}
        board={<ProjectKanbanView onOpenProject={openProject} />}
      />
    </>
  )
}

export { Projects as Component }
