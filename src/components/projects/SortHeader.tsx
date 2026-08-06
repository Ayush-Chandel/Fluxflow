
import { ArrowUpIcon } from '@/components/icons'
import { cn } from '@/lib/utils'
import { useViewPreferenceStore, type OrderBy, type SortDir } from '@/store/viewPreferenceStore'
import { PROJECT_CELL, type ProjectColumn } from './projectColumns'

type Props = {
  column: ProjectColumn
  /** Sort preference key of the table this header belongs to. */
  viewId: string
  orderBy: OrderBy
  sortDir: SortDir
}

function SortHeader({ column, viewId, orderBy, sortDir }: Props) {
  const toggleSort = useViewPreferenceStore((s) => s.toggleSort)

  // Read into a local so the narrowing survives into the click handler.
  const sortKey = column.sortKey
  const active = sortKey !== null && orderBy === sortKey

  // Not sortable (no field behind it) → a plain label, not a button.
  if (sortKey === null) {
    return (
      <div
        role='columnheader'
        className={cn(PROJECT_CELL, column.className, 'text-muted pl-0 text-xs')}
      >
        <span className='truncate'>{column.label}</span>
      </div>
    )
  }

  return (
    <div
      role='columnheader'
      // The a11y equivalent of the arrow — this is what replaces <th> semantics.
      aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn(PROJECT_CELL, column.className, 'pl-0 text-xs')}
    >
      <button
        type='button'
        onClick={() => toggleSort(viewId, sortKey)}
        className={cn(
          // Named group so this hover can't be confused with the row-level `group`
          // that drives ProjectRow's add-target affordance.
          'group/sort flex min-w-0 items-center gap-1 rounded px-1 py-0.5 transition-colors hover:text-foreground',
          active ? 'text-foreground' : 'text-muted',
        )}
      >
        <span className='truncate'>{column.label}</span>
        <ArrowUpIcon
          size={12}
          // The icon ships a fixed default fill; currentColor makes it track the
          // button's muted → foreground states instead.
          color='currentColor'
          className={cn(
            'mt-0.5 shrink-0 transition-[opacity,transform] duration-150',
            // There is no ArrowDownIcon — descending is the same glyph, flipped.
            active && sortDir === 'desc' && 'rotate-180',
            // Only the sorted column keeps its arrow; the others preview on hover,
            // pointing up because a fresh column always starts ascending.
            active ? 'opacity-100' : 'opacity-0 group-hover/sort:opacity-100',
          )}
        />
      </button>
    </div>
  )
}

export default SortHeader
