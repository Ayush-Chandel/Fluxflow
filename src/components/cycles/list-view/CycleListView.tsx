
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
    <div className='min-h-0 flex-1 overflow-y-auto'>
      {/* A list, not a table — unlike the projects view there are no columns to
          sort, and the rail is chrome rather than a cell. */}
      <ul className='px-4 pb-10'>
        {rows.map((row) => (
          <li key={row.cycle.id} className='flex items-stretch gap-8'>
            <CycleDateRail row={row} />
            <CycleListRow row={row} onOpen={onOpenCycle} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default CycleListView
