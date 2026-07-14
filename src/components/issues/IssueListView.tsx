import { useViewPreferenceStore } from '@/store/viewPreferenceStore';
import { ISSUE_STATUSES, type Issue } from '@/types/issue'
import React from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { CollapseArrowIcon } from '../icons';
import { ISSUE_MAP } from '../common/constants/constants';
import IssueRow from './IssueRow';

type IssueListProps = {
    issues:Issue[];
}

function IssueListView({issues}: IssueListProps) {

  const groupBy =  useViewPreferenceStore().getPreference('issues').groupBy;
  
  
 const groupedIssues = Object.fromEntries(ISSUE_STATUSES.map((status)=>(
    [status,issues.filter((issue)=>issue.status === status)]
  )));

  

  return (
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
                            {group.map((issue)=>(
                                <IssueRow key={issue.id} issue={issue} />
                            ))}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>)})}
    </div>
  )
}

export default IssueListView