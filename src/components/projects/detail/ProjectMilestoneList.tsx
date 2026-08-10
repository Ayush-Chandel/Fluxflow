
import { useEffect, useRef, useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import { CalendarCheckIcon, DiamondIcon, PlusIcon, XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toDate } from '@/lib/date'
import { useCommitOnExit } from '@/hooks/useCommitOnExit'
import { useProjectStore } from '@/store/projectStore'
import DatePillPicker from '@/components/common/DatePillPicker'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import type { MilestoneRow } from '@/hooks/useProjectMilestones'

// The milestone glyph's amber from the reference design — the same value as the
// palette's Yellow swatch (constants/projectIcons), which is where a per-milestone
// colour would draw from if one is ever modelled.
const MILESTONE_ACCENT = '#E5C019'

// Indents the description to sit under the name: icon (14px) + gap (8px).
const DESCRIPTION_INDENT = 'pl-5.5'

const META = 'shrink-0 text-lsm tabular-nums text-muted'

const NAME_INPUT =
  'min-w-0 flex-1 bg-transparent text-lsm font-medium text-foreground outline-none placeholder:text-muted'

const DESCRIPTION_INPUT =
  'w-full bg-transparent text-lsm text-muted outline-none placeholder:text-muted'

const DATE_PILL =
  'gap-1.5 !h-6 rounded-md !bg-transparent !px-1.5 !py-0.5 text-lsm !font-normal !text-muted !shadow-none hover:!bg-elevated'

const ROW_BUTTON =
  'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-foreground'

type MilestoneDraft = {
  /** Client-only React key — the real id is minted when the row is created. */
  key: string
  name: string
  description: string
  targetDate: Date | null
}

const newDraft = (): MilestoneDraft => ({
  key: crypto.randomUUID(),
  name: '',
  description: '',
  targetDate: null,
})

/** `2 issues · 40%` — the date sits in its own editable pill, not in here. */
const metaLine = (total: number, pct: number) =>
  `${total} ${total === 1 ? 'issue' : 'issues'} · ${pct}%`

function SavedMilestoneRow({ projectId, row }: { projectId: string; row: MilestoneRow }) {
  const { milestone, progress } = row
  const updateMilestone = useProjectStore((s) => s.updateMilestone)
  const deleteMilestone = useProjectStore((s) => s.deleteMilestone)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // One write per editing session — on blur, on unmount, or on tab-hide.
  const name = useCommitOnExit(
    milestone.name,
    (next: string) => {
      const trimmed = next.trim()
      if (!trimmed) return false // a milestone may never lose its name
      void updateMilestone(projectId, milestone.id, { name: trimmed })
    },
    milestone.id,
  )

  const description = useCommitOnExit(
    milestone.description,
    (next: string) => {
      void updateMilestone(projectId, milestone.id, { description: next.trim() })
    },
    milestone.id,
  )

  return (
    <div className='group rounded-lg px-2 py-2 hover:bg-hover-subtle'>
      <div className='flex items-center gap-2'>
        <DiamondIcon className='h-3.5 w-3.5 shrink-0' style={{ color: MILESTONE_ACCENT }} />

        <input
          defaultValue={milestone.name}
          onInput={(e) => name.track(e.currentTarget.value)}
          onBlur={name.flush}
          onKeyDown={(e) => {
            // A name is one logical line: Enter ends the edit rather than
            // inserting anything, and blurring is what flushes it.
            if (e.key === 'Enter') {
              e.preventDefault()
              e.currentTarget.blur()
            }
          }}
          maxLength={128}
          placeholder='Milestone name'
          className={NAME_INPUT}
        />

        <DatePillPicker
          label='Target'
          heading='Milestone target date'
          align='end'
          contentAlign='end'
          icon={<CalendarCheckIcon className='h-3 w-3' />}
          value={toDate(milestone.targetDate)}
          onChange={(next) =>
            void updateMilestone(projectId, milestone.id, {
              targetDate: next ? Timestamp.fromDate(next) : null,
            })
          }
          triggerClassName={DATE_PILL}
        />

        <span className={META}>{metaLine(progress.total, progress.pct)}</span>

        {/* Hidden until the row is hovered/focused so a read-only pass over the
            list isn't a wall of delete buttons. */}
        <button
          type='button'
          aria-label={`Delete milestone ${milestone.name}`}
          onClick={() => setConfirmOpen(true)}
          className={cn(ROW_BUTTON, 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100')}
        >
          <XIcon className='h-3.5 w-3.5' />
        </button>
      </div>

      <div className={cn('mt-1', DESCRIPTION_INDENT)}>
        <input
          defaultValue={milestone.description}
          onInput={(e) => description.track(e.currentTarget.value)}
          onBlur={description.flush}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.currentTarget.blur()
            }
          }}
          maxLength={256}
          placeholder='Add a description...'
          className={DESCRIPTION_INPUT}
        />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title='Delete milestone?'
        description={
          // Deliberately count-free: progress.total is issues IN SCOPE, which
          // excludes cancelled ones — they'd be re-pointed by the delete too, so
          // any number quoted here would be a slight undercount.
          progress.total > 0
            ? `${milestone.name} will be removed. Issues assigned to it stay in the project, but lose this milestone.`
            : `${milestone.name} will be removed from this project.`
        }
        confirmLabel='Delete'
        onConfirm={() => {
          setConfirmOpen(false)
          void deleteMilestone(projectId, milestone.id)
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}

type DraftRowProps = {
  draft: MilestoneDraft
  onPatch: (patch: Partial<MilestoneDraft>) => void
  onCommit: () => void
  onRemove: () => void
}

function DraftMilestoneRow({ draft, onPatch, onCommit, onRemove }: DraftRowProps) {
  return (
    <div className='rounded-lg bg-hover-subtle px-2 py-2'>
      <div className='flex items-center gap-2'>
        <DiamondIcon className='h-3.5 w-3.5 shrink-0 text-muted' />

        <input
          data-draft-key={draft.key}
          value={draft.name}
          onChange={(e) => onPatch({ name: e.target.value })}
          onKeyDown={(e) => {
            // Plain Enter creates and continues the list; Cmd/Ctrl+Enter is left
            // alone so a parent submit shortcut still works from here.
            if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
              e.preventDefault()
              onCommit()
            }
            if (e.key === 'Escape') {
              e.preventDefault()
              onRemove()
            }
            // Backspace in an already-empty row deletes it, the way a list editor
            // behaves — no need to reach for the X.
            if (e.key === 'Backspace' && draft.name === '') {
              e.preventDefault()
              onRemove()
            }
          }}
          maxLength={128}
          placeholder='Milestone name'
          className={NAME_INPUT}
        />

        <DatePillPicker
          label='Set target date'
          heading='Milestone target date'
          align='end'
          contentAlign='end'
          icon={<CalendarCheckIcon className='h-3 w-3' />}
          value={draft.targetDate}
          onChange={(targetDate) => onPatch({ targetDate })}
          triggerClassName={DATE_PILL}
        />

        {/* A draft owns no issues yet, so its counts are structurally zero
            rather than derived. */}
        <span className={META}>0 issues · 0%</span>

        <button type='button' aria-label='Discard milestone' onClick={onRemove} className={ROW_BUTTON}>
          <XIcon className='h-3.5 w-3.5' />
        </button>
      </div>

      <div className={cn('mt-1', DESCRIPTION_INDENT)}>
        <input
          value={draft.description}
          onChange={(e) => onPatch({ description: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
              e.preventDefault()
              onCommit()
            }
            if (e.key === 'Escape') {
              e.preventDefault()
              onRemove()
            }
          }}
          maxLength={256}
          placeholder='Add a description...'
          className={DESCRIPTION_INPUT}
        />
      </div>
    </div>
  )
}

type ProjectMilestoneListProps = {
  projectId: string
  milestones: MilestoneRow[]
  className?: string
}

function ProjectMilestoneList({ projectId, milestones, className }: ProjectMilestoneListProps) {
  const [drafts, setDrafts] = useState<MilestoneDraft[]>([])
  const createMilestone = useProjectStore((s) => s.createMilestone)

  const listRef = useRef<HTMLDivElement>(null)
  // Focus can't move until the new row has rendered, so the key is parked here
  // and consumed after the commit. A ref, not state: it drives an imperative DOM
  // call and re-rendering for it would be a wasted pass.
  const focusKey = useRef<string | null>(null)

  useEffect(() => {
    const key = focusKey.current
    if (!key) return
    focusKey.current = null
    listRef.current?.querySelector<HTMLInputElement>(`[data-draft-key="${key}"]`)?.focus()
  }, [drafts])

  const addDraft = () => {
    const draft = newDraft()
    setDrafts((prev) => [...prev, draft])
    focusKey.current = draft.key
  }

  const patchDraft = (key: string, patch: Partial<MilestoneDraft>) =>
    setDrafts((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)))

  const removeDraft = (key: string) => setDrafts((prev) => prev.filter((row) => row.key !== key))

  const commitDraft = (key: string) => {
    const draft = drafts.find((row) => row.key === key)
    const name = draft?.name.trim()
    if (!draft || !name) return

    void createMilestone(projectId, {
      name,
      description: draft.description.trim(),
      targetDate: draft.targetDate ? Timestamp.fromDate(draft.targetDate) : null,
    })

    // Drop the committed row and open a fresh one, so a run of milestones can be
    // typed without reaching back for the button. The optimistic store re-renders
    // the committed one immediately above as a saved row.
    removeDraft(key)
    addDraft()
  }

  const isEmpty = milestones.length === 0 && drafts.length === 0

  return (
    <section className={cn('flex flex-col gap-2', className)}>
      <h2 className='text-lsm font-medium text-foreground'>Milestones</h2>

      {isEmpty && (
        <p className='text-lsm text-muted'>
          No milestones yet — break the project into stages like Alpha, Beta, GA.
        </p>
      )}

      <div ref={listRef} className='flex flex-col'>
        {milestones.map((row) => (
          <SavedMilestoneRow key={row.milestone.id} projectId={projectId} row={row} />
        ))}

        {drafts.map((draft) => (
          <DraftMilestoneRow
            key={draft.key}
            draft={draft}
            onPatch={(patch) => patchDraft(draft.key, patch)}
            onCommit={() => commitDraft(draft.key)}
            onRemove={() => removeDraft(draft.key)}
          />
        ))}
      </div>

      <button
        type='button'
        onClick={addDraft}
        className='flex w-fit items-center gap-1.5 rounded-md px-1.5 py-1 text-lsm text-muted transition-colors hover:bg-elevated hover:text-foreground'
      >
        <PlusIcon className='h-3.5 w-3.5' />
        Milestone
      </button>
    </section>
  )
}

export default ProjectMilestoneList
