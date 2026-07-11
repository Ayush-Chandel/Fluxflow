import StaggerAccordion from '@/components/common/StaggerAccordion';
import { BoxIcon, CopyIcon, PlayCircleIcon } from '@/components/icons'
import { useSidebarKey } from '@/lib/utils';
import type { Navlinks, SidebarKey } from '@/types/layout';

type Props = {}

function SideContent({}: Props) {

    const activeKey:SidebarKey = useSidebarKey()?.sidebarKey;


    const navlinks:Navlinks[] = [
        {
            path:'/app/projects',
            icon: <BoxIcon className='fill-muted' size={14}/>,
            label: 'Projects',
            key: 'projects'
        },
        {
            path:'/app/issues',
            icon: <CopyIcon className='fill-muted' size={14}/>,
            label: 'Issues',
            key: 'issues'
        },
        {
            path:'/app/cycles',
            icon: <PlayCircleIcon className='fill-muted' size={14}/>,
            label: 'Cycles',
            key: 'cycles'
        },
    ] 

  return (
    <div className='mt-10'>
        <StaggerAccordion label='Workspace'  navlinks={navlinks}
        activeKey={activeKey}
        />
    </div>
  )
}

export default SideContent