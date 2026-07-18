import { Outlet } from 'react-router-dom'
import Sidebar from './sidebar/Sidebar'
import { SidebarProvider } from '../ui/sidebar'
import { CustomTrigger } from './sidebar/CustomTrigger'
import { useSidebarPin } from '@/hooks/useSidebarPin'
import type { NavLabel, SidebarKey } from '@/types/layout'
import { useSidebarKey } from '@/lib/utils'
import { useIssues } from '@/hooks/useIssues'

 function WorkspaceLayout() {

  const { isPinned, pin, unpin } = useSidebarPin(true); 

  const activeKey:SidebarKey = useSidebarKey()?.sidebarKey;

  useIssues();

  const labelGroup:NavLabel[] = [
          {
              label: 'Projects',
              key: 'projects'
          },
          {
              label: 'Issues',
              key: 'issues'
          },
          {
              label: 'Cycles',
              key: 'cycles'
          },
      ] 
  
    const topLabel =  labelGroup.find((label)=>(activeKey === label.key))?.label;

  return (
    <SidebarProvider >
      <div className="flex h-screen bg-background w-full">
        <Sidebar isPinned={isPinned} onPin={pin} onUnpin={unpin} />
        <main className="flex flex-col w-full bg-surface overflow-hidden lg:ml-2 lg:mr-3 lg:mt-3 lg:mb-5 lg:rounded-xl lg:shadow-md" >
            <div className='shrink-0 flex items-center gap-3 border-b-1 border-edge px-3 py-3'>
              <CustomTrigger isPinned={isPinned} onPin={pin} onUnpin={unpin} />
              <span className='text-sm text-foreground'>{topLabel}</span>
            </div>
          <div className='flex-1 min-h-0 relative flex flex-col'>
            <Outlet />
          </div>
        </main>
    </div>
    </SidebarProvider>
  )
}


export { WorkspaceLayout as Component }