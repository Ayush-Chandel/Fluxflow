
import { memo } from 'react'
import { CalendarCheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateShort, toDate } from '@/lib/date'
import { cycleLabel, type Cycle } from '@/types/cycle'
import type { CycleRow } from '@/hooks/useCycleSelectors'
import ProgressBar from '@/components/common/ProgressBar'
import { PlayCircleIcon } from '@/components/icons'

type Props = {
  row: CycleRow
  onOpen?: (cycle: Cycle) => void
}

/**
 * A cycle on the board. Deliberately NOT sortable, unlike ProjectCard: a cycle's
 * column is derived from its date range (§9E), so there is no `sortOrder` to
 * write and a cross-column drop would have to silently rewrite the range. The
 * card carries no dnd-kit wiring at all rather than a disabled `useSortable`,
 * so the read-only-ness is visible in the code and not just in a flag.
 */
const CycleCard = memo(function CycleCard({ row, onOpen }: Props) {
  const { cycle, status, progress } = row

  const start = toDate(cycle.startDate)
  const end = toDate(cycle.endDate)

  return (
    <div
      onClick={() => onOpen?.(cycle)}
      className='cursor-pointer space-y-2 rounded-xl border border-edge-subtle bg-raised-high px-2.5 pb-3 pt-2 text-xs text-muted transition-colors duration-100 hover:bg-hover-subtle'
    >
      <div className='flex items-center gap-2'>
        <PlayCircleIcon
          size={14}
          color='currentColor'
          className={cn('shrink-0', status === 'active' ? 'text-brand' : 'text-muted')}
        />
        <span className='min-w-0 flex-1 truncate text-lsm text-foreground'>
          {cycleLabel(cycle)}
        </span>
      </div>

      {cycle.goal && <p className='line-clamp-2'>{cycle.goal}</p>}

      {start && end && (
        <div className='flex items-center gap-1.5'>
          <CalendarCheckIcon className='h-3.5 w-3.5 shrink-0' />
          <span className='tabular-nums'>
            {formatDateShort(start)} – {formatDateShort(end)}
          </span>
        </div>
      )}

      <ProgressBar value={progress.pct} label={`${cycleLabel(cycle)} progress`} />

      <div className='flex items-center justify-between tabular-nums'>
        <span>
          {progress.done}/{progress.total} done
        </span>
        <span>{progress.pct}%</span>
      </div>
    </div>
  )
})

export default CycleCard
