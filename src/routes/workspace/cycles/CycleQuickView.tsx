import { Link, Navigate } from 'react-router'
import CycleDetailView from '@/components/cycles/CycleDetailView'
import { PlayCircleIcon } from '@/components/icons'
import { useCycleQuickViewParam } from '@/hooks/useCycleQuickView'
import { cycleIssuesViewId, useQuickViewCycle } from '@/hooks/useCycleSelectors'
import { useCreateCycleDialog } from '@/store/createCycleDialogStore'
import type { CycleQuickView as QuickView } from '@/types/cycle'

const COPY: Record<QuickView, { title: string; hint: string }> = {
  current: {
    title: 'No active cycle',
    hint: 'Nothing is running right now — start one, or open the timeline to see what has been.',
  },
  upcoming: {
    title: 'No upcoming cycle',
    hint: 'Nothing is scheduled yet. Plan the next stretch of work into a date range.',
  },
}

function QuickViewEmpty({ view }: { view: QuickView }) {
  const openCreateCycle = useCreateCycleDialog((s) => s.openWith)
  const copy = COPY[view]

  return (
    <div className='flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center'>
      <PlayCircleIcon size={28} color='currentColor' className='text-muted' />
      <div>
        <p className='text-sm font-medium text-foreground'>{copy.title}</p>
        <p className='text-lsm text-muted'>{copy.hint}</p>
      </div>
      <div className='flex items-center gap-2'>
        <button
          type='button'
          onClick={() => openCreateCycle()}
          className='rounded-2xl bg-brand px-3 py-1.5 text-lsm text-white transition-colors hover:bg-brand-hover'
        >
          New cycle
        </button>
        <Link
          to='/app/cycles'
          className='rounded-2xl px-3 py-1.5 text-lsm text-muted transition-colors hover:bg-hover'
        >
          All cycles
        </Link>
      </div>
    </div>
  )
}


function CycleQuickView() {
  const view = useCycleQuickViewParam()

  // Only reachable if the two paths below ever drift from CYCLE_QUICK_VIEWS.
  const cycle = useQuickViewCycle(view)
  if (!view) return <Navigate to='/app/cycles' replace />

  return (
    <CycleDetailView
      cycleId={cycle?.id}
      viewId={cycleIssuesViewId(view)}
      missing={<QuickViewEmpty view={view} />}
    />
  )
}

export { CycleQuickView as Component }
