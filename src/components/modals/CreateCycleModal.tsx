import { useEffect, useMemo, useRef, useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import { CalendarCheckIcon, CalendarIcon, XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toDate } from '@/lib/date'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog'
import { VisuallyHidden } from 'radix-ui'
import { PlayCircleIcon } from '../icons'
import AutoGrowTextarea from '../common/AutoGrowTextarea'
import DatePillPicker from '../common/DatePillPicker'
import ConfirmDialog from '../common/ConfirmDialog'
import { useCycleStore } from '@/store/cycleStore'
import { useCycle, useCycleList } from '@/hooks/useCycleSelectors'
import { cycleLabel, type CreateCycleInput } from '@/types/cycle'

type Props = {
  open: boolean
  prefill?: Partial<CreateCycleInput>
  editingId?: string | null
  onClose?: () => void
}

const PILL_TRIGGER =
  'gap-1.5 !h-6 rounded-full border border-edge !bg-transparent !px-2 !py-0.5 text-xs !font-normal !text-muted !shadow-none hover:!bg-elevated'

const HEADER_BTN =
  'flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-foreground'

const DAY_MS = 86_400_000
const DEFAULT_LENGTH_DAYS = 14

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS)
const startOfDay = (date: Date) => {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}


function suggestRange(latestEnd: Date | null): { start: Date; end: Date } {
  const today = startOfDay(new Date())
  const start = latestEnd && latestEnd >= today ? addDays(startOfDay(latestEnd), 1) : today
  return { start, end: addDays(start, DEFAULT_LENGTH_DAYS - 1) }
}

