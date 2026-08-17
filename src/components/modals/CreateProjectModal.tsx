import { useEffect, useRef, useState } from 'react'
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
import ConfirmDialog from '../common/ConfirmDialog'
import { PRIORITY_MAP, PROJECT_MAP } from '../common/constants/constants'
import {
  DEFAULT_PROJECT_COLOR,
  DEFAULT_PROJECT_ICON,
} from '../common/constants/projectIcons'
import { useProjectStore } from '@/store/projectStore'
import { getDefaultTemplate, useTemplateStore } from '@/store/templateStore'
import TemplatePicker from '../templates/TemplatePicker'
import type { ProjectTemplate } from '@/types/template'

type CreateProjectModalProps = {
    open:boolean;
    /** Fields a trigger pre-selected — e.g. the `+` on a status column. */
    prefill?: Partial<CreateProjectInput>;
    /** Template the trigger chose; null falls back to the default one. */
    templateId?: string | null;
    onClose?: () => void;
}

const PILL_TRIGGER =
  'gap-1.5 !h-6 rounded-full border border-edge !bg-transparent !px-2 !py-0.5 text-xs !font-normal !text-muted !shadow-none hover:!bg-elevated'

const HEADER_BTN =
  'flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-foreground'

type ProjectDraft = {
  icon: string
  color: string
  name: string
  summary: string
  content: string
  status: ProjectStatus
  priority: ProjectPriority
  startDate: Date | null
  targetDate: Date | null
  milestones: MilestoneDraft[]
}

/** A project template by id, or undefined if it's gone / is an issue template. */
const projectTemplate = (id: string | null | undefined): ProjectTemplate | undefined => {
  if (!id) return undefined
  const template = useTemplateStore.getState().templates[id]
  return template?.type === 'project' ? template : undefined
}

/** The form's starting values for a given open — one source of truth for both
 *  the initial state and the "has anything changed?" baseline.
 *
 *  Prefill outranks the template: it comes from the exact spot the user clicked.
 *  Dates are absent from templates by design (§ TemplateProjectData), so they
 *  only ever come from the prefill. */
const buildSeed = (
  prefill?: Partial<CreateProjectInput>,
  template?: ProjectTemplate | null,
): ProjectDraft => ({
  // The template's icon is the template's own — projects made from it inherit it.
  icon: prefill?.icon ?? template?.icon ?? DEFAULT_PROJECT_ICON,
  color: prefill?.color ?? template?.color ?? DEFAULT_PROJECT_COLOR,
  name: prefill?.name ?? template?.data.name ?? '',
  summary: prefill?.description ?? template?.data.description ?? '',
  content: prefill?.content ?? template?.data.content ?? '',
  status: prefill?.status ?? template?.data.status ?? 'backlog',
  priority: prefill?.priority ?? template?.data.priority ?? 'no_priority',
  startDate: toDate(prefill?.startDate),
  targetDate: toDate(prefill?.targetDate),
  // Stored rows carry no client key, so one is minted per row here.
  milestones: (template?.data.milestones ?? []).map((milestone) => ({
    key: crypto.randomUUID(),
    name: milestone.name,
    targetDate: null,
  })),
})

/** Comparable form of a draft: Dates and milestone objects never match by
 *  identity, so normalise before diffing against the seed. */
const fingerprint = (draft: ProjectDraft) =>
  JSON.stringify({
    ...draft,
    name: draft.name.trim(),
    summary: draft.summary.trim(),
    content: draft.content.trim(),
    startDate: draft.startDate?.getTime() ?? null,
    targetDate: draft.targetDate?.getTime() ?? null,
  })



