

import { useState } from 'react'
import { motion, type Transition, type Variants } from 'motion/react'
import { Timestamp } from 'firebase/firestore'
import { CalendarCheckIcon, DiamondIcon, XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toDate } from '@/lib/date'
import { useCommitOnExit } from '@/hooks/useCommitOnExit'
import { useProjectStore } from '@/store/projectStore'
import DatePillPicker from '@/components/common/DatePillPicker'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import MilestoneProgressIcon from '@/components/common/MilestoneProgressIcon'
import type { MilestoneRow } from '@/hooks/useProjectMilestones'

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

const ROW_EXPAND: Transition = { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
const ROW_COLLAPSE: Transition = { duration: 0.14, ease: [0.4, 0, 1, 1] }
const CONTENT_SETTLE: Transition = { duration: 0.14, ease: 'easeOut', delay: 0.04 }
const CONTENT_HIDE: Transition = { duration: 0.08, ease: 'easeIn' }

const COMMIT_EXIT: Transition = { duration: 0 }

const SAVED_SETTLE: Transition = { duration: 0.2, ease: 'easeOut' }

const JUST_SAVED_MS = 1000

export type DraftExit = 'commit' | 'discard'

const draftWrapperVariants: Variants = {
  collapsed: { height: 0, transition: ROW_COLLAPSE },
  open: { height: 'auto', transition: ROW_EXPAND },
  leave: (mode: DraftExit) => ({
    height: 0,
    transition: mode === 'commit' ? COMMIT_EXIT : ROW_COLLAPSE,
  }),
}

// Inherited by label from the wrapper above: the surface fades and settles into
// place while the wrapper opens the space for it.
const draftContentVariants: Variants = {
  collapsed: { opacity: 0, y: -4, transition: CONTENT_HIDE },
  open: { opacity: 1, y: 0, transition: CONTENT_SETTLE },
  leave: (mode: DraftExit) => ({
    opacity: 0,
    transition: mode === 'commit' ? COMMIT_EXIT : CONTENT_HIDE,
  }),
}

export type MilestoneDraft = {
  /** Client-only React key — the real id is minted when the row is created. */
  key: string
  name: string
  description: string
  targetDate: Date | null
}

/** `2 issues · 40%` — the date sits in its own editable pill, not in here. */
const metaLine = (total: number, pct: number) =>
  `${total} ${total === 1 ? 'issue' : 'issues'} · ${pct}%`

export function SavedMilestoneRow({ projectId, row }: { projectId: string; row: MilestoneRow }) {
  const { milestone, progress } = row
  const updateMilestone = useProjectStore((s) => s.updateMilestone)
  const deleteMilestone = useProjectStore((s) => s.deleteMilestone)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Latched on mount, then cleared when the settle finishes — which also unmounts
  // the two throwaway layers it needs.
  const [justSaved, setJustSaved] = useState(() => {
    const created = toDate(milestone.createdAt)
    return created ? Date.now() - created.getTime() < JUST_SAVED_MS : false
  })

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
    <motion.div exit={{ height: 0, opacity: 0, transition: ROW_COLLAPSE }} className='overflow-hidden'>
      <div className='group relative rounded-lg px-2 py-2 hover:bg-hover-subtle'>
        {justSaved && (
          <motion.span
            aria-hidden='true'
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={SAVED_SETTLE}
            className='pointer-events-none absolute inset-0 rounded-lg bg-hover-subtle'
          />
        )}

        <div className='relative flex items-center gap-2'>
          {justSaved ? (
            <span className='relative flex h-3.5 w-3.5 shrink-0'>
              <motion.span
                aria-hidden='true'
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={SAVED_SETTLE}
                className='absolute inset-0 text-muted'
              >
                <DiamondIcon className='h-3.5 w-3.5' />
              </motion.span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={SAVED_SETTLE}
                onAnimationComplete={() => setJustSaved(false)}
                className='absolute inset-0'
              >
                <MilestoneProgressIcon pct={progress.pct} />
              </motion.span>
            </span>
          ) : (
            <MilestoneProgressIcon pct={progress.pct} />
          )}

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

        <div className={cn('relative mt-1', DESCRIPTION_INDENT)}>
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
    </motion.div>
  )
}

type DraftRowProps = {
  draft: MilestoneDraft
  onPatch: (patch: Partial<MilestoneDraft>) => void
  onCommit: () => void
  onRemove: () => void
}

export function DraftMilestoneRow({ draft, onPatch, onCommit, onRemove }: DraftRowProps) {
  return (
    <motion.div
      variants={draftWrapperVariants}
      initial='collapsed'
      animate='open'
      exit='leave'
      className='overflow-hidden'
    >
      {/* The surface fades and settles; the wrapper above owns the height. Labels
          propagate down from it, so no initial/animate/exit is needed here. */}
      <motion.div variants={draftContentVariants} className='rounded-lg bg-hover-subtle px-2 py-2'>
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
      </motion.div>
    </motion.div>
  )
}
