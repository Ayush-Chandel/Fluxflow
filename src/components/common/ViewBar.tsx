
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

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
  return (
    <div className='flex items-center gap-1'>
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          type='button'
          onClick={() => onChange(key)}
          aria-current={active === key ? 'page' : undefined}
          className={cn(
            'rounded-xl px-2.5 py-1 text-lsm transition-colors',
            active === key ? 'bg-elevated text-foreground' : 'text-muted hover:bg-hover',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default ViewBar
export { ViewTabs }
