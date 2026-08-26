import StaggerAccordion from '@/components/common/StaggerAccordion';
import { BoxIcon, CopyIcon, NoteIcon, PlayCircleIcon } from '@/components/icons'
import { useSidebarKey } from '@/lib/utils';
import type { NavItem, SidebarKey } from '@/types/layout';

function SideContent({ onNavigate }: { onNavigate: () => void }) {

    const activeKey:SidebarKey = useSidebarKey()?.sidebarKey;


    const navItems: NavItem[] = [
        { path:'/app/projects', icon:<BoxIcon className='fill-muted' size={14}/>, label:'Projects', key:'projects' },
        { path:'/app/issues',   icon:<CopyIcon className='fill-muted' size={14}/>, label:'Issues',   key:'issues' },
        {
            path:'/app/cycles',
            icon:<PlayCircleIcon className='fill-muted' size={14}/>,
            label:'Cycles',
            key:'cycles',
            children: [
                { path:'/app/cycles/current',  label:'Current' },
                { path:'/app/cycles/upcoming', label:'Upcoming' },
            ],
        },
        {
            icon: <NoteIcon className='fill-muted' size={13}/>,
            label: 'Templates',
            key: 'templates',
            children: [
                { path:'/app/templates/issues',   label:'Issues' },
                { path:'/app/templates/projects', label:'Projects' },
            ],
        },
    ]


  return (
    <div className='mt-10'>
        <StaggerAccordion label='Workspace'  navItems={navItems}
        activeKey={activeKey} onNavigate={onNavigate}
        />
    </div>
  )
}

export default SideContent
