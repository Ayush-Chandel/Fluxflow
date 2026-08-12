
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, type Transition } from 'motion/react'
import { Timestamp } from 'firebase/firestore'
import { PlusIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProjectStore } from '@/store/projectStore'
import type { MilestoneRow } from '@/hooks/useProjectMilestones'
import {
  DraftMilestoneRow,
  SavedMilestoneRow,
  type DraftExit,
  type MilestoneDraft,
} from './ProjectMilestoneRows'

const EMPTY_SWAP: Transition = { duration: 0.16, ease: 'easeOut' }

const newDraft = (): MilestoneDraft => ({
  key: crypto.randomUUID(),
  name: '',
  description: '',
  targetDate: null,
})

type ProjectMilestoneListProps = {
  projectId: string
  milestones: MilestoneRow[]
  className?: string
}

function ProjectMilestoneList({ projectId, milestones, className }: ProjectMilestoneListProps) {
  const [drafts, setDrafts] = useState<MilestoneDraft[]>([])
  const createMilestone = useProjectStore((s) => s.createMilestone)

  const [exitMode, setExitMode] = useState<DraftExit>('discard')

  const listRef = useRef<HTMLDivElement>(null)
  const focusKey = useRef<string | null>(null)

  useEffect(() => {
    const key = focusKey.current
    if (!key) return
    focusKey.current = null
    listRef.current
      ?.querySelector<HTMLInputElement>(`[data-draft-key="${key}"]`)
      ?.focus({ preventScroll: true })
  }, [drafts])

  const addDraft = () => {
    const draft = newDraft()
    setDrafts((prev) => [...prev, draft])
    focusKey.current = draft.key
  }

  const patchDraft = (key: string, patch: Partial<MilestoneDraft>) =>
    setDrafts((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)))

  const dropDraft = (key: string) => setDrafts((prev) => prev.filter((row) => row.key !== key))

  const discardDraft = (key: string) => {
    setExitMode('discard')
    dropDraft(key)
  }

  const commitDraft = (key: string) => {
    const draft = drafts.find((row) => row.key === key)
    const name = draft?.name.trim()
    if (!draft || !name) return

    void createMilestone(projectId, {
      name,
      description: draft.description.trim(),
      targetDate: draft.targetDate ? Timestamp.fromDate(draft.targetDate) : null,
    })

    setExitMode('commit')
    dropDraft(key)
    addDraft()
  }

  const isEmpty = milestones.length === 0 && drafts.length === 0

  return (
    <section className={cn('flex flex-col gap-2', className)}>
      <h2 className='text-lsm font-medium text-foreground'>Milestones</h2>

      {/* initial={false} so a project that opens empty just shows the note,
          rather than animating it in. */}
      <AnimatePresence initial={false}>
        {isEmpty && (
          <motion.div
            key='empty-note'
            initial={{ height: 0, opacity: 0, marginTop: '-0.5rem' }}
            animate={{ height: 'auto', opacity: 1, marginTop: 0 }}
            exit={{ height: 0, opacity: 0, marginTop: '-0.5rem' }}
            transition={EMPTY_SWAP}
            className='overflow-hidden'
          >
            <p className='text-lsm text-muted'>
              No milestones yet — break the project into stages like Alpha, Beta, GA.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={listRef} className='flex flex-col'>
        {/* One AnimatePresence over both groups: a committed draft and the saved
            row that replaces it are siblings here, and the handoff only reads as
            one row if a single presence tracker owns both. */}
        <AnimatePresence initial={false} custom={exitMode}>
          {milestones.map((row) => (
            <SavedMilestoneRow key={row.milestone.id} projectId={projectId} row={row} />
          ))}

          {drafts.map((draft) => (
            <DraftMilestoneRow
              key={draft.key}
              draft={draft}
              onPatch={(patch) => patchDraft(draft.key, patch)}
              onCommit={() => commitDraft(draft.key)}
              onRemove={() => discardDraft(draft.key)}
            />
          ))}
        </AnimatePresence>
      </div>

      <motion.button
        type='button'
        onClick={addDraft}
        whileTap={{ scale: 0.97 }}
        className='flex w-fit items-center gap-1.5 rounded-md px-1.5 py-1 text-lsm text-muted transition-colors hover:bg-elevated hover:text-foreground'
      >
        <PlusIcon className='h-3.5 w-3.5' />
        Milestone
      </motion.button>
    </section>
  )
}

export default ProjectMilestoneList
