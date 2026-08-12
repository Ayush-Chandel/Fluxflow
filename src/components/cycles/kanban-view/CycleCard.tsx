
import { memo } from 'react'
import { CalendarCheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateShort, toDate } from '@/lib/date'
import { cycleLabel, type Cycle } from '@/types/cycle'
import type { CycleRow } from '@/hooks/useCycleSelectors'
import ProgressBar from '@/components/common/ProgressBar'
import { PlayCircleIcon } from '@/components/icons'
import { pointerDownStartedOnCardSurface } from '@/lib/openGuard'
import CycleActionsMenu from '../CycleActionsMenu'

type Props = {
  row: CycleRow
  onOpen?: (cycle: Cycle) => void
}


const CycleCard = memo(function CycleCard({ row, onOpen }: Props) {
  const { cycle, status, progress } = row

  const start = toDate(cycle.startDate)
  const end = toDate(cycle.endDate)

  return (
    <div
      data-card-surface
      onClick={() => {
        if (!pointerDownStartedOnCardSurface()) return
        onOpen?.(cycle)
      }}
      className='group cursor-pointer space-y-2 rounded-xl border border-edge-subtle bg-raised-high px-2.5 pb-3 pt-2 text-xs text-muted transition-colors duration-100 hover:bg-hover-subtle'
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
        <CycleActionsMenu cycle={cycle} issueCount={progress.total} />
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
