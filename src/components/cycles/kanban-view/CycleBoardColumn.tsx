
import { PlusIcon } from 'lucide-react'
import { CYCLE_MAP } from '@/components/common/constants/constants'
import type { CycleRow } from '@/hooks/useCycleSelectors'
import type { Cycle, CycleStatus } from '@/types/cycle'
import { useCreateCycleDialog } from '@/store/createCycleDialogStore'
import CycleCard from './CycleCard'
import { AnimatePresence } from 'motion/react'

type Props = {
  status: CycleStatus
  group: CycleRow[]
  onOpenCard?: (cycle: Cycle) => void
}

function CycleBoardColumn({ status, group, onOpenCard }: Props) {
  const openCreateCycle = useCreateCycleDialog((s) => s.openWith)

  return (
    <div className='group flex w-[318px] shrink-0 flex-col rounded-lg bg-linear-to-b from-hover-subtle to-surface px-2 pt-3'>
      <div className='flex shrink-0 items-center justify-between pb-5'>
        <div className='flex items-center gap-x-2 text-lsm text-foreground'>
          {CYCLE_MAP[status].icon}
          <span>{CYCLE_MAP[status].label}</span>
          <span>{group.length}</span>
        </div>
        <button
          type='button'
          onClick={() => openCreateCycle()}
          aria-label='New cycle'
          className='rounded text-muted transition-colors hover:text-foreground'
        >
          <PlusIcon size={12} />
        </button>
      </div>

      <div className='min-h-0 flex-1 overflow-auto pb-4'>
        <div className='space-y-2 px-2'>
          <AnimatePresence initial={false}>
            {group.map((row) => (
              <CycleCard key={row.cycle.id} row={row} onOpen={onOpenCard} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default CycleBoardColumn
