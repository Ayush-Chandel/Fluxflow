// import { MoreIcon } from '../../icons';
import { ISSUE_MAP } from '../../common/constants/constants';
import IssueCard from './IssueCard';
import { PlusIcon } from 'lucide-react';
import { useDroppable,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AnimatePresence } from 'motion/react';
import { useCreateIssueDialog } from '@/store/createIssueDialogStore';
import type { CreateIssueInput, Issue, IssueStatus } from '@/types/issue';

type KanbanColumnProps = {
    status: IssueStatus;
    group: Issue[];
    onOpenCard?: (issue: Issue) => void;
    /** What the surrounding view is scoped to — a project's or a cycle's issues.
     *  The column stacks its own status on top, so an issue started here lands in
     *  the column it was started from AND in the view it was started in. */
    createPrefill?: Partial<CreateIssueInput>;
}

function KanbanColumn({status, group, onOpenCard, createPrefill}: KanbanColumnProps) {

    // Column = drop target; its id is the status a dropped card will get.
    const {setNodeRef,over} = useDroppable({id: status});

    const openCreateIssue = useCreateIssueDialog((s) => s.openWith);
    const createHere = () => openCreateIssue({ ...createPrefill, status });
    const createLabel = `New issue in ${ISSUE_MAP[status].label}`;

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
                    <SortableContext items={group.map((issue)=>issue.id)} strategy={verticalListSortingStrategy}>
                        <AnimatePresence initial={false}>
                            {group.map((issue)=>(
                                <IssueCard
                                    key={issue.id}
                                    issue={issue}
                                    onOpen={() => onOpenCard?.(issue)}
                                />
                            ))}
                        </AnimatePresence>
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


export default KanbanColumn;
