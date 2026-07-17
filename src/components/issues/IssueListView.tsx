import { useViewPreferenceStore } from '@/store/viewPreferenceStore';
import { ISSUE_STATUSES, type Issue } from '@/types/issue'
import { useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { CollapseArrowIcon } from '../icons';
import { ISSUE_MAP } from '../common/constants/constants';
import IssueRow from './IssueRow';
import { useIssueStore } from '@/store/issueStore';
import { getDropPatch, sortIssues } from '@/lib/issueOrdering';
import {
    closestCorners,
    DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
    type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

type IssueListProps = {
    issues:Issue[];
}

function IssueListView({issues}: IssueListProps) {

  const groupBy =  useViewPreferenceStore().getPreference('issues').groupBy;

  const updateIssue = useIssueStore((s)=>s.updateIssue);
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

  // Require 5px of movement before a drag starts, so plain clicks still reach
  // the pickers inside the row.
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
                           <div className='w-full h-fit px-2
                            flex items-center gap-2 rounded-md bg-raised text-foreground text-lsm'>
                            <AccordionTrigger className='py-2'>
                                <CollapseArrowIcon size={18}/>
                            </AccordionTrigger>
                            {ISSUE_MAP[status].icon}
                            <span >{ISSUE_MAP[status].label}</span>
                            <span>{group.length}</span>
                           </div>
                        <AccordionContent className='pb-0'>
                            <SortableContext items={group.map((issue)=>issue.id)} strategy={verticalListSortingStrategy}>
                                {group.map((issue)=>(
                                    <IssueRow key={issue.id} issue={issue} />
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
