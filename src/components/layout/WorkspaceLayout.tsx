import { Outlet } from 'react-router-dom'
import Sidebar from './sidebar/Sidebar'
import { SidebarProvider } from '../ui/sidebar'
import { CustomTrigger } from './sidebar/CustomTrigger'
import { useSidebarPin } from '@/hooks/useSidebarPin'
import type { NavLabel, SidebarKey } from '@/types/layout'
import { useSidebarKey } from '@/lib/utils'

 function WorkspaceLayout() {

  const { isPinned, pin, unpin } = useSidebarPin(true); 

  const activeKey:SidebarKey = useSidebarKey()?.sidebarKey;

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
    <main className='w-full bg-surface   ml-2 mr-3 mt-3 mb-5 rounded-xl shadow-md' >
        <div className='flex items-center gap-3 border-b-1 border-edge px-3 py-3'>
          <CustomTrigger isPinned={isPinned} onPin={pin} onUnpin={unpin} />
          <span className='text-sm text-foreground'>{topLabel}</span>
        </div>
      <Outlet />
    </main>
    </div>
    </SidebarProvider>
  )
}


export { WorkspaceLayout as Component }