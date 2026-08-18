
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useProject } from '@/hooks/useProjectSelectors'
import { useProjectStore } from '@/store/projectStore'
import { Skeleton } from '@/components/ui/skeleton'
import ViewBar, { ViewTabs, type ViewTab } from '@/components/common/ViewBar'
import ProjectIssues, { ProjectIssuesBar } from '@/components/projects/detail/ProjectIssues'
import ProjectOverview from '@/components/projects/detail/ProjectOverview'

const HYDRATION_GRACE_MS = 1200

type DetailTab = 'overview' | 'issues'
// Milestones stay inside Overview (§12) rather than earning a tab — the list is
// short and reads as project metadata, not as a third surface.
const TABS: ViewTab<DetailTab>[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'issues', label: 'Issues' },
]

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
      <ViewBar>
        <ViewTabs tabs={TABS} active={tab} onChange={setTab} />

        {tab === 'issues' && <ProjectIssuesBar project={project} />}
      </ViewBar>


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
