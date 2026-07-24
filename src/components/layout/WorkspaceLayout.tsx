import { Outlet } from 'react-router-dom'
import Sidebar from './sidebar/Sidebar'
import { SidebarProvider } from '../ui/sidebar'
import { useSidebarPin } from '@/hooks/useSidebarPin'
import type { NavLabel, SidebarKey } from '@/types/layout'
import { useSidebarKey } from '@/lib/utils'
import { useIssues } from '@/hooks/useIssues'
import Topbar from './Topbar/Topbar'
import CreateIssueDialog from '@/components/modals/CreateIssueDialog'

 function WorkspaceLayout() {

  const { isPinned, pin, unpin } = useSidebarPin(true); 

  const activeKey:SidebarKey = useSidebarKey()?.sidebarKey;

  useIssues();

  const labelGroupList:NavLabel[] = [
          {
              label: 'Projects',
              key: 'projects',
              path: '/app/projects'
          },
          {
              label: 'Issues',
              key: 'issues',
              path: '/app/issues'
          },
          {
              label: 'Cycles',
              key: 'cycles',
              path: '/app/cycles'
          },
      ] 
  
    const labelGroup =  labelGroupList.find((label)=>(activeKey === label.key));

  return (
    <SidebarProvider >
      <div className="flex h-screen bg-background w-full">
        <Sidebar isPinned={isPinned} onPin={pin} onUnpin={unpin} />
        <main className="flex flex-col w-full bg-surface overflow-hidden lg:ml-2 lg:mr-3 lg:mt-3 lg:mb-5 lg:rounded-xl lg:shadow-md" >
            <Topbar isPinned={isPinned} pin={pin} unpin={unpin}topLabel={labelGroup?.label} path={labelGroup?.path}/>
          <div className='flex-1 min-h-0 relative flex flex-col'>
            <Outlet />
          </div>
        </main>
        <CreateIssueDialog />
    </div>
    </SidebarProvider>
  )
}


export { WorkspaceLayout as Component }