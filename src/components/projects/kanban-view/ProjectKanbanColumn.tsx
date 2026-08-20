import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { PlusIcon } from 'lucide-react';
// import { MoreIcon } from '../../icons';
import { PROJECT_MAP } from '../../common/constants/constants';
import type { ProjectRow } from '@/lib/projectSorting';
import type { Project, ProjectStatus } from '@/types/project';
import { useCreateProjectDialog } from '@/store/createProjectDialogStore';
import ProjectCard from './ProjectCard';

type ProjectKanbanColumnProps = {
    status: ProjectStatus;
    group: ProjectRow[];
    onOpenCard?: (project: Project) => void;
}

function ProjectKanbanColumn({status, group, onOpenCard}: ProjectKanbanColumnProps) {

    const {setNodeRef, over} = useDroppable({id: status});

    const openCreateProject = useCreateProjectDialog((s) => s.openWith);
    const createHere = () => openCreateProject({ status });
    const createLabel = `New project in ${PROJECT_MAP[status].label}`;

    const isOverColumn = over != null
        && (over.id === status || group.some((row) => row.project.id === over.id));

    return (
        <div ref={setNodeRef} className={`w-[318px] shrink-0 flex flex-col bg-linear-to-b from-hover-subtle to-surface group pt-3 px-2 rounded-lg ${isOverColumn ? 'ring-1 ring-brand' : ''}`}>
            <div className='flex items-center justify-between pb-5 shrink-0'>
                <div className='flex items-center gap-x-2 text-lsm text-foreground'>
                    {PROJECT_MAP[status].icon}
                    <span>{PROJECT_MAP[status].label}</span>
                    <span>{group.length}</span>
                </div>
                <div className='flex items-center gap-x-2 text-muted'>
                    {/* Column menu — hidden until it has actions to offer. */}
                    {/* <MoreIcon size={14}/> */}
                    <button
                        type='button'
                        onClick={createHere}
                        aria-label={createLabel}
                        className='rounded transition-colors hover:text-foreground'
                    >
                        <PlusIcon size={12}/>
                    </button>
                </div>
            </div>
            <div className='overflow-auto flex-1 min-h-0 pb-4'>
                <div className='space-y-2 px-2 '>
                    <SortableContext items={group.map((row)=>row.project.id)} strategy={verticalListSortingStrategy}>
                        {group.map((row)=>(
                            <ProjectCard
                                key={row.project.id}
                                row={row}
                                onOpen={() => onOpenCard?.(row.project)}
                            />
                        ))}
                    </SortableContext>
                </div>
                {/* Inset by the same px-2 as the cards above, so the ghost lines up
                    with them; w-full then needs no calc against its own margins. */}
                <div className='px-2'>
                    <button
                        type='button'
                        onClick={createHere}
                        aria-label={createLabel}
                        className='w-full rounded-xl border border-edge-subtle bg-raised text-muted items-center invisible opacity-0 transition-all duration-200 group-hover:opacity-100 flex group-hover:visible hover:text-foreground justify-center px-2 py-1.5 pt-3 mt-3'
                    >
                        <PlusIcon size={12}/>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ProjectKanbanColumn
