import { useIssueStore } from '@/store/issueStore';
import { ISSUE_PRIORITIES, ISSUE_STATUSES, type Issue } from '@/types/issue'
import React from 'react'
import IssueCommandBox from './IssueCommandBox';
import { ISSUE_MAP, PRIORITY_MAP } from '../common/constants/constants';
import { AssigneeIcon } from '../icons';
import { formatRelativeTime } from '@/lib/date';
import { Badge } from '../ui/badge';
import { useDraggable } from '@dnd-kit/core';

type IssueCardProps = {
    issue: Issue
    /** true when rendered inside <DragOverlay> — not a drag source itself */
    isOverlay?: boolean
}

function IssueCard({issue, isOverlay}: IssueCardProps) {
    console.log('incard');
    

    const updateStatus = useIssueStore((s)=>s.updateStatus);
    const updateIssue = useIssueStore((s)=>s.updateIssue);

    const {setNodeRef, listeners, attributes, isDragging} = useDraggable({
        id: issue.id,
        disabled: isOverlay,
    });

  return (
    <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={`bg-raised-high px-2.5 pt-2 pb-3 rounded-xl border-edge-subtle border text-xs text-muted space-y-1 touch-none
            ${isDragging ? 'opacity-40' : ''} ${isOverlay ? 'shadow-lg cursor-grabbing' : 'cursor-grab'}`}>
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
    </div>
  )
}

export default IssueCard