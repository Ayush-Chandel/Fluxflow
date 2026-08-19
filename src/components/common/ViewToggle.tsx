
import { Columns3, List } from 'lucide-react'
import { useLayout } from '@/hooks/useViewPreference'
import { cn } from '@/lib/utils'
import type { LayoutMode } from '@/store/viewPreferenceStore'
import { motion } from 'motion/react'

const LAYOUTS: { key: LayoutMode; label: string; Icon: typeof List }[] = [
  { key: 'list', label: 'List view', Icon: List },
  { key: 'board', label: 'Board view', Icon: Columns3 },
]

type Props = {
  viewId: string
  className?: string
}

function ViewToggle({ viewId, className }: Props) {
  const [layout, setLayout] = useLayout(viewId)

  return (
    <div role='group' aria-label='View layout' className={cn('flex items-center bg-elevated rounded-md px-0.5 py-0.5 gap-0.5', className)}>
      {LAYOUTS.map(({ key, label, Icon }) => (
        <button
          key={key}
          type='button'
          onClick={() => setLayout(key)}
          aria-label={label}
          aria-pressed={layout === key}
          className={cn(
            'relative rounded-sm p-1 transition-colors',
            layout === key ? 'text-foreground' : 'text-muted hover:bg-hover',
          )}
        >
          {layout === key && (
            <motion.span
              layoutId={`view-toggle-${viewId}`}
              className='absolute inset-0 rounded-sm bg-surface'
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
          )}
          <Icon className='relative h-3.5 w-3.5' />
        </button>
      ))}
    </div>
  )
}

export default ViewToggle
