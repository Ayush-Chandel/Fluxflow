
import { useCallback } from 'react'
import {
  DEFAULT_PREFERENCE,
  useViewPreferenceStore,
  type LayoutMode,
} from '@/store/viewPreferenceStore'


export function useLayout(viewId: string): [LayoutMode, (layout: LayoutMode) => void] {
  const layout = useViewPreferenceStore(
    (s) => (s.preferences[viewId] ?? DEFAULT_PREFERENCE).layout,
  )
  const setLayout = useViewPreferenceStore((s) => s.setLayout)

  // Bound per viewId so the toggle's onClick stays referentially stable.
  const set = useCallback((next: LayoutMode) => setLayout(viewId, next), [setLayout, viewId])

  return [layout, set]
}
