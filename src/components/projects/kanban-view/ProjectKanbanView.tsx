import { PROJECT_STATUSES, type Project } from '@/types/project'
import {
    closestCorners, DndContext, DragOverlay, MeasuringStrategy, PointerSensor, useSensor, useSensors,
    type DragEndEvent, type DragOverEvent, type DragStartEvent,
} from '@dnd-kit/core';
import ProjectKanbanColumn from './ProjectKanbanColumn';
import { useRef, useState } from 'react';
import ProjectCard from './ProjectCard';
import { findGroupOf, getDropPatch, orderBetween, type ProjectGroups } from '@/lib/projectOrdering';
import { pointerDownStartedOnCardSurface } from '@/lib/openGuard';
import { useProjectBoardGroups } from '@/hooks/useProjectSelectors';
import { useProjectStore } from '@/store/projectStore';

type ProjectKanbanProps = {
    onOpenProject?: (project: Project) => void;
}

function ProjectKanbanView({onOpenProject}: ProjectKanbanProps) {

    const updateProject = useProjectStore((s)=>s.updateProject);

    const boardGroups = useProjectBoardGroups();

    const [activeId, setActiveId] = useState<string | null>(null);
    const [dragProjectGroups, setDragProjectGroups] = useState<ProjectGroups | null>(null);
    const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 5}}));

    const justDragged = useRef(false);

    // Mid-drag the local snapshot wins, so a card can sit in a column the store
    // doesn't know about yet; the drop is what commits it.
    const groups = dragProjectGroups ?? boardGroups;

    const activeRow = activeId
        ? Object.values(groups).flat().find((row)=>row.project.id === activeId) ?? null
        : null;

    const handleDragStart = (event:DragStartEvent)=>{
        justDragged.current = true;
        setActiveId(String(event.active.id));
        setDragProjectGroups(boardGroups);
    }

    const handleDragOver = (event: DragOverEvent)=>{
        const {active, over} = event;
        if (!over) return;
        const activeCardId = String(active.id);
        const overId = String(over.id);

        setDragProjectGroups((prev)=>{
            if (!prev) return prev;
            const from = findGroupOf(prev, activeCardId);
            const to = findGroupOf(prev, overId);
            if (!from || !to || from === to) return prev;
            const moving = prev[from].find((row)=>row.project.id === activeCardId);
            if (!moving) return prev;

            const toList = prev[to];
            const overIndex = toList.findIndex((row)=>row.project.id === overId);

            const isBelow = active.rect.current.translated != null
                && active.rect.current.translated.top > over.rect.top + over.rect.height;
            const newIndex = overIndex >= 0 ? overIndex + (isBelow ? 1 : 0) : toList.length;

            return {
                ...prev,
                [from]: prev[from].filter((row)=>row.project.id !== activeCardId),
                [to]: [...toList.slice(0, newIndex), moving, ...toList.slice(newIndex)],
            };
        });
    }

    const handleDragEnd = (event: DragEndEvent)=>{
        const {active, over} = event;
        const finalGroups = dragProjectGroups ?? boardGroups;
        const activeCardId = String(active.id);
        setActiveId(null);
        setDragProjectGroups(null);
        setTimeout(() => { justDragged.current = false; }, 0);
        if (!over) return;

        const project = Object.values(finalGroups).flat()
            .find((row)=>row.project.id === activeCardId)?.project;
        if (!project) return;

        // Crossed columns during the drag: the snapshot already holds the slot the
        // card landed in, so the neighbours come straight off it.
        const landedIn = findGroupOf(finalGroups, activeCardId);
        if (landedIn && landedIn !== project.status) {
            const list = finalGroups[landedIn];
            const idx = list.findIndex((row)=>row.project.id === activeCardId);
            updateProject(project.id, {
                status: landedIn,
                sortOrder: orderBetween(list[idx - 1], list[idx + 1]),
            });
            return;
        }

        const patch = getDropPatch(project, String(over.id), finalGroups);
        if (patch) updateProject(project.id, patch);
    }

    const handleDragCancel = ()=>{
        setActiveId(null);
        setDragProjectGroups(null);
        setTimeout(() => { justDragged.current = false; }, 0);
    }

    // Skip a stray open: the post-drop click dnd-kit fires, or the fall-through
    // click after a card's status/priority popover closes.
    const openCard = (project: Project) => {
        if (justDragged.current || !pointerDownStartedOnCardSurface()) return;
        onOpenProject?.(project);
    }

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
            {
                PROJECT_STATUSES.map((status)=>(
                    <ProjectKanbanColumn
                        key={status}
                        status={status}
                        group={groups[status] ?? []}
                        onOpenCard={openCard}
                    />
                ))
            }
        </div>
        {/* Card that follows the pointer; the original stays in place, dimmed. */}
        <DragOverlay
            dropAnimation={{
                    duration: 250,
                    easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
                }}
        >
            {activeRow && <ProjectCard row={activeRow} isOverlay/>}
        </DragOverlay>
    </DndContext>
  )
}

export default ProjectKanbanView
