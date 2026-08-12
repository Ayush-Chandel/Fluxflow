
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { Columns3Icon, Rows3Icon } from 'lucide-react'
import { projectIssuesViewId, useProject } from '@/hooks/useProjectSelectors'
import { useProjectStore } from '@/store/projectStore'
import { DEFAULT_PREFERENCE, useViewPreferenceStore, type LayoutMode } from '@/store/viewPreferenceStore'
import { Skeleton } from '@/components/ui/skeleton'
import ProjectIssues from '@/components/projects/detail/ProjectIssues'
import ProjectOverview from '@/components/projects/detail/ProjectOverview'

const HYDRATION_GRACE_MS = 1200

type DetailTab = 'overview' | 'issues'
const TABS: { key: DetailTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'issues', label: 'Issues' },
]

const LAYOUTS: { key: LayoutMode; label: string; Icon: typeof Rows3Icon }[] = [
  { key: 'list', label: 'List view', Icon: Rows3Icon },
  { key: 'board', label: 'Board view', Icon: Columns3Icon },
]


function DetailTabsTemp({
  projectId,
  tab,
  onTabChange,
}: {
  projectId: string
  tab: DetailTab
  onTabChange: (tab: DetailTab) => void
}) {
  const viewId = projectIssuesViewId(projectId)
  const layout = useViewPreferenceStore(
    (s) => (s.preferences[viewId] ?? DEFAULT_PREFERENCE).layout,
  )
  const setLayout = useViewPreferenceStore((s) => s.setLayout)

  return (
    <div className='flex shrink-0 items-center gap-1 border-b border-edge px-3 py-1.5'>
      {TABS.map(({ key, label }) => (
        <button
          key={key}
          type='button'
          onClick={() => onTabChange(key)}
          aria-current={tab === key ? 'page' : undefined}
          className={`rounded-lg px-2 py-1 text-lsm transition-colors ${
            tab === key ? 'bg-elevated text-foreground' : 'text-muted hover:bg-hover'
          }`}
        >
          {label}
        </button>
      ))}

      {/* Only meaningful while the issues are on screen — the Overview has no
          layout to switch. */}
      {tab === 'issues' && (
        <div className='ml-auto flex items-center gap-0.5'>
          {LAYOUTS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type='button'
              onClick={() => setLayout(viewId, key)}
              aria-label={label}
              aria-pressed={layout === key}
              className={`rounded-md p-1 transition-colors ${
                layout === key ? 'bg-elevated text-foreground' : 'text-muted hover:bg-hover'
              }`}
            >
              <Icon className='h-3.5 w-3.5' />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectDetail() {
  const { id } = useParams()

  const project = useProject(id)
  const hasProjects = useProjectStore((s) => Object.keys(s.projects).length > 0)

  // The open tab is stored WITH the project it belongs to, so navigating to
  // another project falls back to its Overview instead of inheriting the
  // previous one's tab — a derived reset, no effect and no extra render.
  const [tabState, setTabState] = useState<{ id?: string; tab: DetailTab }>({ id, tab: 'overview' })
  const tab = tabState.id === id ? tabState.tab : 'overview'
  const setTab = (next: DetailTab) => setTabState({ id, tab: next })

  const [settledId, setSettledId] = useState<string | undefined>(undefined)
  const graceElapsed = settledId === id

  useEffect(() => {
    const timer = setTimeout(() => setSettledId(id), HYDRATION_GRACE_MS)
    return () => clearTimeout(timer)
  }, [id])

  if (!project) {
    // Definitive miss (deleted, or a bad id) vs. still booting.
    if (hasProjects || graceElapsed) {
      return (
        <div className='grid min-h-0 flex-1 place-items-center text-lsm text-muted'>
          Project not found
        </div>
      )
    }

    return (
      <div className='mx-auto w-full max-w-2xl px-6 py-10'>
        <Skeleton className='h-9 w-9 rounded-xl' />
        <Skeleton className='mt-3 h-7 w-64' />
        <Skeleton className='mt-3 h-4 w-80' />
        <Skeleton className='mt-6 h-6 w-full' />
      </div>
    )
  }

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <DetailTabsTemp projectId={project.id} tab={tab} onTabChange={setTab} />

      {/* Each tab brings its own shell: the Overview is a centred column in a
          vertical scroller, while the Issues tab fills the height and scrolls
          internally (the board's columns must not sit inside a page scroller). */}
      {tab === 'overview' ? (
        <div className='min-h-0 flex-1 overflow-y-auto'>
          <div className='mx-auto w-full max-w-2xl px-6 py-10'>
            <ProjectOverview project={project} />
          </div>
        </div>
      ) : (
        <ProjectIssues project={project} />
      )}
    </div>
  )
}

export { ProjectDetail as Component }
