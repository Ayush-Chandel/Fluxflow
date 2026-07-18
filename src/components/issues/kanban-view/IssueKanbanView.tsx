import { ISSUE_STATUSES, type Issue, type IssueStatus } from '@/types/issue'
import { useState } from 'react'
import IssueCard from './IssueCard';
import { useIssueStore } from '@/store/issueStore';
import { getDropPatch, orderBetween, sortIssues } from '@/lib/issueOrdering';
import {
    closestCorners,
    DndContext, DragOverlay, MeasuringStrategy, PointerSensor, useSensor, useSensors,
    type DragEndEvent, type DragOverEvent, type DragStartEvent,
} from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';

type IssueKanbanProps = {
    issues:Issue[];
}

type Groups = Record<string, Issue[]>;

// Which status group holds this card in the given snapshot — or, when the id
// itself is a column id, that column.
const findGroupOf = (groups: Groups, id: string): IssueStatus | null =>
    ISSUE_STATUSES.find((status)=>groups[status].some((i)=>i.id === id))
    ?? (ISSUE_STATUSES.includes(id as IssueStatus) ? (id as IssueStatus) : null);

function IssueKanbanView({issues}: IssueKanbanProps) {

  const updateIssue = useIssueStore((s)=>s.updateIssue);
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

  const [dragGroups, setDragGroups] = useState<Groups | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 5}}));

  const groupedIssues = Object.fromEntries(ISSUE_STATUSES.map((status)=>(
    [status, sortIssues(issues.filter((issue)=>issue.status === status))]
  )));

  const groups = dragGroups ?? groupedIssues;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveIssue(issues.find((issue)=>issue.id === event.active.id) ?? null);
    setDragGroups(groupedIssues);
  };


  const handleDragOver = (event: DragOverEvent) => {
    const {active, over} = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    setDragGroups((prev)=>{
        if (!prev) return prev;
        const from = findGroupOf(prev, activeId);
        const to = findGroupOf(prev, overId);
        if (!from || !to || from === to) return prev;
        const moving = prev[from].find((i)=>i.id === activeId);
        if (!moving) return prev;

        const toList = prev[to];
        const overIndex = toList.findIndex((i)=>i.id === overId);

        const isBelow = active.rect.current.translated != null
            && active.rect.current.translated.top > over.rect.top + over.rect.height;
        const newIndex = overIndex >= 0 ? overIndex + (isBelow ? 1 : 0) : toList.length;

        return {
            ...prev,
            [from]: prev[from].filter((i)=>i.id !== activeId),
            [to]: [...toList.slice(0, newIndex), moving, ...toList.slice(newIndex)],
        };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const {active, over} = event;
    const finalGroups = dragGroups ?? groupedIssues;
    setActiveIssue(null);
    setDragGroups(null);
    if (!over) return;
    const issue = issues.find((i)=>i.id === active.id);
    if (!issue) return;
    const activeId = String(active.id);


    const landedIn = findGroupOf(finalGroups, activeId);
    if (landedIn && landedIn !== issue.status) {
        const list = finalGroups[landedIn];
        const idx = list.findIndex((i)=>i.id === activeId);
        updateIssue(issue.id, {
            status: landedIn,
            sortOrder: orderBetween(list[idx - 1], list[idx + 1]),
        });
        return;
    }

    const patch = getDropPatch(issue, String(over.id), finalGroups);
    if (patch) updateIssue(issue.id, patch);
  };

  const handleDragCancel = () => {
    setActiveIssue(null);
    setDragGroups(null);
  };

  return (
    <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        measuring={{droppable: {strategy: MeasuringStrategy.Always}}}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
    >
        <div className='pt-4  pl-3 pr-2 flex gap-x-2 overflow-x-auto  flex-1 min-h-0'>
            {ISSUE_STATUSES.map((status)=>(
                <KanbanColumn key={status} status={status} group={groups[status]}/>
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
