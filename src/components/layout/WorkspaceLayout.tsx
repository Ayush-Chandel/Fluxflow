import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
 function WorkspaceLayout() {
  return <div className="flex h-screen bg-background">
    <Sidebar />
    <Outlet />
    </div>
}


export { WorkspaceLayout as Component }