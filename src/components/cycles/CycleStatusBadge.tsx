
import { cn } from '@/lib/utils'
import { formatDateShort, toDate } from '@/lib/date'
import { CYCLE_MAP } from '@/components/common/constants/constants'
import type { Cycle, CycleStatus } from '@/types/cycle'


const BADGE_TONE: Record<CycleStatus, string> = {
  active: 'bg-brand/10 text-brand',
  upcoming: 'bg-elevated text-muted',
  completed: 'bg-elevated text-muted',
}

const CHIP = 'shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium'

export function CycleStatusBadge({ status, className }: { status: CycleStatus; className?: string }) {
  return <span className={cn(CHIP, BADGE_TONE[status], className)}>{CYCLE_MAP[status].label}</span>
}

export function CycleRangeChip({ cycle, className }: { cycle: Cycle; className?: string }) {
  const start = toDate(cycle.startDate)
  const end = toDate(cycle.endDate)
  if (!start || !end) return null

  return (
    <span className={cn(CHIP, 'bg-elevated text-muted tabular-nums', className)}>
      {formatDateShort(start)} → {formatDateShort(end)}
    </span>
  )
}
