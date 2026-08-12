
import { cn } from '@/lib/utils'
import { formatDateShort, toDate } from '@/lib/date'
import { cycleLabel, type Cycle } from '@/types/cycle'
import type { CycleRow } from '@/hooks/useCycleSelectors'
import { CycleStatusBadge } from '../CycleStatusBadge'
import ProgressRing from '@/components/common/ProgressRing'
import { PlayCircleIcon } from '@/components/icons'
import CycleRowMenu from './CycleRowMenu'

type Props = {
  row: CycleRow
  onOpen?: (cycle: Cycle) => void
}

function CycleListRow({ row, onOpen }: Props) {
  const { cycle, status, progress } = row
  const isActive = status === 'active'

  const start = toDate(cycle.startDate)
  const end = toDate(cycle.endDate)

  return (
    <div
      role='button'
      tabIndex={0}
      onClick={() => onOpen?.(cycle)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen?.(cycle)
        }
      }}
      // The bottom border is what the rail's marker is anchored to — it doubles
      // as the row divider and as the boundary between two cycles.
      className='group flex flex-1 cursor-pointer items-center gap-3 border-b border-selected py-6 pr-2 text-lsm outline-none hover:bg-hover-subtle focus-visible:ring-1 focus-visible:ring-brand'
    >
      <PlayCircleIcon
        size={14}   
        color='currentColor'
        className={cn('shrink-0', isActive ? 'text-brand' : 'text-muted')}
      />

      <span className={cn('truncate font-medium', isActive ? 'text-foreground' : 'text-foreground')}>
        {cycleLabel(cycle)}
      </span>

      {/* The range is the cycle's real identity — its status is derived from
          exactly these two dates, so showing them explains the badge. */}
      {start && end && (
        <span className='hidden shrink-0 text-muted text-xs tabular-nums sm:inline'>
          {formatDateShort(start)} – {formatDateShort(end)}
        </span>
      )}

      {cycle.goal && <span className='min-w-0 flex-1 truncate text-muted'>{cycle.goal}</span>}
      {!cycle.goal && <span className='flex-1' />}

      <CycleStatusBadge status={status} />

      <span className='flex text-xs shrink-0 items-center gap-1.5 text-muted tabular-nums'>
        <ProgressRing pct={progress.pct} className={isActive ? 'text-brand' : 'text-muted'} />
        <div className='flex gap-[1px]'>
          <span className='text-foreground'>
          {progress.pct}
        </span>
        <span>
          %
        </span>
        </div>
      </span>

      <span className='w-20 text-xs flex justify-end gap-1 shrink-0 text-right text-muted tabular-nums'>
         <span className='text-foreground'>
          {progress.total}
        </span>
        <span>
          scope
        </span>
      </span>

      <CycleRowMenu cycle={cycle} issueCount={progress.total} />
    </div>
  )
}

export default CycleListRow
