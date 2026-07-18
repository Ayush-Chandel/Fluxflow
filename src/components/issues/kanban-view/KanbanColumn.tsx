import { MoreIcon } from '../../icons';
import { ISSUE_MAP } from '../../common/constants/constants';
import IssueCard from './IssueCard';
import { PlusIcon } from 'lucide-react';
import { useDroppable,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Issue, IssueStatus } from '@/types/issue';

type KanbanColumnProps = {
    status: IssueStatus;
    group: Issue[];
}

function KanbanColumn({status, group}: KanbanColumnProps) {

    // Column = drop target; its id is the status a dropped card will get.
    const {setNodeRef,over} = useDroppable({id: status});

    const isOverColumn = over != null
    && (over.id === status || group.some((issue) => issue.id === over.id));

    return (
        <div ref={setNodeRef} className={`w-[318px] shrink-0 flex flex-col bg-linear-to-b from-hover-subtle to-surface group pt-3 px-2 rounded-lg ${isOverColumn ? 'ring-1 ring-brand' : ''}`}>
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
                    <SortableContext items={group.map((issue)=>issue.id)} strategy={verticalListSortingStrategy}>
                        {group.map((issue)=>(
                            <IssueCard
                                key={issue.id}
                                issue={issue}
                            />
                        ))}
                    </SortableContext>
                </div>
                <div className='rounded-xl border border-edge-subtle bg-raised    items-center invisible opacity-0 transition-all duration-200 group-hover:opacity-100 flex group-hover:visible justify-center px-2 py-1.5 pt-3 mt-3 mx-2'>
                    <PlusIcon size={12}/>
                </div>
            </div>
        </div>
    )
}


export default KanbanColumn;