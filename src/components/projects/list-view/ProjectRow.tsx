
import { Timestamp } from 'firebase/firestore'
import { CalendarCheckIcon, CalendarPlusIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateShort, toDate } from '@/lib/date'
import DatePillPicker from '../../common/DatePillPicker'
import MilestoneProgressIcon from '../../common/MilestoneProgressIcon'
import type { Progress } from '@/lib/progress'
import type { MilestoneRow } from '@/lib/milestones'
import { PROJECT_PRIORITIES, PROJECT_STATUSES, type Project, type ProjectStatus } from '@/types/project'
import { useProjectStore } from '@/store/projectStore'
import { PROJECT_MAP, PRIORITY_MAP } from '../../common/constants/constants'
import { PROJECT_CELL, PROJECT_COLUMNS, PROJECT_GRID } from '../projectColumns'
import {
  DEFAULT_PROJECT_COLOR,
  resolveProjectIcon,
} from '../../common/constants/projectIcons'
import IssueCommandBox from '../../issues/IssueCommandBox'
import ProjectActionsMenu from '../ProjectActionsMenu'
import { useState } from 'react'
import { motion } from 'motion/react'
// import { AssigneeIcon } from '../../icons'

type Props = {
  project: Project
  progress: Progress
  milestone: MilestoneRow | null
  index?: number
  isInitialViewLoad?: boolean
  onOpen?: () => void
}

// Column classes by id, so a cell can never be styled differently from its header.
const cellClass = (id: string) =>
  cn(PROJECT_CELL, PROJECT_COLUMNS.find((column) => column.id === id)?.className)

