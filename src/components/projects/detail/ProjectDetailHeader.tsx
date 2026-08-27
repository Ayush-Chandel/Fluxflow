// src/components/projects/detail/ProjectDetailHeader.tsx — identity + properties
// block at the top of a project's Overview.
//
// Every control here writes straight through `updateProject` (optimistic, with
// rollback in the store), so the page has no local draft state to reconcile —
// same call as IssueDetailView. The two text fields are the exception: they
// commit once per editing session via useCommitOnExit rather than on each
// keystroke, so a rename is one Firestore write instead of one per character.
import { Timestamp } from 'firebase/firestore'
import { CalendarCheckIcon, CalendarIcon } from 'lucide-react'
import { toDate } from '@/lib/date'
import { useCommitOnExit } from '@/hooks/useCommitOnExit'
import { useProjectStore } from '@/store/projectStore'
import { PROJECT_PRIORITIES, PROJECT_STATUSES, type Project } from '@/types/project'
import AutoGrowTextarea from '@/components/common/AutoGrowTextarea'
import DatePillPicker from '@/components/common/DatePillPicker'
import ProjectIconPicker from '@/components/common/ProjectIconPicker'
import IssueCommandBox from '@/components/issues/IssueCommandBox'
// import { AssigneeIcon } from '@/components/icons'
import { PRIORITY_MAP, PROJECT_MAP } from '@/components/common/constants/constants'


const PROPERTY_PILL =
  'gap-1.5 !h-6 rounded-md !bg-transparent !px-1.5 !py-0.5 text-lsm !font-normal !text-muted !shadow-none hover:!bg-elevated'

function ProjectDetailHeader({ project }: { project: Project }) {
  const updateProject = useProjectStore((s) => s.updateProject)

  // Keyed on project.id so navigating between projects reseeds the field
  // instead of carrying the previous one's draft across.
  const name = useCommitOnExit(
    project.name,
    (next: string) => {
      const trimmed = next.trim()
      if (!trimmed) return false // a project may never lose its name
      updateProject(project.id, { name: trimmed })
    },
    project.id,
  )

  const summary = useCommitOnExit(
    project.description,
    (next: string) => {
      updateProject(project.id, { description: next.trim() })
    },
    project.id,
  )

  const startDate = toDate(project.startDate)
  const targetDate = toDate(project.targetDate)

  // Moving the start past an existing target would leave the pair inverted, so
  // the target is dropped in the same write — the rule the create modal applies
  // to its local state, applied here to the document.
  const handleStartChange = (next: Date | null) =>
    updateProject(project.id, {
      startDate: next ? Timestamp.fromDate(next) : null,
      ...(next && targetDate && targetDate < next ? { targetDate: null } : {}),
    })

  return (
    <div>
      <ProjectIconPicker
        icon={project.icon}
        color={project.color}
        triggerIconSize={18}
        triggerClassName='h-9 w-9 rounded-xl'
        onChange={({ icon, color }) => updateProject(project.id, { icon, color })}
      />

      {/* Name is one logical line — Enter must not smuggle a newline into it. */}
      <AutoGrowTextarea
        key={project.id}
        defaultValue={project.name}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.preventDefault()
        }}
        onInput={(e) => name.track(e.currentTarget.value)}
        onBlur={name.flush}
        maxLength={256}
        placeholder='Project name'
        className='mt-3 w-full resize-none overflow-hidden bg-transparent text-2xl font-semibold text-foreground outline-none placeholder:text-muted'
      />

      {/* Project.description — the one-line summary list rows and cards show. */}
      <AutoGrowTextarea
        key={`${project.id}-summary`}
        defaultValue={project.description}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.preventDefault()
        }}
        onInput={(e) => summary.track(e.currentTarget.value)}
        onBlur={summary.flush}
        maxLength={256}
        placeholder='Add a short summary...'
        className='mt-1 w-full resize-none overflow-hidden bg-transparent text-sm text-muted outline-none placeholder:text-muted'
      />

      <div className='mt-5 flex items-start gap-4'>
        <span className='mt-1 w-20 shrink-0 text-lsm text-muted'>Properties</span>

        <div className='flex flex-wrap items-center gap-1'>
          <IssueCommandBox
            value={project.status}
            onValueChange={(status) => updateProject(project.id, { status })}
            options={PROJECT_STATUSES}
            map={PROJECT_MAP}
            label={PROJECT_MAP[project.status].label}
            pulseOnValueChange
            placeholder='Change status to...'
            triggerClassName={PROPERTY_PILL}
          />

          <IssueCommandBox
            value={project.priority}
            onValueChange={(priority) => updateProject(project.id, { priority })}
            options={PROJECT_PRIORITIES}
            map={PRIORITY_MAP}
            label={PRIORITY_MAP[project.priority].label}
            pulseOnValueChange
            placeholder='Change priority to...'
            triggerClassName={PROPERTY_PILL}
          />

          {/* Lead — hidden until a member entity exists to resolve `leadId`, the
              same gap the table row and the board card carry. */}
          {/* <span className='flex h-6 items-center gap-1.5 rounded-md px-1.5 text-lsm text-muted'>
            <AssigneeIcon size={14} color='currentColor' />
            Lead
          </span> */}

          <DatePillPicker
            label='Start'
            heading='Start date'
            align='start'
            icon={<CalendarIcon className='h-3.5 w-3.5' />}
            value={startDate}
            onChange={handleStartChange}
            triggerClassName={PROPERTY_PILL}
          />

          <DatePillPicker
            label='Target'
            heading='Target date'
            align='end'
            icon={<CalendarCheckIcon className='h-3.5 w-3.5' />}
            value={targetDate}
            min={startDate}
            onChange={(date) =>
              updateProject(project.id, { targetDate: date ? Timestamp.fromDate(date) : null })
            }
            triggerClassName={PROPERTY_PILL}
          />
        </div>
      </div>
    </div>
  )
}

export default ProjectDetailHeader
