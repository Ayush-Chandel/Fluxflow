import ProjectListView from '@/components/projects/ProjectListView'
import { useProjectRows } from '@/hooks/useProjectSelectors'
import { useCreateProjectDialog } from '@/store/createProjectDialogStore'
import { BoxIcon } from '@/components/icons'

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
  const rows = useProjectRows()
  const openCreateProject = useCreateProjectDialog((s) => s.openWith)

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='min-h-0 flex-1 overflow-y-auto pt-2'>
        {rows.length === 0 ? (
          <EmptyState onCreate={() => openCreateProject()} />
        ) : (
          // onOpenProject stays unwired until the projects/:id route exists.
          <ProjectListView rows={rows} />
        )}
      </div>
    </div>
  )
}

export { Projects as Component }
