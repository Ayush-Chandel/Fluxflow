
import { ISSUE_STATUSES, type Issue, type IssueStatus } from '@/types/issue'
import { useRef, useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../ui/accordion';
import { CollapseArrowIcon } from '../../icons';
import { ISSUE_MAP } from '../../common/constants/constants';
import IssueRow from './IssueRow';
import { useIssueStore } from '@/store/issueStore';
import { getDropAfterPatch, sortIssues } from '@/lib/issueOrdering';
import { pointerDownStartedOnCardSurface } from '@/lib/openGuard';
import {
    closestCorners,
    DndContext, DragOverlay, PointerSensor, useDroppable, useSensor, useSensors,
    type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, type SortingStrategy } from '@dnd-kit/sortable';

const keepRowsInPlace: SortingStrategy = () => null;

type IssueListProps = {
    issues:Issue[];
    onOpenIssue?: (issue: Issue) => void;
}

function GroupHeader({status, count}: {status: IssueStatus; count: number}) {
    const {setNodeRef, isOver} = useDroppable({id: status});

    return (
        <div ref={setNodeRef} className={`w-full h-fit px-2
            flex items-center gap-2  bg-raised hover:rounded-md text-foreground text-lsm
            ${isOver ? 'shadow-[0_1px_0_0_var(--color-brand)] ' : ''}`}>
            <AccordionTrigger className='py-2'>
                <CollapseArrowIcon size={18}/>
            </AccordionTrigger>
            {ISSUE_MAP[status].icon}
            <span >{ISSUE_MAP[status].label}</span>
            <span>{count}</span>
        </div>
    )
}

function IssueListView({issues, onOpenIssue}: IssueListProps) {

  const updateIssue = useIssueStore((s)=>s.updateIssue);
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

  const justDragged = useRef(false);

  // Require 5px of movement before a drag starts, so plain clicks still reach
  // the pickers inside the row.
  const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 5}}));

  const groupedIssues = Object.fromEntries(ISSUE_STATUSES.map((status)=>(
    [status, sortIssues(issues.filter((issue)=>issue.status === status))]
  )));

  const handleDragStart = (event: DragStartEvent) => {
    justDragged.current = true;
    setActiveIssue(issues.find((issue)=>issue.id === event.active.id) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveIssue(null);
    setTimeout(() => { justDragged.current = false; }, 0);
    const {active, over} = event;
    if (!over) return;
    const issue = issues.find((i)=>i.id === active.id);
    if (!issue) return;
    // Land the row right below the one the indicator line was under —
    // one optimistic write (rollback in the store).
    const patch = getDropAfterPatch(issue, String(over.id), groupedIssues);
    if (patch) updateIssue(issue.id, patch);
  };

  return (
    <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={()=>{
            setActiveIssue(null);
            setTimeout(() => { justDragged.current = false; }, 0);
        }}
    >
    <div className='mt-4  px-2'>
        {ISSUE_STATUSES.map((status,index)=>{
            const group = groupedIssues[status]
            if (group.length === 0) return null
            return (
            <div key={`${status}-${index}`}>
                <Accordion
                    type="single" collapsible defaultValue="item-1">
                    <AccordionItem value="item-1"
                    >
                           <GroupHeader status={status} count={group.length}/>
                        <AccordionContent className='pb-0'>
                            <SortableContext items={group.map((issue)=>issue.id)} strategy={keepRowsInPlace}>
                                {group.map((issue)=>(
                                    <IssueRow
                                        key={issue.id}
                                        issue={issue}
                                        onOpen={() => {
                                            // Skip the post-drop stray click and the picker-close fall-through.
                                            if (justDragged.current || !pointerDownStartedOnCardSurface()) return;
                                            onOpenIssue?.(issue);
                                        }}
                                    />
                                ))}
                            </SortableContext>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>)})}
    </div>
    {/* Row that follows the pointer; the original stays in place, dimmed. */}
    <DragOverlay>
        {activeIssue && <IssueRow issue={activeIssue} isOverlay/>}
    </DragOverlay>
    </DndContext>
  )
}

export default IssueListView
