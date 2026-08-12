import { useCycleStore } from '@/store/cycleStore'
import { useCreateCycleDialog } from '@/store/createCycleDialogStore'
import { useOpenCycle } from '@/hooks/useOpenCycle'
import { PlayCircleIcon } from '@/components/icons'
import CycleListView from '@/components/cycles/list-view/CycleListView'

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className='flex h-full flex-col items-center justify-center gap-3 text-center'>
      <PlayCircleIcon size={28} color='currentColor' className='text-muted' />
      <div>
        <p className='text-sm font-medium text-foreground'>No cycles yet</p>
        <p className='text-lsm text-muted'>Time-box work into a date range and track it to done.</p>
      </div>
      <button
        type='button'
        onClick={onCreate}
        className='rounded-2xl bg-brand px-3 py-1.5 text-lsm text-white transition-colors hover:bg-brand-hover'
      >
        New cycle
      </button>
    </div>
  )
}

function Cycles() {
  const isEmpty = useCycleStore((s) => Object.keys(s.cycles).length === 0)
  const openCreateCycle = useCreateCycleDialog((s) => s.openWith)
  const openCycle = useOpenCycle()

  if (isEmpty) {
    return (
      <div className='min-h-0 flex-1 pt-2'>
        <EmptyState onCreate={() => openCreateCycle()} />
      </div>
    )
  }

  // Hardcodes the timeline, exactly as ProjectsPage hardcodes its board. The
  // list⇄board switcher ships for issues/projects/cycles together in step 15;
  // CycleBoardView is built and waiting for it.
  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <CycleListView onOpenCycle={openCycle} />
    </div>
  )
}

export { Cycles as Component }
