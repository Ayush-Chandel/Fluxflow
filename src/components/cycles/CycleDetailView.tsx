import { useEffect, useState, type ReactNode } from 'react'
import { useCycle, useCycleIssues } from '@/hooks/useCycleSelectors'
import { useCycleStore } from '@/store/cycleStore'
import { useOpenIssue } from '@/hooks/useOpenIssue'
import { useCreateIssueDialog } from '@/store/createIssueDialogStore'
import { Skeleton } from '@/components/ui/skeleton'
import IssueKanbanView from '@/components/issues/kanban-view/IssueKanbanView'
import { CycleRangeChip, CycleStatusBadge } from '@/components/cycles/CycleStatusBadge'
import { cycleStatusFromDates } from '@/types/cycle'

const HYDRATION_GRACE_MS = 1200

type Props = {
  cycleId: string | undefined
  missing?: ReactNode
}

function CycleDetailView({ cycleId, missing }: Props) {
  const cycle = useCycle(cycleId)
  const issues = useCycleIssues(cycleId)
  const hasCycles = useCycleStore((s) => Object.keys(s.cycles).length > 0)

  const openIssue = useOpenIssue()
  const openCreateIssue = useCreateIssueDialog((s) => s.openWith)

  const [settledFor, setSettledFor] = useState<string | null>(null)
  const graceElapsed = settledFor === (cycleId ?? '')

  useEffect(() => {
    const key = cycleId ?? ''
    const timer = setTimeout(() => setSettledFor(key), HYDRATION_GRACE_MS)
    return () => clearTimeout(timer)
  }, [cycleId])

  if (!cycle) {
    if (hasCycles || graceElapsed) {
      return (
        missing ?? (
          <div className='grid min-h-0 flex-1 place-items-center text-lsm text-muted'>
            Cycle not found
          </div>
        )
      )
    }

    return (
      <div className='px-4 py-4'>
        <Skeleton className='h-4 w-20 rounded-md' />
        <Skeleton className='mt-4 h-8 w-full rounded-md' />
        <Skeleton className='mt-2 h-8 w-full rounded-md' />
      </div>
    )
  }

  const status = cycleStatusFromDates(cycle.startDate, cycle.endDate)

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='flex shrink-0 items-center gap-2 px-4 pt-3 text-xs text-muted'>
        <span className='tabular-nums'>
          {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
        </span>
        <CycleStatusBadge status={status} />
        <CycleRangeChip cycle={cycle} />
      </div>

      {issues.length === 0 ? (
        <div className='flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center'>
          <div>
            <p className='text-sm font-medium text-foreground'>No issues in this cycle</p>
            <p className='text-lsm text-muted'>
              Scope work into it from an issue's cycle picker, or start a new one here.
            </p>
          </div>
          <button
            type='button'
            // Prefills the cycle, so the issue created from this page lands in
            // the cycle the user is looking at rather than nowhere.
            onClick={() => openCreateIssue({ cycleId: cycle.id })}
            className='rounded-2xl bg-brand px-3 py-1.5 text-lsm text-white transition-colors hover:bg-brand-hover'
          >
            New issue
          </button>
        </div>
      ) : (
        // Hardcodes the board, exactly as the Issues page does today; the
        // list⇄board switcher ships for all three surfaces in step 15.
        <IssueKanbanView issues={issues} onOpenIssue={openIssue} />
      )}
    </div>
  )
}

export default CycleDetailView
