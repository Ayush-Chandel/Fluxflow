// src/components/projects/detail/ProjectMilestoneList.tsx — the Milestones block
// of a project detail page.
//
// Two kinds of row, deliberately identical in shape:
//   SAVED  — from useProjectMilestones(), still stubbed to [] because
//            `projects/{id}/milestones` + its service/store are build order 12.
//   DRAFT  — the "+ Milestone" flow. Fully editable here and held in LOCAL
//            state; nothing is persisted yet, exactly like MilestoneDraftList in
//            the create-project modal. §12 turns commitDraft() into a
//            createMilestone() call and the markup below stops caring which
//            kind of row it is.
import { useEffect, useRef, useState } from 'react'
import { CalendarCheckIcon, DiamondIcon, PlusIcon, XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateShort, toDate } from '@/lib/date'
import DatePillPicker from '@/components/common/DatePillPicker'
import type { MilestoneRow } from '@/hooks/useProjectMilestones'

// The milestone glyph's amber from the reference design — the same value as the
// palette's Yellow swatch (constants/projectIcons), which is where a per-milestone
// colour would draw from if one is ever modelled.
const MILESTONE_ACCENT = '#E5C019'

// Indents the description to sit under the name: icon (14px) + gap (8px).
const DESCRIPTION_INDENT = 'pl-5.5'

const META = 'shrink-0 text-lsm tabular-nums text-muted'

const DATE_PILL =
  'gap-1.5 !h-6 rounded-md !bg-transparent !px-1.5 !py-0.5 text-lsm !font-normal !text-muted !shadow-none hover:!bg-elevated'

const ROW_BUTTON =
  'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-foreground'

type MilestoneDraft = {
  /** Client-only React key — a Firestore id only exists once §12 saves the row. */
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

/** `Sep 18 · 2 issues · 0%`, with absent parts dropping their separator too. */
const metaLine = (target: Date | null, total: number, pct: number) =>
  [target && formatDateShort(target), `${total} ${total === 1 ? 'issue' : 'issues'}`, `${pct}%`]
    .filter(Boolean)
    .join(' · ')

function SavedMilestoneRow({ row }: { row: MilestoneRow }) {
  const { milestone, progress } = row

  return (
    <div className='rounded-lg px-2 py-2 hover:bg-hover-subtle'>
      <div className='flex items-center gap-2'>
        <DiamondIcon className='h-3.5 w-3.5 shrink-0' style={{ color: MILESTONE_ACCENT }} />
        <span className='min-w-0 flex-1 truncate text-lsm font-medium text-foreground'>
          {milestone.name}
        </span>
        <span className={META}>
          {metaLine(toDate(milestone.targetDate), progress.total, progress.pct)}
        </span>
      </div>

      {/* Only when set — a saved row shouldn't hold a blank line open. */}
      {milestone.description && (
        <p className={cn('mt-1 text-lsm text-muted', DESCRIPTION_INDENT)}>
          {milestone.description}
        </p>
      )}
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
            // Plain Enter continues the list; Cmd/Ctrl+Enter is left alone so a
            // parent submit shortcut still works from here.
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
          className='min-w-0 flex-1 bg-transparent text-lsm font-medium text-foreground outline-none placeholder:text-muted'
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

        {/* The reference shows a `…` menu here; remove is the only action it
            would currently hold, so it is the button. */}
        <button type='button' aria-label='Remove milestone' onClick={onRemove} className={ROW_BUTTON}>
          <XIcon className='h-3.5 w-3.5' />
        </button>
      </div>

      <div className={cn('mt-1', DESCRIPTION_INDENT)}>
        <input
          value={draft.description}
          onChange={(e) => onPatch({ description: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              onRemove()
            }
          }}
          maxLength={256}
          placeholder='Add a description...'
          className='w-full bg-transparent text-lsm text-muted outline-none placeholder:text-muted'
        />
      </div>
    </div>
  )
}

type ProjectMilestoneListProps = {
  milestones: MilestoneRow[]
  className?: string
}

function ProjectMilestoneList({ milestones, className }: ProjectMilestoneListProps) {
  const [drafts, setDrafts] = useState<MilestoneDraft[]>([])

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

  // TODO(build order 12): hand the row to milestoneStore.createMilestone() and
  // drop it from `drafts` — the snapshot echo then re-renders it as a saved row.
  // Until then a committed row simply stays editable, and Enter opens the next
  // one so several can be typed in a run.
  const commitDraft = (key: string) => {
    const draft = drafts.find((row) => row.key === key)
    if (!draft?.name.trim()) return
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
          <SavedMilestoneRow key={row.milestone.id} row={row} />
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
