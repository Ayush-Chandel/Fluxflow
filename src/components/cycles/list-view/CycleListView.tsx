
import { useCycleRows } from '@/hooks/useCycleSelectors'
import { placeholderIdFor } from '@/lib/optimistic'
import type { Cycle } from '@/types/cycle'
import { AnimatePresence, motion } from 'motion/react'
import CycleDateRail from './CycleDateRail'
import CycleListRow from './CycleListRow'

type Props = {
  onOpenCycle?: (cycle: Cycle) => void
}


function CycleListView({ onOpenCycle }: Props) {
  const rows = useCycleRows()

  return (
    <ul className='px-4 pb-10'>
      <AnimatePresence initial={false}>
        {rows.map((row) => {
          const stableKey = row.cycle.clientRequestId
            ? placeholderIdFor(row.cycle) ?? row.cycle.id
            : row.cycle.id

          return (
            <motion.li
              key={stableKey}
              layout
              initial={{ opacity: 0, y: 8, scaleY: 0.5 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -6, scaleY: 0.8 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className='flex items-stretch gap-8'
            >
              <CycleDateRail row={row} />
              <CycleListRow row={row} onOpen={onOpenCycle} />
            </motion.li>
          )
        })}
      </AnimatePresence>
    </ul>
  )
}

export default CycleListView
