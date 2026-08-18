// src/components/common/ViewToggle.tsx — the list⇄board switcher (§10.15).
// One component for every surface, writing the layout of whichever `viewId` it
// is pointed at; the views themselves are already built and read the same key.
import { Columns3, List } from 'lucide-react'
import { useLayout } from '@/hooks/useViewPreference'
import { cn } from '@/lib/utils'
import type { LayoutMode } from '@/store/viewPreferenceStore'

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
    <div role='group' aria-label='View layout' className={cn('flex items-center gap-1', className)}>
      {LAYOUTS.map(({ key, label, Icon }) => (
        <button
          key={key}
          type='button'
          onClick={() => setLayout(key)}
          aria-label={label}
          aria-pressed={layout === key}
          className={cn(
            'rounded-md p-1 transition-colors',
            layout === key ? 'bg-elevated text-foreground' : 'text-muted hover:bg-hover',
          )}
        >
          <Icon className='h-3.5 w-3.5' />
        </button>
      ))}
    </div>
  )
}

export default ViewToggle
