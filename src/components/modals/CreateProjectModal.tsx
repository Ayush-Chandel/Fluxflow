import { useRef, useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import { CalendarCheckIcon, CalendarIcon, XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toDate } from '@/lib/date'
import { Button } from '@/components/ui/button'
import {
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  type CreateProjectInput,
  type ProjectPriority,
  type ProjectStatus,
} from '@/types/project'
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog'
import { VisuallyHidden } from 'radix-ui'
import { BoxIcon } from '../icons'
import ProjectIconPicker from '../common/ProjectIconPicker'
import AutoGrowTextarea from '../common/AutoGrowTextarea'
import DatePillPicker from '../common/DatePillPicker'
import IssueCommandBox from '../issues/IssueCommandBox'
import MilestoneDraftList, { type MilestoneDraft } from '../projects/MilestoneDraftList'
import { PRIORITY_MAP, PROJECT_MAP } from '../common/constants/constants'
import {
  DEFAULT_PROJECT_COLOR,
  DEFAULT_PROJECT_ICON,
} from '../common/constants/projectIcons'
import { useProjectStore } from '@/store/projectStore'

type CreateProjectModalProps = {
    open:boolean;
    /** Fields a trigger pre-selected — e.g. the `+` on a status column. */
    prefill?: Partial<CreateProjectInput>;
    onClose?: () => void;
}

const PILL_TRIGGER =
  'gap-1.5 !h-6 rounded-full border border-edge !bg-transparent !px-2 !py-0.5 text-xs !font-normal !text-muted !shadow-none hover:!bg-elevated'

const HEADER_BTN =
  'flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-foreground'



function CreateProjectModal({
    open,
    prefill,
    onClose
}: CreateProjectModalProps) {

    // Radix unmounts the dialog content on close, so this state resets with each
    // open — no draft store needed here, unlike CreateIssueModal, which survives
    // a remount only because it can be minimized.
    const [icon, setIcon] = useState<string>(prefill?.icon ?? DEFAULT_PROJECT_ICON)
    const [color, setColor] = useState<string>(prefill?.color ?? DEFAULT_PROJECT_COLOR)
    const [name, setName] = useState<string>(prefill?.name ?? '')
    const [summary, setSummary] = useState<string>(prefill?.description ?? '')
    const [content, setContent] = useState<string>(prefill?.content ?? '')
    const [status, setStatus] = useState<ProjectStatus>(prefill?.status ?? 'backlog')
    const [priority, setPriority] = useState<ProjectPriority>(prefill?.priority ?? 'no_priority')
    const [startDate, setStartDate] = useState<Date | null>(() => toDate(prefill?.startDate))
    const [targetDate, setTargetDate] = useState<Date | null>(() => toDate(prefill?.targetDate))
    const [milestones, setMilestones] = useState<MilestoneDraft[]>([])

    // Lets the spacer below the brief hand focus back to it.
    const briefRef = useRef<HTMLTextAreaElement>(null)

    const createProject = useProjectStore((s) => s.createProject)

    // A start after the target would leave the pair inconsistent. Dropping the
    // target (rather than quietly dragging it along) makes the conflict visible
    // and asks for a fresh pick.
    const handleStartChange = (next: Date | null) => {
        setStartDate(next)
        if (next && targetDate && targetDate < next) setTargetDate(null)
    }

    // Fire-and-forget, like CreateIssueModal: the store inserts optimistically and
    // owns the failure toast, so the modal closes without waiting on Firestore.
    const handleCreate = () => {
        const trimmedName = name.trim()
        if (!trimmedName) return

        // TODO(build order 12): milestone drafts are discarded here — writing them
        // needs projects/{id}/milestones and a milestoneService, neither of which
        // exists yet.
        void createProject({
            name: trimmedName,
            description: summary.trim(),
            content: content.trim(),
            icon,
            color,
            status,
            priority,
            leadId: prefill?.leadId ?? null,
            memberIds: prefill?.memberIds ?? [],
            startDate: startDate ? Timestamp.fromDate(startDate) : null,
            targetDate: targetDate ? Timestamp.fromDate(targetDate) : null,
        })

        onClose?.()
    }

    // Cmd/Ctrl+Enter creates from any multi-line field.
    const handleSubmitShortcut = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault()
            handleCreate()
        }
    }

  return (
       <Dialog open={open} onOpenChange={(next) => { if (!next) onClose?.() }}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            'translate-y-0 gap-0 rounded-3xl bg-surface p-0 top-[6vh] w-[92vw] sm:max-w-4xl',
          )}
        >
          <VisuallyHidden.Root>
            <DialogTitle>Create project</DialogTitle>
          </VisuallyHidden.Root>
              <div
                className={cn(
                    'flex flex-col px-5 pb-4 pt-3.5 min-h-[70vh] max-h-[88vh]',
                )}
                >
                    {/* Breadcrumb header */}
                    <div className='flex shrink-0 items-center gap-1.5'>
                        <div className='flex items-center gap-1.5 rounded-md border border-edge px-1.5 py-0.5 text-xs text-muted'>
                            <BoxIcon size={12} />
                            Projects
                        </div>
                        <span className='text-xs text-muted'>›</span>
                        <span className='text-xs text-foreground'>New project</span>
                        {/* Window controls */}
                        <div className='ml-auto flex items-center gap-1'>
                        <button type='button' onClick={onClose} className={HEADER_BTN} aria-label='Close'>
                            <XIcon className='h-4 w-4' />
                        </button>
                        </div>
                    </div>

                   {/* min-h-0: without it this column refuses to shrink below its
                       content and the max-height above it never takes effect. */}
                   <div className='flex min-h-0 flex-1 flex-col px-4'>
                     {/* Scrolling body. AutoGrowTextarea forces its own height on
                        every resize, so it can never be the flex item that gives
                        way — it would just grow back and shove its siblings out
                        of the modal. The fields keep their natural height and
                        this wrapper takes the overflow instead. */}
                    <div className='mt-5 flex min-h-0 flex-1 flex-col overflow-y-auto'>
                    <div className='shrink-0'>
                         <ProjectIconPicker
                            icon={icon}
                            color={color}
                            onChange={(next) => {
                                setIcon(next.icon)
                                setColor(next.color)
                            }}
                        />
                    </div>

                    {/* Name — one logical line, so Enter creates instead of wrapping */}
                    <AutoGrowTextarea
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                handleCreate()
                            }
                        }}
                        maxLength={256}
                        autoFocus
                        placeholder='Project name'
                        className='mt-3 w-full shrink-0 resize-none overflow-hidden bg-transparent text-[22px] font-medium text-foreground outline-none placeholder:text-muted'
                    />

                    {/* Short summary → Project.description, the line list rows show */}
                    <AutoGrowTextarea
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                handleCreate()
                            }
                        }}
                        maxLength={256}
                        placeholder='Add a short summary...'
                        className='mt-1 w-full shrink-0 resize-none overflow-hidden bg-transparent text-sm text-foreground outline-none placeholder:text-muted'
                    />

                    {/* Option pills — lead, members, labels and dependencies follow later */}
                    <div className='mt-4 flex shrink-0 flex-wrap items-center gap-1.5'>
                        <IssueCommandBox
                            value={status}
                            onValueChange={setStatus}
                            options={PROJECT_STATUSES}
                            map={PROJECT_MAP}
                            placeholder='Set status to...'
                            label={PROJECT_MAP[status].label}
                            triggerClassName={PILL_TRIGGER}
                        />
                        <IssueCommandBox
                            value={priority}
                            onValueChange={setPriority}
                            options={PROJECT_PRIORITIES}
                            map={PRIORITY_MAP}
                            placeholder='Set priority to...'
                            label={PRIORITY_MAP[priority].label}
                            triggerClassName={PILL_TRIGGER}
                        />
                        {/* A picked period collapses to whichever end the field
                            means: a project starts at the top of Q4, but ships
                            by the end of it. */}
                        <DatePillPicker
                            label='Start'
                            heading='Start date'
                            align='start'
                            icon={<CalendarIcon className='h-3 w-3' />}
                            value={startDate}
                            onChange={handleStartChange}
                            triggerClassName={PILL_TRIGGER}
                        />
                        <DatePillPicker
                            label='Target'
                            heading='Target date'
                            align='end'
                            icon={<CalendarCheckIcon className='h-3 w-3' />}
                            value={targetDate}
                            onChange={setTargetDate}
                            min={startDate}
                            triggerClassName={PILL_TRIGGER}
                        />
                    </div>

                    <div className='mt-4 shrink-0 border-t border-edge-subtle' />

                    {/* Brief → Project.content. Keeps its natural height and never
                        flexes: growing it here would inflate the height that
                        AutoGrowTextarea then measures and writes back as its own,
                        which flex can't undo. The spacer below fills the gap. */}
                    <AutoGrowTextarea
                        ref={briefRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={handleSubmitShortcut}
                        keepCaretInView
                        placeholder='Write a description, a project brief, or collect ideas...'
                        className='mt-4 w-full shrink-0 resize-none overflow-hidden bg-transparent text-sm text-foreground outline-none placeholder:text-muted'
                    />

                    {/* Takes up the leftover space only — unlike the field above it
                        can shrink to nothing, so it never forces a scrollbar. Clicks
                        land in the brief, the way an empty page would. */}
                    <div
                        aria-hidden
                        onMouseDown={(e) => {
                            e.preventDefault()
                            const brief = briefRef.current
                            brief?.focus()
                            brief?.setSelectionRange(brief.value.length, brief.value.length)
                        }}
                        className='grow cursor-text'
                    />
                    </div>

                    {/* Milestones stay pinned below the scrolling body */}
                    <MilestoneDraftList
                        milestones={milestones}
                        onChange={setMilestones}
                        className='mt-4 shrink-0'
                    />
                   </div>

                    {/* Footer */}
                    <div className='-mx-5 mt-4 shrink-0 border-t border-edge' />
                    <div className='mt-3 flex shrink-0 items-center justify-end gap-2'>
                        <Button
                            variant='outline'
                            onClick={onClose}
                            className='h-7 rounded-2xl border-edge bg-transparent px-3 !text-lsm text-foreground hover:bg-elevated'
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={!name.trim()}
                            className='rounded-2xl bg-brand px-3 h-7 !text-lsm text-white hover:bg-brand-hover'
                        >
                            Create project
                        </Button>
                    </div>
                </div>
        </DialogContent>
      </Dialog>
  )
}



export default CreateProjectModal
