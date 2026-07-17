import { ISSUE_STATUSES, type Issue, } from '@/types/issue'
import { useState } from 'react'
import IssueCard from './IssueCard';
import { useIssueStore } from '@/store/issueStore';
import { getDropPatch, sortIssues } from '@/lib/issueOrdering';
import {
    closestCorners,
    DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
    type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';

type IssueKanbanProps = {
    issues:Issue[];
}


function IssueKanbanView({issues}: IssueKanbanProps) {
    

  const updateIssue = useIssueStore((s)=>s.updateIssue);
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

  // Require 5px of movement before a drag starts, so plain clicks still reach
  // the pickers inside the card.
  const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 5}}));

  const groupedIssues = Object.fromEntries(ISSUE_STATUSES.map((status)=>(
    [status, sortIssues(issues.filter((issue)=>issue.status === status))]
  )));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveIssue(issues.find((issue)=>issue.id === event.active.id) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveIssue(null);
    const {active, over} = event;
    if (!over) return;
    const issue = issues.find((i)=>i.id === active.id);
    if (!issue) return;
    // Persist status + position in one optimistic write (rollback in the store).
    const patch = getDropPatch(issue, String(over.id), groupedIssues);
    if (patch) updateIssue(issue.id, patch);
  };

  return (
    <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={()=>setActiveIssue(null)}
    >
        <div className='pt-4  pl-3 pr-2 flex gap-x-2 overflow-x-auto  flex-1 min-h-0'>
            {ISSUE_STATUSES.map((status)=>(
                <KanbanColumn key={status} status={status} group={groupedIssues[status]}/>
            ))}
        </div>
        {/* Card that follows the pointer; the original stays in place, dimmed. */}
        <DragOverlay
            dropAnimation={{
                duration: 250,
                easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
            }}
        >
            {activeIssue && <IssueCard issue={activeIssue} isOverlay/>}
        </DragOverlay>
    </DndContext>
  )
}

export default IssueKanbanView
