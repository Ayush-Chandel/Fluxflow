
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useProject } from '@/hooks/useProjectSelectors'
import { useProjectStore } from '@/store/projectStore'
import { Skeleton } from '@/components/ui/skeleton'
import ProjectOverview from '@/components/projects/detail/ProjectOverview'

const HYDRATION_GRACE_MS = 1200

function ProjectDetail() {
  const { id } = useParams()

  const project = useProject(id)
  const hasProjects = useProjectStore((s) => Object.keys(s.projects).length > 0)

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
    <div className='min-h-0 flex-1 overflow-y-auto'>
      <div className='mx-auto w-full max-w-2xl px-6 py-10'>
        <ProjectOverview project={project} />
      </div>
    </div>
  )
}

export { ProjectDetail as Component }