function CreateProjectModal({
    open,
    prefill,
    templateId: requestedTemplateId,
    onClose
}: CreateProjectModalProps) {

    const initial = buildSeed(prefill)
    const [templateId, setTemplateId] = useState<string | null>(null)
    const [icon, setIcon] = useState<string>(initial.icon)
    const [color, setColor] = useState<string>(initial.color)
    const [name, setName] = useState<string>(initial.name)
    const [summary, setSummary] = useState<string>(initial.summary)
    const [content, setContent] = useState<string>(initial.content)
    const [status, setStatus] = useState<ProjectStatus>(initial.status)
    const [priority, setPriority] = useState<ProjectPriority>(initial.priority)
    const [startDate, setStartDate] = useState<Date | null>(initial.startDate)
    const [targetDate, setTargetDate] = useState<Date | null>(initial.targetDate)
    const [milestones, setMilestones] = useState<MilestoneDraft[]>(initial.milestones)

    const [confirmOpen, setConfirmOpen] = useState(false)

    const seedFingerprint = useRef(fingerprint(initial))


    /** Every field at once — the open effect and the template picker both need it. */
    const applySeed = (seed: ProjectDraft) => {
        setIcon(seed.icon)
        setColor(seed.color)
        setName(seed.name)
        setSummary(seed.summary)
        setContent(seed.content)
        setStatus(seed.status)
        setPriority(seed.priority)
        setStartDate(seed.startDate)
        setTargetDate(seed.targetDate)
        setMilestones(seed.milestones)
    }

    useEffect(() => {
        if (!open) return
        // An explicit choice (the templates list's "Use template") wins; failing
        // that, the workspace's default project template if one is flagged.
        const fallback = getDefaultTemplate('project')
        const template =
            projectTemplate(requestedTemplateId) ??
            (fallback?.type === 'project' ? fallback : undefined)

        const seed = buildSeed(prefill, template)
        applySeed(seed)
        setTemplateId(template?.id ?? null)
        // The seeded template is part of the baseline, so opening and closing
        // straight away isn't treated as an unsaved change.
        seedFingerprint.current = fingerprint(seed)
        setConfirmOpen(false)
        // Deliberately keyed on `open` alone: `prefill` is a fresh object each
        // render, and re-running on its identity would wipe what the user typed.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    /**
     * Applying a template fills the blanks and leaves the user's own input alone.
     *
     * A field is the template's to set when it still holds the blank draft's
     * value, OR the value the PREVIOUS template put there — so swapping
     * templates replaces what the old one contributed without touching anything
     * typed by hand. Picking a template IS an edit, so the dirty baseline
     * deliberately stays put.
     */
    const handleTemplateChange = (nextId: string | null) => {
        const current: ProjectDraft = {
            icon, color, name, summary, content, status, priority, startDate, targetDate, milestones,
        }
        const blank = buildSeed(prefill)
        const previous = buildSeed(prefill, projectTemplate(templateId))
        const next = buildSeed(prefill, projectTemplate(nextId))

        const fillable = <K extends keyof ProjectDraft>(key: K) =>
            current[key] === blank[key] || current[key] === previous[key]

        // Milestones compare by name: buildSeed mints fresh client keys every
        // call, so the rows are never identical by reference.
        const sameRows = (a: MilestoneDraft[], b: MilestoneDraft[]) =>
            a.length === b.length && a.every((row, index) => row.name === b[index].name)

        setTemplateId(nextId)
        applySeed({
            ...current,
            icon: fillable('icon') ? next.icon : icon,
            color: fillable('color') ? next.color : color,
            name: fillable('name') ? next.name : name,
            summary: fillable('summary') ? next.summary : summary,
            content: fillable('content') ? next.content : content,
            status: fillable('status') ? next.status : status,
            priority: fillable('priority') ? next.priority : priority,
            milestones:
                sameRows(milestones, blank.milestones) || sameRows(milestones, previous.milestones)
                    ? next.milestones
                    : milestones,
            // startDate/targetDate ride through untouched: templates carry no dates.
        })
    }

    const isDirty =
        fingerprint({
            icon, color, name, summary, content, status, priority, startDate, targetDate, milestones,
        }) !== seedFingerprint.current

    const requestClose = () => {
        if (isDirty) setConfirmOpen(true)
        else onClose?.()
    }

    const briefRef = useRef<HTMLTextAreaElement>(null)

    const createProject = useProjectStore((s) => s.createProject)

    const handleStartChange = (next: Date | null) => {
        setStartDate(next)
        if (next && targetDate && targetDate < next) setTargetDate(null)
    }


    const handleCreate = () => {
        const trimmedName = name.trim()
        if (!trimmedName) return

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
            // Milestones are a field of the project document, so these ride along
            // in the same write — no second round-trip, nothing half-created if
            // it fails. Unnamed rows are just abandoned drafts and are dropped.
            // (This compact list has no description input; the detail page's does.)
            milestones: milestones
                .filter((milestone) => milestone.name.trim())
                .map((milestone) => ({
                    name: milestone.name.trim(),
                    description: '',
                    targetDate: milestone.targetDate
                        ? Timestamp.fromDate(milestone.targetDate)
                        : null,
                })),
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
    <>
       {/* Controlled `open` means a dismissal is only a REQUEST — vetoing it here
           is what lets the confirm step interrupt Escape and outside clicks. */}
       <Dialog open={open} onOpenChange={(next) => { if (!next) requestClose() }}>
        <DialogContent
          showCloseButton={false}
          align='top'
          className={cn(
            'mt-[6vh] gap-0 rounded-3xl bg-surface p-0 w-[92vw] sm:max-w-4xl',
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
                        {/* <div className='flex items-center gap-1.5 rounded-md border border-edge px-1.5 py-0.5 text-xs text-muted'>
                            <BoxIcon size={12} />
                            Projects
                        </div>
                        <span className='text-xs text-muted'>›</span>
                        <span className='text-xs text-foreground'>New project</span> */}
                        {/* Applying a template rebuilds the whole draft, so it sits
                            up here rather than among the pills below, which each
                            edit one field. */}
                        <TemplatePicker
                            type='project'
                            value={templateId}
                            onChange={handleTemplateChange}
                            triggerClassName={PILL_TRIGGER}
                        />
                        {/* Window controls */}
                        <div className='ml-auto flex items-center gap-1'>
                        <button type='button' onClick={requestClose} className={HEADER_BTN} aria-label='Close'>
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

                    {/* Inside the scroller, not pinned beneath it. Pinned, every draft
                        added took height from the body above — flex shrank the
                        scrolling area instead of scrolling it, pushing the top fields
                        out of the modal. In here the list just extends the scroll
                        content, and the `grow` spacer above still holds it at the
                        bottom while the brief is short. */}
                    <MilestoneDraftList
                        milestones={milestones}
                        onChange={setMilestones}
                        className='mt-4 shrink-0'
                    />
                    </div>
                   </div>

                    {/* Footer */}
                    <div className='-mx-5 mt-4 shrink-0 border-t border-edge' />
                    <div className='mt-3 flex shrink-0 items-center justify-end gap-2'>
                        <Button
                            variant='outline'
                            onClick={requestClose}
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

      <ConfirmDialog
        open={confirmOpen}
        title='Discard changes?'
        description="Are you sure you want to discard the changes you've made to this project?"
        confirmLabel='Discard'
        onConfirm={() => {
          setConfirmOpen(false)
          onClose?.()
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}



export default CreateProjectModal
