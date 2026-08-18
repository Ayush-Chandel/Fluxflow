
import type { ReactNode } from 'react'
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
    <div className='flex min-h-0 flex-1 flex-col' inert={inert}>
      {layout === 'list' ? (
        <div className='min-h-0 flex-1 overflow-y-auto'>{list}</div>
      ) : (
        board
      )}
    </div>
  )
}

export default ViewSurface
