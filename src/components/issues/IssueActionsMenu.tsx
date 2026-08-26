import { useState } from 'react'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { MoreIcon } from '@/components/icons'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useIssueStore } from '@/store/issueStore'
import type { Issue } from '@/types/issue'

type Props = {
  issue: Issue
}

const ITEM =
  'flex w-full items-center rounded-md px-2 py-1.5 text-left text-lsm text-foreground transition-colors hover:bg-hover-subtle'

function IssueActionsMenu({ issue }: Props) {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const deleteIssue = useIssueStore((s) => s.deleteIssue)

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type='button'
            aria-label={`Actions for ${issue.identifier}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded-md text-muted transition-colors',
              'hover:bg-elevated hover:text-foreground',
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
            className={cn(ITEM, 'text-destructive hover:bg-destructive/10')}
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
              setConfirmOpen(true)
            }}
          >
            Delete issue
          </button>
        </PopoverContent>
      </Popover>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete ${issue.identifier}?`}
        description='This issue will be permanently deleted.'
        confirmLabel='Delete'
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          void deleteIssue(issue.id)
        }}
      />
    </>
  )
}

export default IssueActionsMenu
