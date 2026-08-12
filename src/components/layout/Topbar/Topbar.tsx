import { CustomTrigger } from '../sidebar/CustomTrigger'
import { Link, useParams } from 'react-router';
import { useIssueStore } from '@/store/issueStore';
import { useProjectStore } from '@/store/projectStore';
import { PlayCircleIcon, PlusIcon } from '@/components/icons';
import ProjectIcon from '@/components/common/ProjectIcon';
import { Button } from '@/components/ui/button';
import { useCreateIssueDialog } from '@/store/createIssueDialogStore';
import { useCreateProjectDialog } from '@/store/createProjectDialogStore';
import { useCreateCycleDialog } from '@/store/createCycleDialogStore';
import { useCycleStore } from '@/store/cycleStore';
import { cycleLabel } from '@/types/cycle';
import type { SidebarKey } from '@/types/layout';

type TopbarProps = {
    activeKey: SidebarKey;
    isPinned: boolean;
    pin: ()=>void;
    unpin: ()=>void;
    topLabel: string | undefined;
    path: string | undefined;
}

function Topbar({activeKey,isPinned,pin,unpin,topLabel,path}: TopbarProps) {

    const { identifier, id } = useParams()
    const issue = useIssueStore(s =>
     identifier
    ? Object.values(s.issues).find(i => i.identifier === identifier.toUpperCase())
    : undefined)
    const project = useProjectStore(s => (id ? s.projects[id] : undefined))

    const cycle = useCycleStore(s => (id ? s.cycles[id] : undefined))

    const openCreateIssue = useCreateIssueDialog((s) => s.openWith)
    const openCreateProject = useCreateProjectDialog((s) => s.openWith)
    const openCreateCycle = useCreateCycleDialog((s) => s.openWith)

    // `+` creates whatever the current page is about; every other page falls
    // back to an issue (the workspace's default unit of work).
    const CREATE_BY_KEY = {
        projects: { open: openCreateProject, label: 'Create project' },
        cycles: { open: openCreateCycle, label: 'Create cycle' },
    } as const
    const create = activeKey && activeKey in CREATE_BY_KEY
        ? CREATE_BY_KEY[activeKey as keyof typeof CREATE_BY_KEY]
        : { open: openCreateIssue, label: 'Create issue' }

  return (
    <div className='shrink-0 flex items-center justify-between gap-3 border-b-1 border-edge pl-3 pr-5 py-2.5 text-lsm text-foreground'>
          <div className='flex items-center gap-3'>
                <CustomTrigger isPinned={isPinned} onPin={pin} onUnpin={unpin} />
              <div className='flex items-center gap-1.5'>
                    <Link to={path || ''} className=' hover:bg-hover px-1 py-0.5 rounded-xl'>{topLabel}</Link>
                {identifier && 
                <>
                  <span className='text-muted'>›</span> 
                  <span className='pl-0.5'>{identifier?.toUpperCase()}</span>
                </>
                }
                
                {
                  issue?.title &&
                  <span >{issue?.title}</span>
                }
                {/* Project crumb — the icon is the project's own glyph/colour,
                    not a status one, so it matches the row and card. */}
                {project && (
                  <>
                    <span className='text-muted '>›</span>
                    <span className='flex items-center gap-1.5 pl-1'>
                      <ProjectIcon icon={project.icon} color={project.color} size={13} />
                      <span className='max-w-60 truncate'>{project.name}</span>
                    </span>
                  </>
                )}
                {cycle && (
                  <>
                    <span className='text-muted '>›</span>
                    <span className='flex items-center gap-1.5 pl-1'>
                      <PlayCircleIcon size={13} color='currentColor' className='text-muted' />
                      <span className='max-w-60 truncate'>{cycleLabel(cycle)}</span>
                    </span>
                  </>
                )}
              </div>
          </div>
          <Button
            onClick={() => create.open()}
            aria-label={create.label}
            className='h-fit !px-1.5 py-1.5 hover:bg-hover rounded-full'
          >
            <PlusIcon size={14} />
          </Button>
    </div>
  )
}

export default Topbar