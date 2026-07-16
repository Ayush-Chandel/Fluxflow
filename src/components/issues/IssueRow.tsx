import { ISSUE_PRIORITIES, ISSUE_STATUSES, type Issue, type IssuePriority, type IssueStatus } from '@/types/issue';
import { useState } from 'react'
import { ISSUE_MAP, PRIORITY_MAP } from '../common/constants/constants';
import IssueCommandBox from './IssueCommandBox';
import { Badge } from '../ui/badge';
import { AssigneeIcon } from '../icons';
import { formatRelativeTime } from '@/lib/date';
import { useIssueStore } from '@/store/issueStore';

type IssueProps = {
    issue: Issue
}

function IssueRow({issue}: IssueProps) {

    const updateStatus = useIssueStore((s)=>s.updateStatus);
    const updateIssue = useIssueStore((s)=>s.updateIssue);

    return (
    <div className='w-full h-fit px-5 my-1 py-1 hover:bg-hover-subtle
                   flex items-center gap-1 justify-between rounded-md text-foreground text-lsm'>

        <div className='flex items-center gap-1 flex-1 min-w-0'>
            <IssueCommandBox
                value={issue.priority}
                onValueChange={(value)=>{updateIssue(issue.id,{priority:value})}}
                options={ISSUE_PRIORITIES}
                map={PRIORITY_MAP}
                placeholder="Change Priority to..."
                triggerClassName='!px-2'
            />
            <span className='text-lsm '>{issue?.identifier}</span>
            <IssueCommandBox
                value={issue.status}
                onValueChange={(value)=>{updateStatus(issue.id,value)}}
                options={ISSUE_STATUSES}
                map={ISSUE_MAP}
                placeholder="Change Status to..."
                triggerClassName='!px-1'
            />
            <span className='text-lsm min-w-0 max-w-[70%] truncate'>{issue.title}</span>
        </div>
        <div className='flex items-center gap-2 shrink-0'>
            <Badge variant="outline" className='hidden  border-edge text-muted md:flex items-center gap-1.5 bg-surface'>
                <span className='rounded-full bg-[oklch(0.72_0.17_302)] h-2 w-2'></span>
                Outline
            </Badge>
            <AssigneeIcon color='currentColor' className='text-muted'/>
            <span className='text-muted hidden sm:inline'>{formatRelativeTime(issue?.updatedAt)}</span>
        </div>
    </div>
  )
}

export default IssueRow
