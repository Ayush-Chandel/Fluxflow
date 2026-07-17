import { useIssueStore } from '@/store/issueStore';
import { ISSUE_PRIORITIES, ISSUE_STATUSES, type Issue } from '@/types/issue'
import { memo } from 'react'
import IssueCommandBox from './IssueCommandBox';
import { ISSUE_MAP, PRIORITY_MAP } from '../common/constants/constants';
import { AssigneeIcon } from '../icons';
import { formatRelativeTime } from '@/lib/date';
import { Badge } from '../ui/badge';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

type IssueCardProps = {
    issue: Issue
    /** true when rendered inside <DragOverlay> — not a drag source itself */
    isOverlay?: boolean
}


const IssueCardContent = memo(function IssueCardContent({issue}: {issue: Issue}) {

    const updateStatus = useIssueStore((s)=>s.updateStatus);
    const updateIssue = useIssueStore((s)=>s.updateIssue);

    return (
    <>
        <div className='flex items-center gap-2 justify-between'>
            <span >{issue?.identifier}</span>
            <AssigneeIcon color='currentColor' className='text-muted'/>
        </div>
        <div className='flex items-center gap-2'>
            <IssueCommandBox
                value={issue.status}
                onValueChange={(value)=>{updateStatus(issue.id,value)}}
                options={ISSUE_STATUSES}
                map={ISSUE_MAP}
                placeholder="Change Status to..."
                triggerClassName='!px-0 !py-0 !h-6'
            />
            <span className='text-lsm min-w-0 max-w-[70%] truncate text-foreground'>{issue.title}</span>
        </div>
        <div className='flex items-center gap-2'>
            <IssueCommandBox
                value={issue.priority}
                onValueChange={(value)=>{updateIssue(issue.id,{priority:value})}}
                options={ISSUE_PRIORITIES}
                map={PRIORITY_MAP}
                placeholder="Change Priority to..."
                triggerClassName='!px-0 !py-0 !h-6'
            />
            <Badge variant="outline" className='hidden  border-edge text-muted md:flex items-center gap-1.5 bg-surface'>
                <span className='rounded-full bg-[oklch(0.72_0.17_302)] h-2 w-2'></span>
                Outline
            </Badge>
        </div>
        <div className='flex items-center gap-2 pt-1'>
            <span className='text-muted hidden sm:inline'>{formatRelativeTime(issue?.updatedAt)}</span>
        </div>
    </>
    )
});

function IssueCard({issue, isOverlay}: IssueCardProps) {

    const {setNodeRef, listeners, attributes, isDragging, transform, transition} = useSortable({
        id: issue.id,
        disabled: isOverlay,
        transition: {
        duration: 300,
        easing: 'cubic-bezier(0.25, 1, 0.5, 1)',   // fast start, long soft landing
    },

    });

  return (
    <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        style={{transform: CSS.Transform.toString(transform), transition}}
        className={cn(`bg-raised-high hover:bg-hover-subtle transition-colors duration-100 px-2.5 pt-2 pb-3 rounded-xl border-edge-subtle border text-xs text-muted space-y-1 touch-none`,isDragging ? 'border-edge bg-hover-subtle [&>*]:invisible' : '', isOverlay ? 'shadow-lg cursor-grabbing' : '')}>
        <IssueCardContent issue={issue}/>
    </div>
  )
}

export default IssueCard
