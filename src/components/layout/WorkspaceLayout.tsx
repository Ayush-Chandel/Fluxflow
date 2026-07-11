import { Outlet } from 'react-router-dom'
import Sidebar from './sidebar/Sidebar'
import { ExternalLinkIcon } from '../icons'
import { SidebarProvider } from '../ui/sidebar'
import { CustomTrigger } from './sidebar/CustomTrigger'
import { useSidebarPin } from '@/hooks/useSidebarPin'

 function WorkspaceLayout() {

  const { isPinned, pin, unpin } = useSidebarPin(true); 

  return (
    <SidebarProvider >
      <div className="flex h-screen bg-background w-full">
    <Sidebar isPinned={isPinned} onPin={pin} onUnpin={unpin} />
    <main className='w-full bg-surface px-3 py-3 relative ml-2 mr-3 mt-3 mb-5 rounded-xl shadow-md' >
        <CustomTrigger isPinned={isPinned} onPin={pin} onUnpin={unpin} />
      <Outlet />
    </main>
    </div>
    </SidebarProvider>
  )
}


export { WorkspaceLayout as Component }