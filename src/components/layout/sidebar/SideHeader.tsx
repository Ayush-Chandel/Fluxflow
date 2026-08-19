import {  ChevronDownIcon,  ExternalLinkIcon } from '../../icons'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { authService } from '@/services/authService'
import { useCreateIssueDialog } from '@/store/createIssueDialogStore'

function SideHeader() {
  const openCreateIssue = useCreateIssueDialog((s) => s.openWith)

  return (
    <div className='flex justify-between items-center'>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" onClick={()=>{}} className='flex gap-2 bg-background hover:bg-[oklch(0.94_0.00_264)] px-2 py-1 rounded-xl transition-colors duration-100 border-none shadow-none'>
            <div className='bg-blue-400 w-[22px] h-[22px] rounded-full flex items-center justify-center text-white text-[12px]'>P</div>
            <span className='text-[14px] font-medium'>
                Project
            </span>
            <ChevronDownIcon size={12}/>
        </Button>
        </PopoverTrigger>
        <PopoverContent className='w-[150px] bg-surface text-lsm rounded-xl p-2' align="start" side="bottom" sideOffset={6}>
          <button onClick={()=>{authService.signOut()}} className="text-foreground hover:bg-hover px-1 py-1 rounded-md w-full text-left">Sign Out</button>
        </PopoverContent>
      </Popover>

        <div className='flex gap-1'>
          <button
            type='button'
            aria-label='Create issue'
            onClick={() => openCreateIssue()}
            className='p-1.5 rounded-full bg-surface border-edge border'
          >
            <ExternalLinkIcon size={14} />
          </button>
        </div>
    </div>
  )
}

export default SideHeader
