
import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'

function ViewBar({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-2 px-3 pt-2.5 pb-1.5 text-xs text-muted',
        className,
      )}
    >
      {children}
    </div>
  )
}

export interface ViewTab<K extends string> {
  key: K
  label: string
}


function ViewTabs<K extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: ViewTab<K>[]
  active: K
  onChange: (tab: K) => void
}) {
  const indicatorId = useId()

  return (
    <div className='flex items-center gap-0.5 rounded-md bg-elevated px-0.5 py-0.5'>
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          type='button'
          onClick={() => onChange(key)}
          aria-current={active === key ? 'page' : undefined}
          className={cn(
            'relative rounded-md px-2 py-1 text-xs transition-colors',
            active === key ? 'text-foreground' : 'text-muted hover:bg-hover',
          )}
        >
          {active === key && (
            <motion.span
              layoutId={`view-tabs-${indicatorId}`}
              className='absolute inset-0 rounded-md bg-surface'
              transition={{ type: 'spring', stiffness: 600, damping: 32 }}
            />
          )}
          <span className='relative'>{label}</span>
        </button>
      ))}
    </div>
  )
}

export default ViewBar
export { ViewTabs }
