
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { useCycle, useCycleIssues } from '@/hooks/useCycleSelectors'
import { useCycleStore } from '@/store/cycleStore'
import { useOpenIssue } from '@/hooks/useOpenIssue'
import { useCreateIssueDialog } from '@/store/createIssueDialogStore'
import { Skeleton } from '@/components/ui/skeleton'
import IssueKanbanView from '@/components/issues/kanban-view/IssueKanbanView'
import { CycleRangeChip, CycleStatusBadge } from '@/components/cycles/CycleStatusBadge'
import { cycleStatusFromDates } from '@/types/cycle'

const HYDRATION_GRACE_MS = 1200


function CycleDetail() {
  const { id } = useParams()

  const cycle = useCycle(id)
  const issues = useCycleIssues(id)
  const hasCycles = useCycleStore((s) => Object.keys(s.cycles).length > 0)

  const openIssue = useOpenIssue()
  const openCreateIssue = useCreateIssueDialog((s) => s.openWith)

  const [settledId, setSettledId] = useState<string | undefined>(undefined)
  const graceElapsed = settledId === id

  useEffect(() => {
    const timer = setTimeout(() => setSettledId(id), HYDRATION_GRACE_MS)
    return () => clearTimeout(timer)
  }, [id])

  if (!cycle) {
    // Definitive miss (deleted, or a bad id) vs. still booting — the same
    // distinction ProjectDetail draws, so neither flashes one for the other.
    if (hasCycles || graceElapsed) {
      return (
        <div className='grid min-h-0 flex-1 place-items-center text-lsm text-muted'>
          Cycle not found
        </div>
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

  // Derived per render, never stored (§4) — cheap, and correct across a
  // boundary the moment anything re-renders.
  const status = cycleStatusFromDates(cycle.startDate, cycle.endDate)

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      {/* The cycle's own facts sit beside the count, since the page itself shows
          only issues: the derived status, and the range that derives it. Above
          the empty branch on purpose — an empty cycle still has dates worth
          seeing, and they're most useful exactly when there's nothing to scope. */}
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

export { CycleDetail as Component }
