import { useCycleStore } from '@/store/cycleStore'
import { useCreateCycleDialog } from '@/store/createCycleDialogStore'
import { useOpenCycle } from '@/hooks/useOpenCycle'
import { CYCLES_VIEW_ID } from '@/hooks/useCycleSelectors'
import { PlayCircleIcon } from '@/components/icons'
import ViewBar from '@/components/common/ViewBar'
import ViewSurface from '@/components/common/ViewSurface'
import ViewToggle from '@/components/common/ViewToggle'
import CycleBoardView from '@/components/cycles/kanban-view/CycleBoardView'
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

  return (
    <>
      <ViewBar>
        <ViewToggle viewId={CYCLES_VIEW_ID} className='ml-auto' />
      </ViewBar>
      <ViewSurface
        viewId={CYCLES_VIEW_ID}
        list={<CycleListView onOpenCycle={openCycle} />}
        board={<CycleBoardView onOpenCycle={openCycle} />}
      />
    </>
  )
}

export { Cycles as Component }
