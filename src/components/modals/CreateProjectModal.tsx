import { cn } from '@/lib/utils'
import type { CreateProjectInput } from '@/types/project'
import { XIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog'
import { VisuallyHidden } from 'radix-ui'


type CreateProjectModalProps = {
    open:boolean;
    /** Fields a trigger pre-selected — read once the form fields land. */
    prefill?: Partial<CreateProjectInput>;
    onClose?: () => void;
}

const HEADER_BTN =
  'flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-foreground'



function CreateProjectModal({
    open,
    onClose
}: CreateProjectModalProps) {


  return (
       <Dialog open={open} onOpenChange={(next) => { if (!next) onClose?.() }}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            'translate-y-0 gap-0 rounded-3xl bg-surface p-0 top-[6vh] w-[92vw] sm:max-w-4xl',
          )}
        >
          <VisuallyHidden.Root>
            <DialogTitle>Create project</DialogTitle>
          </VisuallyHidden.Root>
              <div
                className={cn(
                    'flex flex-col pl-2.5 p-4 min-h-[70vh] max-h-[88vh]',
                )}
                >
                    {/* Breadcrumb header */}
                    <div className='flex shrink-0 items-center gap-2'>
                        <div className='flex items-center gap-1.5 rounded-full border border-edge px-2 py-0.5 text-xs text-muted'>
                        New Project
                        </div>
                        {/* Window controls */}
                        <div className='ml-auto flex items-center gap-1'>
                        <button type='button' onClick={onClose} className={HEADER_BTN} aria-label='Close'>
                            <XIcon className='h-4 w-4' />
                        </button>
                        </div>
                    </div>

                </div>
        </DialogContent>
      </Dialog>
  )
}



export default CreateProjectModal