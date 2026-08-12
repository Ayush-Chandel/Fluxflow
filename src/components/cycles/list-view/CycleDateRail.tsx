
import { cn } from '@/lib/utils'
import { toDate } from '@/lib/date'
import type { CycleRow } from '@/hooks/useCycleSelectors'
import type { CycleStatus } from '@/types/cycle'

type Props = {
  row: CycleRow
}


const MARKER_TONE: Record<CycleStatus, string> = {
  active: 'border-brand bg-brand',
  completed: 'border-[oklch(0.80_0.00_264)] bg-[oklch(0.80_0.00_264)]',
  upcoming: 'border-[oklch(0.80_0.00_264)] bg-surface',
}

function CycleDateRail({ row }: Props) {
  const start = toDate(row.cycle.startDate)
  const isActive = row.status === 'active'

  return (
    <div className='relative w-14 shrink-0'>
      <div className='absolute inset-y-0 right-0 w-2'>
        <div
          className={cn(
            'absolute inset-y-0 left-1/2 w-[0.7px] -translate-x-1/2',
            isActive ? 'bg-brand' : 'bg-connect',
          )}
        />
      </div>

      <div className='absolute z-10 bottom-0 right-0 flex translate-y-1/2 items-center gap-3'>
        <span
          className={cn(
            'text-right text-[11px] leading-tight tabular-nums',
            isActive ? 'text-foreground' : 'text-muted',
          )}
        >
          {start && (
            <>
              {start.toLocaleDateString('en-US', { month: 'short' })}
              <br />
              {start.getDate()}
            </>
          )}
        </span>
        <span className={cn('size-2 shrink-0 rounded-full border', MARKER_TONE[row.status])} />
      </div>
    </div>
  )
}

export default CycleDateRail
