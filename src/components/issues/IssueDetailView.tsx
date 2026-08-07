import { motion } from 'motion/react';
import IssueCommandBox from './IssueCommandBox';
import AutoGrowTextarea from '../common/AutoGrowTextarea';
import { useCommitOnExit } from '@/hooks/useCommitOnExit';
import { useIssueStore } from '@/store/issueStore';
import { ISSUE_PRIORITIES, ISSUE_STATUSES, type Issue } from '@/types/issue';
import { ISSUE_MAP, PRIORITY_MAP } from '../common/constants/constants';
import { MOCK_ISSUES } from './__mockIssues';

type IssueDetailViewProps = {
    identifier: string;
}

function IssueDetailView({identifier}: IssueDetailViewProps) {

    const storeIssue = useIssueStore(s =>
        Object.values(s.issues).find(i => i.identifier === identifier.toUpperCase()))
    // TEMP: falls back to seed data until real issues exist — remove with the mock file.
    const issue = storeIssue ?? MOCK_ISSUES.find(i => i.identifier === identifier.toUpperCase())

    if (!issue) {
        return (
            <motion.div className='absolute inset-0 z-10 bg-surface grid place-items-center text-muted'>
                Issue not found
            </motion.div>
        )
    }

    return <IssueDetail issue={issue} />
}

// Split from the lookup above so the edit hooks can sit below the "not found"
// early return without breaking the rules of hooks.
function IssueDetail({ issue }: { issue: Issue }) {

    const updateStatus = useIssueStore((s)=>s.updateStatus);
    const updateIssue = useIssueStore((s)=>s.updateIssue);

    // Title/description commit once per editing session — on blur, on unmount
    // (breadcrumb back-nav) or on tab-hide/refresh, whichever comes first.
    const title = useCommitOnExit(
        issue.title,
        (next: string) => {
            const trimmed = next.trim()
            if (!trimmed) return false // an issue may never lose its title
            updateIssue(issue.id, { title: trimmed })
        },
        issue.id,
    )

    const description = useCommitOnExit(
        issue.description,
        (next: string) => { updateIssue(issue.id, { description: next }) },
        issue.id,
    )

  return (
    <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.15 }}
     className='absolute inset-0 z-10 bg-surface overflow-y-auto px-10 md:px-24 pt-10 md:pt-20 pb-20 flex flex-col sm:flex-row items-start gap-x-15 gap-y-10'>
        <div className='flex flex-col gap-y-6 w-[70%] min-w-0'>
            <AutoGrowTextarea
              key={issue.id}
              defaultValue={issue.title}
              onKeyDown={(e) => {
                // Title is a single logical line: Enter shouldn't insert a newline.
                if (e.key === 'Enter') e.preventDefault()
              }}
              onInput={(e) => title.track(e.currentTarget.value)}
              onBlur={title.flush}
              className='w-full shrink-0 resize-none overflow-hidden bg-transparent outline-none text-2xl text-foreground font-semibold'
              placeholder='Issue title'
            />
            <AutoGrowTextarea
              key={`${issue.id}-desc`}
              defaultValue={issue.description}
              onInput={(e) => description.track(e.currentTarget.value)}
              onBlur={description.flush}
              className='mt-4 w-full shrink-0 min-h-40 resize-none overflow-hidden bg-transparent text-lsm outline-none text-muted'
              placeholder='Add description…'
            />

        </div>
        <div className='sticky top-10 self-start'>
            <h6 className='pb-4'>Properties</h6>
            <div className='flex flex-col  items-start gap-2'>
                <IssueCommandBox
                value={issue.priority}
                onValueChange={(value)=>{updateIssue(issue.id,{priority:value})}}
                options={ISSUE_PRIORITIES}
                map={PRIORITY_MAP}
                placeholder="Change Priority to..."
                triggerClassName='!px-2 hover:bg-hover !py-1 !h-6 rounded-full text-lsm !text-muted'
                label={issue.priority}
                />
                <IssueCommandBox
                    value={issue.status}
                    onValueChange={(value)=>{updateStatus(issue.id,value)}}
                    options={ISSUE_STATUSES}
                    map={ISSUE_MAP}
                    placeholder="Change Status to..."
                    triggerClassName='!px-2 hover:bg-hover !py-1 !h-6 rounded-full text-lsm !text-muted'
                    label={issue.status}
                />
            </div>
        </div>
    </motion.div>
  )
}

export default IssueDetailView