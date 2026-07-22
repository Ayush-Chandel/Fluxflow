import { ISSUE_PRIORITIES, ISSUE_STATUSES, type Issue } from '@/types/issue';
import { memo } from 'react'
import { ISSUE_MAP, PRIORITY_MAP } from '../../common/constants/constants';
import IssueCommandBox from '../IssueCommandBox';
import { Badge } from '../../ui/badge';
import { AssigneeIcon } from '../../icons';
import { formatRelativeTime } from '@/lib/date';
import { useIssueStore } from '@/store/issueStore';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type IssueProps = {
    issue: Issue
    isOverlay?: boolean
    onOpen?: () => void
}

// Row body, memoized. dnd-kit re-renders every sortable on each drag move; the
// shell below is cheap, and since `issue` is reference-stable between store
// writes, memo skips this whole subtree (pickers, badge, date) during drags.
const IssueRowContent = memo(function IssueRowContent({issue}: {issue: Issue}) {

    const updateStatus = useIssueStore((s)=>s.updateStatus);
    const updateIssue = useIssueStore((s)=>s.updateIssue);

    return (
    <>
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
    </>
    )
});

function IssueRow({issue, isOverlay, onOpen}: IssueProps) {

    const {setNodeRef, listeners, attributes, isDragging, over, active, transform, transition} = useSortable({
        id: issue.id,
        disabled: isOverlay,
        animateLayoutChanges: () => true,
    });

    // A drag is hovering this row (and it isn't the dragged row itself).
    const isDropTarget = !isOverlay && active != null
        && over?.id === issue.id && active.id !== issue.id;

    return (
    <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        data-issue-surface
        onClick={isOverlay ? undefined : (e) => {
            if ((e.target as HTMLElement).closest('button')) return;
            onOpen?.();
        }}
        style={{transform: CSS.Transform.toString(transform), transition}}
        className={`w-full h-fit px-5 my-1 py-1 hover:bg-hover-subtle touch-none cursor-pointer
                   flex items-center gap-1 justify-between hover:rounded-md text-foreground text-lsm
                   ${isDragging ? 'opacity-40' : ''} ${isOverlay ? 'shadow-lg bg-surface' : ''}
                   ${isDropTarget ? 'shadow-[0_1px_0_0_var(--color-brand)]' : ''}`}>
        <IssueRowContent issue={issue}/>
    </div>
  )
}

export default IssueRow
