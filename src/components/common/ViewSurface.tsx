
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useLayout } from '@/hooks/useViewPreference'

type Props = {
  viewId: string
  list: ReactNode
  board: ReactNode
  /** Applied to the whole surface — e.g. while a detail overlay is open. */
  inert?: boolean
}

function ViewSurface({ viewId, list, board, inert }: Props) {
  const [layout] = useLayout(viewId)

  return (
    <div className='relative flex min-h-0 flex-1 overflow-hidden' inert={inert}>
      {/* `sync` deliberately keeps both surfaces mounted: the outgoing view fades
          away while the incoming one appears, rather than waiting for an exit. */}
      <AnimatePresence initial={false} mode='sync'>
        <motion.div
          key={layout}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className='absolute inset-0 flex min-h-0 flex-col'
        >
          {layout === 'list' ? (
            <div className='min-h-0 flex-1 overflow-y-auto'>{list}</div>
          ) : (
            board
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default ViewSurface
