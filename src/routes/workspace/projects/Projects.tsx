import { useProjectStore } from '@/store/projectStore'
import { useCreateProjectDialog } from '@/store/createProjectDialogStore'
import { BoxIcon } from '@/components/icons'
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

  if (isEmpty) {
    return (
      <div className='min-h-0 flex-1 pt-2'>
        <EmptyState onCreate={() => openCreateProject()} />
      </div>
    )
  }

  // onOpenProject stays unwired until the projects/:id route exists.
  return (
    // <div className='min-h-0 flex-1 overflow-y-auto pt-2'><ProjectListView /></div>
    <div className='flex min-h-0 flex-1 flex-col'>
      <ProjectKanbanView />
    </div>
  )
}

export { Projects as Component }
