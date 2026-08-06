
import { cn } from '@/lib/utils'
import type { Project } from '@/types/project'
import { PROJECTS_VIEW_ID, useProjectRows } from '@/hooks/useProjectSelectors'
import { DEFAULT_PREFERENCE, useViewPreferenceStore } from '@/store/viewPreferenceStore'
import ProjectRow from './ProjectRow'
import SortHeader from '../SortHeader'
import { PROJECT_COLUMNS, PROJECT_GRID } from '../projectColumns'

type Props = {
  viewId?: string
  onOpenProject?: (project: Project) => void
}

function ProjectListView({ viewId = PROJECTS_VIEW_ID, onOpenProject }: Props) {
  // Rows come from the same viewId the header sorts by — sourcing them from a
  // parent let the two drift apart.
  const rows = useProjectRows(viewId)

  // Primitives, not getPreference() — that builds a fresh object on every call.
  const orderBy = useViewPreferenceStore(
    (s) => (s.preferences[viewId] ?? DEFAULT_PREFERENCE).orderBy,
  )
  const sortDir = useViewPreferenceStore(
    (s) => (s.preferences[viewId] ?? DEFAULT_PREFERENCE).sortDir ?? DEFAULT_PREFERENCE.sortDir,
  )

  return (
    <div role='table' aria-label='Projects' className='pl-8 pr-4 pb-6 pt-2'>
      {/* Sticky inside the page's scroll container. */}
      <div
        role='row'
        className={cn(
          PROJECT_GRID,
          'sticky top-0 z-10 h-9 bg-surface text-lsm pl-0',
        )}
      >
        {PROJECT_COLUMNS.map((column) => (
          <SortHeader
            key={column.id}
            column={column}
            viewId={viewId}
            orderBy={orderBy}
            sortDir={sortDir}
          />
        ))}
      </div>

      <div className='mt-1'>
        {rows.map(({ project, progress }) => (
          <ProjectRow
            key={project.id}
            project={project}
            progress={progress}
            onOpen={onOpenProject ? () => onOpenProject(project) : undefined}
          />
        ))}
      </div>
    </div>
  )
}

export default ProjectListView
