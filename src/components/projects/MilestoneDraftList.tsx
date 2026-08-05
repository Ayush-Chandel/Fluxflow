import { useEffect, useRef } from 'react'
import { CalendarCheckIcon, MilestoneIcon, PlusIcon, XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import DatePillPicker from '../common/DatePillPicker'

export type MilestoneDraft = {
  /** Client-only React key. The Firestore id is assigned when the row is saved. */
  key: string
  name: string
  targetDate: Date | null
}

type MilestoneDraftListProps = {
  milestones: MilestoneDraft[]
  onChange: (next: MilestoneDraft[]) => void
  className?: string
}

const ROW_PILL =
  'gap-1.5 !h-6 rounded-full border border-edge !bg-transparent !px-2 !py-0.5 text-xs !font-normal !text-muted !shadow-none hover:!bg-elevated'

function newDraft(): MilestoneDraft {
  return { key: crypto.randomUUID(), name: '', targetDate: null }
}

/**
 * The Milestones block of the create-project form: rows are drafted here and
 * handed back to the parent as plain state.
 *
 * NOTE: nothing persists these yet — `projects/{id}/milestones` and its service
 * land in build order 12, so the parent currently drops the drafts on create.
 */
function MilestoneDraftList({ milestones, onChange, className }: MilestoneDraftListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  // Focus can't move until the new row has rendered, so the key is parked here
  // and consumed after the commit. A ref rather than state: this drives an
  // imperative DOM call, and re-rendering for it would be a wasted pass.
  const focusKey = useRef<string | null>(null)

  useEffect(() => {
    const key = focusKey.current
    if (!key) return
    focusKey.current = null
    listRef.current?.querySelector<HTMLInputElement>(`[data-milestone-key="${key}"]`)?.focus()
  }, [milestones])

  const addAt = (index: number) => {
    const draft = newDraft()
    const next = [...milestones]
    next.splice(index, 0, draft)
    onChange(next)
    focusKey.current = draft.key
  }

  const patchAt = (index: number, patch: Partial<MilestoneDraft>) => {
    onChange(milestones.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const removeAt = (index: number) => {
    onChange(milestones.filter((_, i) => i !== index))
    // Land on the previous row so a run of Backspaces keeps deleting upward.
    const previous = milestones[index - 1]
    if (previous) focusKey.current = previous.key
  }

  return (
    <div className={cn('rounded-xl border border-edge', className)}>
      {/* Header — doubles as the add button so an empty block is still one click */}
      <div className='flex items-center justify-between gap-2 px-3.5 py-2.5'>
        <span className='text-lsm text-muted'>Milestones</span>
        <button
          type='button'
          aria-label='Add milestone'
          onClick={() => addAt(milestones.length)}
          className='flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-foreground'
        >
          <PlusIcon className='h-4 w-4' />
        </button>
      </div>

      {milestones.length > 0 && (
        <div ref={listRef} className='border-t border-edge-subtle'>
          {milestones.map((milestone, index) => (
            <div
              key={milestone.key}
              className='flex items-center gap-2 border-b border-edge-subtle px-3.5 py-2 last:border-b-0'
            >
              <MilestoneIcon className='h-3.5 w-3.5 shrink-0 text-muted' />

              <input
                data-milestone-key={milestone.key}
                value={milestone.name}
                onChange={(e) => patchAt(index, { name: e.target.value })}
                onKeyDown={(e) => {
                  // Plain Enter continues the list; Cmd/Ctrl+Enter is left alone
                  // so the parent's submit shortcut still works from here.
                  if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
                    e.preventDefault()
                    addAt(index + 1)
                  }
                  // Backspace in an already-empty row deletes it, the way a list
                  // editor behaves — no need to reach for the X.
                  if (e.key === 'Backspace' && milestone.name === '') {
                    e.preventDefault()
                    removeAt(index)
                  }
                }}
                maxLength={128}
                placeholder='Milestone name'
                className='min-w-0 flex-1 bg-transparent text-lsm text-foreground outline-none placeholder:text-muted'
              />

              <DatePillPicker
                label='Target'
                heading='Milestone target date'
                align='end'
                icon={<CalendarCheckIcon className='h-3 w-3' />}
                value={milestone.targetDate}
                onChange={(targetDate) => patchAt(index, { targetDate })}
                triggerClassName={ROW_PILL}
              />

              <button
                type='button'
                aria-label='Remove milestone'
                onClick={() => removeAt(index)}
                className='flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-foreground'
              >
                <XIcon className='h-3.5 w-3.5' />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MilestoneDraftList
