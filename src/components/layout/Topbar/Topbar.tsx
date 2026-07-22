import React from 'react'
import { CustomTrigger } from '../sidebar/CustomTrigger'
import { Link, useParams } from 'react-router';
import { useIssueStore } from '@/store/issueStore';

type TopbarProps = {
    isPinned: boolean;
    pin: ()=>void;
    unpin: ()=>void;
    topLabel: string | undefined;
    path: string | undefined;
}

function Topbar({isPinned,pin,unpin,topLabel,path}: TopbarProps) {

    const { identifier } = useParams() 
    const issue = useIssueStore(s =>
     identifier
    ? Object.values(s.issues).find(i => i.identifier === identifier.toUpperCase())
    : undefined)

  return (
    <div className='shrink-0 flex items-center gap-3 border-b-1 border-edge px-3 py-3 text-lsm text-foreground'>
              <CustomTrigger isPinned={isPinned} onPin={pin} onUnpin={unpin} />
              <div className='flex items-center gap-1.5'>
                    <Link to={path || ''} className=' hover:bg-hover px-1 py-0.5 rounded-xl'>{topLabel}</Link>
                {identifier && <span className='text-muted'>›</span>}
                <span className='pl-0.5'>{identifier?.toUpperCase()}</span>
                <span >{issue?.title}</span>
              </div>
    </div>
  )
}

export default Topbar