function CreateCycleModal({ open, prefill, editingId, onClose }: Props) {
  const createCycle = useCycleStore((s) => s.createCycle)
  const updateCycle = useCycleStore((s) => s.updateCycle)
  const cycles = useCycleList()

  const editing = useCycle(editingId ?? undefined)
  const isEditing = Boolean(editingId)

  const latestEnd = useMemo(() => {
    let latest: Date | null = null
    for (const cycle of cycles) {
      const end = toDate(cycle.endDate)
      if (end && (!latest || end > latest)) latest = end
    }
    return latest
  }, [cycles])

  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const seeded = useRef({ name: '', goal: '', start: null as Date | null, end: null as Date | null })

  useEffect(() => {
    if (!open) return

    let seed: typeof seeded.current
    if (editing) {
      seed = {
        name: editing.name ?? '',
        goal: editing.goal ?? '',
        start: toDate(editing.startDate),
        end: toDate(editing.endDate),
      }
    } else {
      const suggested = suggestRange(latestEnd)
      seed = {
        name: prefill?.name ?? '',
        goal: prefill?.goal ?? '',
        start: toDate(prefill?.startDate) ?? suggested.start,
        end: toDate(prefill?.endDate) ?? suggested.end,
      }
    }

    setName(seed.name)
    setGoal(seed.goal)
    setStartDate(seed.start)
    setEndDate(seed.end)
    seeded.current = seed
    setConfirmOpen(false)
    // Keyed on `open` + the edit target only — `prefill` is a fresh object each
    // render and re-running on its identity would wipe what the user typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingId])

  // Only what the user actually changed counts: neither the suggested range nor
  // the cycle's existing values are "dirty".
  const isDirty =
    name.trim() !== seeded.current.name.trim() ||
    goal.trim() !== seeded.current.goal.trim() ||
    startDate?.getTime() !== seeded.current.start?.getTime() ||
    endDate?.getTime() !== seeded.current.end?.getTime()

  const requestClose = () => {
    if (isDirty) setConfirmOpen(true)
    else onClose?.()
  }

  const handleStartChange = (next: Date | null) => {
    setStartDate(next)
    // Keep the range valid by carrying the length along rather than blanking the
    // end date: moving a cycle usually means moving it, not reshaping it.
    if (next && endDate && endDate <= next) setEndDate(addDays(next, DEFAULT_LENGTH_DAYS - 1))
  }

  // Both ends are required (§4) — a cycle with no range has no derived status.
  const canSubmit = Boolean(startDate && endDate && endDate > startDate)

  const handleSubmit = () => {
    if (!startDate || !endDate || !canSubmit) return

    const fields = {
      name: name.trim() || null,
      goal: goal.trim() || null,
      startDate: Timestamp.fromDate(startOfDay(startDate)),
      // Run to the very end of the closing day, so a cycle is still 'active' on
      // its last date rather than flipping to 'completed' at midnight that morning.
      endDate: Timestamp.fromDate(new Date(startOfDay(endDate).getTime() + DAY_MS - 1)),
    }

    // Branch on the INTENT (editingId), never on the resolved doc: if the cycle
    // was deleted while this form was open, `updateCycle` no-ops on the missing
    // id, whereas `editing` would have gone undefined and silently created a
    // duplicate cycle out of the edit.
    // Either way only these four fields move — `number`, the timestamps and
    // `createdBy` are never written from here.
    if (editingId) void updateCycle(editingId, fields)
    else void createCycle(fields)

    onClose?.()
  }

  const handleSubmitShortcut = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      handleSubmit()
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) requestClose()
        }}
      >
        <DialogContent
          showCloseButton={false}
          align='top'
          className={cn('mt-[10vh] w-[92vw] gap-0 rounded-3xl bg-surface p-0 sm:max-w-2xl')}
        >
          <VisuallyHidden.Root>
            <DialogTitle>{isEditing ? 'Edit cycle' : 'Create cycle'}</DialogTitle>
          </VisuallyHidden.Root>

          <div className='flex flex-col px-5 pb-4 pt-3.5'>
            <div className='flex shrink-0 items-center gap-1.5'>
              <div className='flex items-center gap-1.5 rounded-md border border-edge px-1.5 py-0.5 text-xs text-muted'>
                <PlayCircleIcon size={12} color='currentColor' />
                Cycles
              </div>
              <span className='text-xs text-muted'>›</span>
              <span className='text-xs text-foreground'>{isEditing ? (editing ? cycleLabel(editing) : 'Edit cycle') : 'New cycle'}</span>
              <div className='ml-auto flex items-center gap-1'>
                <button
                  type='button'
                  onClick={requestClose}
                  className={HEADER_BTN}
                  aria-label='Close'
                >
                  <XIcon className='h-4 w-4' />
                </button>
              </div>
            </div>

            <div className='flex flex-col px-4'>
              {/* Name is OPTIONAL — an unnamed cycle still reads as "Cycle N"
                  off its server-assigned number, which is how most teams refer
                  to them anyway. */}
              <AutoGrowTextarea
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
                maxLength={256}
                autoFocus
                placeholder='Cycle name (optional)'
                className='mt-5 w-full shrink-0 resize-none overflow-hidden bg-transparent text-[22px] font-medium text-foreground outline-none placeholder:text-muted'
              />

              <AutoGrowTextarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                onKeyDown={handleSubmitShortcut}
                maxLength={512}
                placeholder='What should this cycle achieve?'
                className='mt-1 w-full shrink-0 resize-none overflow-hidden bg-transparent text-sm text-foreground outline-none placeholder:text-muted'
              />

              <div className='mt-5 flex shrink-0 flex-wrap items-center gap-1.5'>
                <DatePillPicker
                  label='Starts'
                  heading='Start date'
                  align='start'
                  icon={<CalendarIcon className='h-3 w-3' />}
                  value={startDate}
                  onChange={handleStartChange}
                  triggerClassName={PILL_TRIGGER}
                />
                <DatePillPicker
                  label='Ends'
                  heading='End date'
                  align='end'
                  icon={<CalendarCheckIcon className='h-3 w-3' />}
                  value={endDate}
                  onChange={setEndDate}
                  min={startDate ? addDays(startDate, 1) : null}
                  triggerClassName={PILL_TRIGGER}
                />
              </div>

              <p className='mt-3 text-xs text-muted'>
                A cycle's status is worked out from these dates — it becomes active on the start
                date and completes after the end date.
              </p>
            </div>

            <div className='-mx-5 mt-5 shrink-0 border-t border-edge' />
            <div className='mt-3 flex shrink-0 items-center justify-end gap-2'>
              <Button
                variant='outline'
                onClick={requestClose}
                className='h-7 rounded-2xl border-edge bg-transparent px-3 !text-lsm text-foreground hover:bg-elevated'
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className='h-7 rounded-2xl bg-brand px-3 !text-lsm text-white hover:bg-brand-hover'
              >
                {isEditing ? 'Save changes' : 'Create cycle'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title={isEditing ? 'Discard your changes?' : 'Discard this cycle?'}
        description='Your changes will be lost.'
        confirmLabel='Discard'
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          onClose?.()
        }}
      />
    </>
  )
}

export default CreateCycleModal
