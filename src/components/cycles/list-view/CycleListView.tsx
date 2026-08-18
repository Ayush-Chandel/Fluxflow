
import { useCycleRows } from '@/hooks/useCycleSelectors'
import type { Cycle } from '@/types/cycle'
import CycleDateRail from './CycleDateRail'
import CycleListRow from './CycleListRow'

type Props = {
  onOpenCycle?: (cycle: Cycle) => void
}


function CycleListView({ onOpenCycle }: Props) {
  const rows = useCycleRows()

  return (
    <ul className='px-4 pb-10'>
      {rows.map((row) => (
        <li key={row.cycle.id} className='flex items-stretch gap-8'>
          <CycleDateRail row={row} />
          <CycleListRow row={row} onOpen={onOpenCycle} />
        </li>
      ))}
    </ul>
  )
}

export default CycleListView
