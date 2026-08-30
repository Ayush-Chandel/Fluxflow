import { memo } from 'react';
import { CalendarCheckIcon } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { formatDateShort, toDate } from '@/lib/date';
import type { ProjectRow } from '@/lib/projectSorting';
import { PROJECT_PRIORITIES, PROJECT_STATUSES, type Project } from '@/types/project';
import { useProjectStore } from '@/store/projectStore';
import IssueCommandBox from '../../issues/IssueCommandBox';
// import { AssigneeIcon } from '../../icons';
import { PRIORITY_MAP, PROJECT_MAP } from '../../common/constants/constants';
import {
    DEFAULT_PROJECT_COLOR,
    resolveProjectIcon,
} from '../../common/constants/projectIcons';
import ProjectActionsMenu from '../ProjectActionsMenu';
import { motion } from 'motion/react'

type ProjectCardProps = {
    row: ProjectRow
    isOverlay?: boolean
    onOpen?: () => void
}

// Target dates are day-granular, so a target is only late once its whole day is
// over — and a finished project is never late, however old its date.
const isOverdue = (project: Project, target: Date | null) => {
    if (!target || project.status === 'completed' || project.status === 'cancelled') return false;
    const endOfDay = new Date(target);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay.getTime() < Date.now();
};

// Memoized like IssueCardContent: dnd re-renders the whole column on every
// pointer move, and only the dragged card's transform actually changes.
const ProjectCardContent = memo(function ProjectCardContent({
    row,
    isOverlay,
}: {
    row: ProjectRow
    isOverlay?: boolean
}) {

    const {project, progress} = row;

    const updateProject = useProjectStore((s)=>s.updateProject);

    // `icon` stores a registry KEY ('box', 'layers'), so it resolves to a component.
    const { icon: ProjectIcon } = resolveProjectIcon(project.icon);

    const target = toDate(project.targetDate);
    const summary = project.description.trim();

    return (
        <>
            <div className='flex items-center gap-2'>
                <ProjectIcon
                    size={14}
                    className='shrink-0'
                    style={{ color: project.color || DEFAULT_PROJECT_COLOR }}
                />
                <span className='min-w-0 flex-1 truncate text-lsm text-foreground'>{project.name}</span>

                {/* Status and priority edit in place, same pickers as the table row.
                    Their trigger stops propagation, so a pick never opens the project;
                    the fall-through click once the popover closes is what
                    data-card-surface below guards against. */}
                <div className='flex shrink-0 items-center gap-2'>
                    <IssueCommandBox
                        value={project.status}
                        onValueChange={(status) => updateProject(project.id, { status })}
                        options={PROJECT_STATUSES}
                        map={PROJECT_MAP}
                        placeholder='Change status to...'
                        contentAlign='end'
                        triggerClassName='!px-0 !py-0 !h-6'
                    />
                    <IssueCommandBox
                        value={project.priority}
                        onValueChange={(priority) => updateProject(project.id, { priority })}
                        options={PROJECT_PRIORITIES}
                        map={PRIORITY_MAP}
                        pulseOnValueChange
                        placeholder='Change priority to...'
                        contentAlign='end'
                        triggerClassName='!px-0 !py-0 !h-6'
                    />
                    {!isOverlay && <ProjectActionsMenu project={project} issueCount={progress.total} />}
                    {/* Lead — hidden until a member entity exists to resolve `leadId`. */}
                    {/* <AssigneeIcon size={15} color='currentColor' className='shrink-0' /> */}
                </div>
            </div>

            {/* Only when set: an empty summary leaves the card compact rather than
                holding a blank line, which is how the reference board reads. */}
            {summary && <p className='line-clamp-2'>{summary}</p>}

            {target && (
                <div className={cn('flex items-center gap-1.5', isOverdue(project, target) && 'text-destructive')}>
                    <CalendarCheckIcon className='h-3.5 w-3.5 shrink-0' />
                    <span>{formatDateShort(target)}</span>
                </div>
            )}

            {/* The milestone chip the reference shows here is still unbuilt, but
                no longer blocked: milestones are a map field on the project doc
                (§4), so project.milestones is already on this card's row. */}

            <div className='pt-1 tabular-nums'>
                {progress.total} {progress.total === 1 ? 'issue' : 'issues'}
            </div>
        </>
    );
});

function ProjectCard({row, isOverlay, onOpen}: ProjectCardProps) {

    const {project} = row;
    const {setNodeRef, listeners, attributes, isDragging, transform, transition} = useSortable({
        id: project.id,
        disabled: isOverlay,
        animateLayoutChanges: () => true,
        transition: {
            duration: 300,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',   // fast start, long soft landing
        },
    });

  return (
    <motion.div
        initial={!isOverlay ? { opacity: 0, x: -24 } : false}
        animate={{ opacity: 1, x: 0, height: 'auto' }}
        exit={{ opacity: 0, scale: 0.94, height: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className='overflow-hidden'
    >
      <div
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          data-card-surface
          onClick={isOverlay ? undefined : (e) => {
              if ((e.target as HTMLElement).closest('button')) return;
              onOpen?.();
          }}
          style={{transform: CSS.Transform.toString(transform), transition}}
          className={cn(
              'group bg-raised-high hover:bg-hover-subtle transition-colors duration-100 px-2.5 pt-2 pb-3 rounded-xl border-edge-subtle border text-xs text-muted space-y-1 touch-none cursor-pointer',
              isDragging ? 'border-edge bg-hover-subtle [&>*]:invisible' : '',
              isOverlay ? 'shadow-lg cursor-grabbing' : '',
          )}
          >
        <motion.div
            animate={isOverlay
            ? { scale: 1.015, y: -2, boxShadow: '0 14px 28px rgb(0 0 0 / 0.16)' }
            : { scale: 1, y: 0, boxShadow: '0 0 0 rgb(0 0 0 / 0)' }
            }
            transition={{ type: 'spring', stiffness: 480, damping: 32 }}
        >
            <ProjectCardContent row={row} isOverlay={isOverlay} />
        </motion.div>
            </div>
        </motion.div>
  )
}

export default ProjectCard
