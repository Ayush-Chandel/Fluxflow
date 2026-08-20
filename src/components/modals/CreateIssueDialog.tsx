import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Dialog as DialogPrimitive, VisuallyHidden } from 'radix-ui'
import CreateIssueModal from './CreateIssueModal'
import CreateIssueMinimizedBar from './CreateIssueMinimizedBar'
import { useCreateIssueDialog } from '@/store/createIssueDialogStore'
import { cn } from '@/lib/utils'
import {
  CREATE_ISSUE_LAYOUT_ID,
  CREATE_ISSUE_MODAL_LAYOUT_TRANSITION,
  CREATE_ISSUE_MORPH_CONTENT_DELAY,
  createIssueContentFade,
} from './sharedLayout'

function CreateIssueDialog() {
  const open = useCreateIssueDialog((s) => s.open)
  const minimized = useCreateIssueDialog((s) => s.minimized)
  const maximized = useCreateIssueDialog((s) => s.maximized)
  const prefill = useCreateIssueDialog((s) => s.prefill)
  const setOpen = useCreateIssueDialog((s) => s.setOpen)
  const setMinimized = useCreateIssueDialog((s) => s.setMinimized)
  const toggleMaximized = useCreateIssueDialog((s) => s.toggleMaximized)
  const close = useCreateIssueDialog((s) => s.close)

  const showDialog = open && !minimized

  const wasMinimized = useRef(minimized)
  const contentFade = createIssueContentFade(
    wasMinimized.current ? CREATE_ISSUE_MORPH_CONTENT_DELAY : 0,
  )
  useEffect(() => {
    wasMinimized.current = minimized
  })

  return (
    <>
      <DialogPrimitive.Root open={showDialog} onOpenChange={setOpen}>
        <AnimatePresence>
          {showDialog && (
            <DialogPrimitive.Portal forceMount>
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  className='fixed inset-0 z-50 bg-black/50'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                />
              </DialogPrimitive.Overlay>

              {/* Mirrors the positioner in ui/dialog.tsx, but transparent to
                  pointer events so backdrop clicks still land on the overlay. */}
              <div className='pointer-events-none fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4'>
                <DialogPrimitive.Content asChild forceMount>
                  <motion.div
                    layoutId={CREATE_ISSUE_LAYOUT_ID}
                    className={cn(
                      'pointer-events-auto relative grid w-full gap-0 rounded-3xl bg-surface p-0 shadow-lg outline-none',
                      maximized ? 'mt-[6vh] w-[92vw] sm:max-w-4xl' : 'mt-[12vh] sm:max-w-2xl',
                    )}
                    // No `scale` here: it writes the same `transform` that layout
                    // projection owns, and the two fight. Projection does the geometry.
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={CREATE_ISSUE_MODAL_LAYOUT_TRANSITION}
                  >
                    <VisuallyHidden.Root>
                      <DialogPrimitive.Title>Create issue</DialogPrimitive.Title>
                    </VisuallyHidden.Root>
                    <motion.div {...contentFade}>
                      <CreateIssueModal
                        prefill={prefill ?? undefined}
                        onClose={close}
                        maximized={maximized}
                        onMinimize={() => setMinimized(true)}
                        onToggleMaximize={toggleMaximized}
                      />
                    </motion.div>
                  </motion.div>
                </DialogPrimitive.Content>
              </div>
            </DialogPrimitive.Portal>
          )}
        </AnimatePresence>
      </DialogPrimitive.Root>

      {/* Minimized view. Shares `layoutId` with the dialog surface above, so the
          two morph into each other — only ever one of them is mounted. */}
      <AnimatePresence>
        {open && minimized && <CreateIssueMinimizedBar />}
      </AnimatePresence>
    </>
  )
}

export default CreateIssueDialog
