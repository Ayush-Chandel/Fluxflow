
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { MoreIcon } from '@/components/icons'
import { useCreateCycleDialog } from '@/store/createCycleDialogStore'
import { useCycleStore } from '@/store/cycleStore'
import { cycleLabel, type Cycle } from '@/types/cycle'

type Props = {
  cycle: Cycle
  /** Issues that would be left pointing at a deleted cycle — named in the confirm. */
  issueCount: number
}

const ITEM =
  'flex w-full items-center rounded-md px-2 py-1.5 text-left text-lsm text-foreground transition-colors hover:bg-hover-subtle'

/**
 * The row's ⋯ menu. Editing a cycle happens HERE, in the create modal reopened
 * with the cycle's values — opening a cycle navigates to its issues instead, so
 * there is no detail form to put these actions on.
 *
 * Every handler stops propagation: the whole row is a button that opens the
 * cycle, and a menu click must not also navigate.
 */
function CycleRowMenu({ cycle, issueCount }: Props) {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const openForEdit = useCreateCycleDialog((s) => s.openForEdit)
  const deleteCycle = useCycleStore((s) => s.deleteCycle)

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type='button'
            aria-label={`Actions for ${cycleLabel(cycle)}`}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded-md text-muted transition-colors',
              'hover:bg-elevated hover:text-foreground',
              // Hidden until the row is hovered, but kept focusable and lit while
              // its own menu is open — opacity doesn't block pointer events, so
              // this never costs the row a click target.
              'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100',
            )}
          >
            <MoreIcon size={14} />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align='end'
          side='bottom'
          onClick={(e) => e.stopPropagation()}
          className='w-44 rounded-xl border-edge bg-surface p-1 shadow-lg'
        >
          <button
            type='button'
            className={ITEM}
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
              openForEdit(cycle.id)
            }}
          >
            Edit cycle
          </button>
          <button
            type='button'
            className={cn(ITEM, 'text-destructive hover:bg-destructive/10')}
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
              setConfirmOpen(true)
            }}
          >
            Delete cycle
          </button>
        </PopoverContent>
      </Popover>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete ${cycleLabel(cycle)}?`}
        // Deleting does NOT clear cycleId on its issues — the same no-cascade
        // rule projects and milestones follow, so say what actually happens.
        description={
          issueCount > 0
            ? `${issueCount} ${issueCount === 1 ? 'issue' : 'issues'} will be left without a cycle. The issues themselves are not deleted.`
            : 'This cycle has no issues.'
        }
        confirmLabel='Delete'
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          void deleteCycle(cycle.id)
        }}
      />
    </>
  )
}

export default CycleRowMenu
