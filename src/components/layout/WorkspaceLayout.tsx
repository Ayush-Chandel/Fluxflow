import { Outlet, useMatch } from 'react-router-dom'
import Sidebar from './sidebar/Sidebar'
import { SidebarProvider } from '../ui/sidebar'
import { useSidebarPin } from '@/hooks/useSidebarPin'
import type { NavLabel, SidebarControls, SidebarKey } from '@/types/layout'
import { useSidebarKey } from '@/lib/utils'
import { useIssues } from '@/hooks/useIssues'
import { useProjects } from '@/hooks/useProjects'
import { useCycles } from '@/hooks/useCycles'
import Topbar from './Topbar/Topbar'
import CreateIssueDialog from '@/components/modals/CreateIssueDialog'
import CreateProjectModal from '../modals/CreateProjectModal'
import CreateCycleModal from '../modals/CreateCycleModal'
import { useCreateProjectDialog } from '@/store/createProjectDialogStore'
import { useCreateCycleDialog } from '@/store/createCycleDialogStore'
import { useTemplates } from '@/hooks/useTemplates'
import { useBroadcastSync } from '@/hooks/useBroadcastSync'

 function WorkspaceLayout() {

  const { isPinned, pin, unpin } = useSidebarPin(true);

  const activeKey:SidebarKey = useSidebarKey()?.sidebarKey;

  const projectDialogOpen = useCreateProjectDialog((s) => s.open);
  const projectPrefill = useCreateProjectDialog((s) => s.prefill);
  const projectTemplateId = useCreateProjectDialog((s) => s.templateId);
  const closeProjectDialog = useCreateProjectDialog((s) => s.close);

  const cycleDialogOpen = useCreateCycleDialog((s) => s.open);
  const cyclePrefill = useCreateCycleDialog((s) => s.prefill);
  const cycleEditingId = useCreateCycleDialog((s) => s.editingId);
  const closeCycleDialog = useCreateCycleDialog((s) => s.close);

  useIssues();
  useProjects();
  useCycles();
  useTemplates();
  useBroadcastSync();

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
    const isTemplates = useMatch('/app/templates/*');
    

  return (
    <SidebarProvider >
      <div className="flex h-screen bg-background w-full">
        <Sidebar isPinned={isPinned} onPin={pin} onUnpin={unpin} />
        <main className="flex flex-col w-full bg-surface overflow-hidden lg:ml-2 lg:mr-3 lg:mt-3 lg:mb-5 lg:rounded-xl lg:shadow-md" >
            {
              !isTemplates && 
              <Topbar activeKey={activeKey} isPinned={isPinned} pin={pin} unpin={unpin}topLabel={labelGroup?.label} path={labelGroup?.path}/>
            }
          <div className='flex-1 min-h-0 relative flex flex-col'>
            <Outlet context={{ isPinned, pin, unpin } satisfies SidebarControls} />
          </div>
        </main>
        <CreateIssueDialog />
        <CreateProjectModal
          open={projectDialogOpen}
          prefill={projectPrefill ?? undefined}
          templateId={projectTemplateId}
          onClose={closeProjectDialog}
        />
        <CreateCycleModal
          open={cycleDialogOpen}
          prefill={cyclePrefill ?? undefined}
          editingId={cycleEditingId}
          onClose={closeCycleDialog}
        />
    </div>
    </SidebarProvider>
  )
}


export { WorkspaceLayout as Component }