function ProjectRow({ project, progress, milestone, index = 0, isInitialViewLoad = false, onOpen }: Props) {
  const updateProject = useProjectStore((s) => s.updateProject)
  const [statusAnimation, setStatusAnimation] = useState(0)

  const staggerDelay = index * 0.05
  const shouldUseInitialStagger = isInitialViewLoad

  const changeStatus = (status: ProjectStatus) => {
    updateProject(project.id, { status })
    setStatusAnimation((value) => value + 1)
  }

  // Falls back to the default glyph when the key is unknown (older doc, renamed key).
  const { icon: ProjectIcon } = resolveProjectIcon(project.icon)

  const milestoneTarget = toDate(milestone?.milestone.targetDate)

  return (
    <motion.div
      initial={
        shouldUseInitialStagger
          ? { opacity: 0, y: -10 }
          : { opacity: 0, x: -24 }
      }
      animate={{ opacity: 1, y: 0, x: 0, height: 'auto' }}
      exit={{ opacity: 0, scale: 0.96, height: 0 }}
      transition={
        shouldUseInitialStagger
          ? {
              type: 'spring',
              stiffness: 260,
              damping: 18,
              mass: 0.8,
              delay: staggerDelay,
            }
          : { duration: 0.2, ease: 'easeOut' }
      }
      className='overflow-hidden'
    >
      <div
        role='row'
        onClick={(e) => {
          // A click on a picker inside the row must not also open the project.
          if ((e.target as HTMLElement).closest('button')) return
          onOpen?.()
        }}
        className={cn(
          PROJECT_GRID,
          // `group` drives the hover-revealed add-target affordance below.
          'group h-11 cursor-pointer rounded-md text-lsm text-foreground hover:bg-hover-subtle',
        )}
      >
      {/* Name — the project's own icon/color, NOT the status glyph. `icon` stores
          a registry KEY ('box', 'layers'), so it has to be resolved to a component. */}
      <div role='cell' className={cellClass('name')}>
        <ProjectIcon
          size={14}
          className='shrink-0'
          style={{ color: project.color || DEFAULT_PROJECT_COLOR }}
        />
        <span className='truncate font-medium text-lsm text-foreground'>{project.name}</span>

        {milestone && (
          <span
            title={milestone.milestone.name}
            className='hidden min-w-0 items-center ml-3 gap-1.5 text-xs   text-muted lg:flex'
          >
            <MilestoneProgressIcon pct={milestone.progress.pct} />
            <span className='truncate'>{milestone.milestone.name}</span>
            {milestoneTarget && (
              <span className='shrink-0 tabular-nums'>{formatDateShort(milestoneTarget)}</span>
            )}
          </span>
        )}
      </div>

      <div role='cell' className={cellClass('priority')}>
        <IssueCommandBox
          value={project.priority}
          onValueChange={(priority) => updateProject(project.id, { priority })}
          options={PROJECT_PRIORITIES}
          map={PRIORITY_MAP}
          pulseOnValueChange
          placeholder='Change priority to...'
          triggerClassName='!px-1'
        />
      </div>

      {/* Lead — hidden until a member entity exists to resolve `leadId`. Dropped
          from PROJECT_COLUMNS too, so the header loses its cell in step. */}
      {/* <div role='cell' className={cn(cellClass('lead'), 'text-muted')}>
        <AssigneeIcon size={15} color='currentColor' />
      </div> */}

      {/* Target date — icon + date once set, and a hover-only add affordance when
          not. Either way the trigger is the same, so adding and editing are one click.
          self-stretch overrides the grid's items-center for this cell alone so the
          trigger can fill it; the padding then insets the hit area from the row
          edges, so its hover highlight reads as a control rather than a band. */}
      <div role='cell' className={cn(cellClass('target'), 'self-stretch p-1.5')}>
        <DatePillPicker
          label=''
          heading='Target date'
          align='end'
          // Trailing column — open the panel leftwards so it doesn't run off-screen.
          contentAlign='end'
          icon={
            project.targetDate ? (
              <CalendarCheckIcon className='h-3.5 w-3.5' />
            ) : (
              <CalendarPlusIcon className='h-3.5 w-3.5' />
            )
          }
          value={toDate(project.targetDate)}
          // A target can't precede its own start date.
          min={toDate(project.startDate)}
          onChange={(date) =>
            updateProject(project.id, { targetDate: date ? Timestamp.fromDate(date) : null })
          }
          triggerClassName={cn(
            // !text-muted is load-bearing: Button's default variant paints
            // text-primary-foreground (near-white), and a currentColor lucide
            // glyph on the light surface would be invisible without it.
            'justify-start gap-1.5 rounded-md !px-1 !text-muted text-xs',
            project.targetDate
              // Set → a compact pill that highlights on hover, like any other cell control.
              ? '!h-6 hover:!bg-elevated hover:!text-foreground'
              // Empty → fills the cell so anywhere in it opens the calendar, but
              // stays chrome-free: only the glyph fades in, no background shift.
              // Opacity doesn't block pointer events, so it's clickable unhovered
              // too; data-state=open keeps it lit while the calendar is up.
              : 'w-full !h-full opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100',
          )}
        />
      </div>

      <div role='cell' className={cn(cellClass('issues'), 'text-muted tabular-nums text-xs')}>
        {progress.total}
      </div>

      {/* Status glyph + progress %, and the picker for the status itself. */}
      <div role='cell' className={cellClass('status')}>
        {/* <IssueCommandBox
          value={project.status}
          onValueChange={(status) => updateProject(project.id, { status })}
          options={PROJECT_STATUSES}
          map={PROJECT_MAP}
          label={`${progress.pct}%`}
          placeholder='Change status to...'
          // Trailing column — open the panel leftwards so it doesn't run off-screen.
          contentAlign='end'
          triggerClassName='!px-1 !text-muted !text-xs'
        /> */}
        <motion.div
            key={statusAnimation}
            initial={{ scale: 0.85, opacity: 0.55 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 550, damping: 26 }}
          >
            <IssueCommandBox
              value={project.status}
              onValueChange={changeStatus}
              options={PROJECT_STATUSES}
              map={PROJECT_MAP}
              placeholder='Change status to...'
              contentAlign='end'
              triggerClassName='!px-0 !py-0 !h-6'
            />
          </motion.div>
      </div>

      <div role='cell' className={cellClass('actions')}>
        <ProjectActionsMenu project={project} issueCount={progress.total} />
      </div>
      </div>
    </motion.div>
  )
}

export default ProjectRow
