
import { FunnelX } from 'lucide-react'

function NoFilterMatches({ onClear }: { onClear: () => void }) {
  return (
    <div className='flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center'>
      <FunnelX className='h-7 w-7 text-muted' />
      <div>
        <p className='text-sm font-medium text-foreground'>No issues match these filters</p>
        <p className='text-lsm text-muted'>Widen or clear them to see the rest.</p>
      </div>
      <button
        type='button'
        onClick={onClear}
        className='rounded-2xl px-3 py-1.5 text-lsm text-muted transition-colors hover:bg-hover hover:text-foreground'
      >
        Clear filters
      </button>
    </div>
  )
}

export default NoFilterMatches
