import { motion } from 'motion/react'
import ShiftingBlocks from '@/components/common/ShiftingBlocks'
import { cn } from '@/lib/utils'


export interface PageLoaderProps {
  /** Line under the mark. Doubles as the screen-reader announcement. */
  label?: string
  delay?: number
  /** Pin to the viewport and paint the page background behind it. */
  fullscreen?: boolean
  className?: string
}

export default function PageLoader({
  label,
  delay = 0,
  fullscreen = false,
  className,
}: PageLoaderProps) {
  return (
    <motion.div
      role='status'
      aria-live='polite'
      initial={delay ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut', delay: delay / 1000 }}
      className={cn(
        'grid place-items-center gap-5',
        fullscreen ? 'fixed inset-0 z-50 bg-background' : 'min-h-40 flex-1',
        className,
      )}
    >
      <ShiftingBlocks />
      {label ? (
        <p className='text-lsm text-muted'>{label}</p>
      ) : (
        <span className='sr-only'>Loading</span>
      )}
    </motion.div>
  )
}
