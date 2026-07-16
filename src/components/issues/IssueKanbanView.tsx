import { ISSUE_STATUSES, type Issue, type IssueStatus } from '@/types/issue'
import { useState } from 'react'
import { MoreIcon } from '../icons';
import { ISSUE_MAP } from '../common/constants/constants';
import IssueCard from './IssueCard';
import { PlusIcon } from 'lucide-react';
import { useIssueStore } from '@/store/issueStore';
import {
    DndContext, DragOverlay, PointerSensor, useDroppable, useSensor, useSensors,
    type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';

type IssueKanbanProps = {
    issues:Issue[];
}

type KanbanColumnProps = {
    status: IssueStatus;
    group: Issue[];
}

function KanbanColumn({status, group}: KanbanColumnProps) {
    console.log('here amns');
    

    // Column = drop target; its id is the status a dropped card will get.
    const {setNodeRef, isOver} = useDroppable({id: status});

    return (
        <div ref={setNodeRef} className={`w-[318px] shrink-0 flex flex-col bg-linear-to-b from-hover-subtle to-surface pt-3 px-2 rounded-lg ${isOver ? 'ring-1 ring-brand' : ''}`}>
            <div className='flex items-center justify-between pb-5 shrink-0'>
                <div className='flex items-center gap-x-2 text-lsm text-foreground'>
                    {ISSUE_MAP[status].icon}
                    <span>{ISSUE_MAP[status].label}</span>
                    <span>{group.length}</span>
                </div>
                <div className='flex items-center gap-x-2'>
                    <MoreIcon size={14}/>
                    <PlusIcon size={12}/>
                </div>
            </div>
            <div className='overflow-auto flex-1 min-h-0 pb-4'>
                <div className='space-y-2 px-2 '>
                    {group.map((issue)=>(
                        <IssueCard
                            key={issue.id}
                            issue={issue}
                        />
                    ))}
                </div>
                <div className='flex items-center justify-center pt-3'>
                    <PlusIcon size={12}/>
                </div>
            </div>
        </div>
    )
}

function IssueKanbanView({issues}: IssueKanbanProps) {

    console.log('here in kanban');
    
  const updateStatus = useIssueStore((s)=>s.updateStatus);
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

  // Require 5px of movement before a drag starts, so plain clicks still reach
  // the pickers inside the card.
  const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 5}}));

  const groupedIssues = Object.fromEntries(ISSUE_STATUSES.map((status)=>(
    [status,issues.filter((issue)=>issue.status === status)]
  )));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveIssue(issues.find((issue)=>issue.id === event.active.id) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveIssue(null);
    const {active, over} = event;
    if (!over) return;
    const newStatus = over.id as IssueStatus;
    const issue = issues.find((i)=>i.id === active.id);
    if (issue && issue.status !== newStatus) updateStatus(issue.id, newStatus);
  };

  return (
    <DndContext
        sensors={sensors}
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
        <DragOverlay>
            {activeIssue && <IssueCard issue={activeIssue} isOverlay/>}
        </DragOverlay>
    </DndContext>
  )
}

export default IssueKanbanView
