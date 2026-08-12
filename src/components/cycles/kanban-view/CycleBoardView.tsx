
import { CYCLE_STATUSES, type Cycle } from '@/types/cycle'
import { useCycleBoardGroups } from '@/hooks/useCycleSelectors'
import CycleBoardColumn from './CycleBoardColumn'

type Props = {
  onOpenCycle?: (cycle: Cycle) => void
}


function CycleBoardView({ onOpenCycle }: Props) {
  const groups = useCycleBoardGroups()

  return (
    <div className='flex min-h-0 flex-1 gap-x-2 overflow-x-auto pl-3 pr-2 pt-4'>
      {CYCLE_STATUSES.map((status) => (
        <CycleBoardColumn
          key={status}
          status={status}
          group={groups[status] ?? []}
          onOpenCard={onOpenCycle}
        />
      ))}
    </div>
  )
}

export default CycleBoardView
