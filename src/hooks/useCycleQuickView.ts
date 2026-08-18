import { useMatch } from 'react-router'
import { isCycleQuickView, type CycleQuickView } from '@/types/cycle'

export function useCycleQuickViewParam(): CycleQuickView | undefined {
  const view = useMatch('/app/cycles/:view')?.params.view
  return isCycleQuickView(view) ? view : undefined
}
