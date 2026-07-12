
import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { idb } from '@/lib/idb'

export type LayoutMode = 'list' | 'board'
export type GroupBy = 'status' | 'priority' | 'assignee' | 'project' | 'cycle' | 'none'
export type OrderBy = 'manual' | 'priority' | 'created' | 'updated' | 'title'


export interface ViewPreference {
  layout: LayoutMode
  groupBy: GroupBy
  orderBy: OrderBy
}

const DEFAULT_PREFERENCE: ViewPreference = {
  layout: 'list',
  groupBy: 'status',
  orderBy: 'manual',
}

interface ViewPreferenceState {
  // Keyed by a stable viewId (e.g. 'issues', 'project:<id>:issues', 'cycle:<id>').
  preferences: Record<string, ViewPreference>
  getPreference: (viewId: string) => ViewPreference
  setPreference: (viewId: string, patch: Partial<ViewPreference>) => void
  setLayout: (viewId: string, layout: LayoutMode) => void
  setGroupBy: (viewId: string, groupBy: GroupBy) => void
  setOrderBy: (viewId: string, orderBy: OrderBy) => void
}

// Zustand persist expects a string key/value store; back it with idb-keyval so
// preferences live in IndexedDB alongside the entity caches, not localStorage.
const idbStorage: StateStorage = {
  getItem: (name) => idb.get<string>(name).then((value) => value ?? null),
  setItem: (name, value) => idb.set(name, value),
  removeItem: (name) => idb.del(name),
}

export const useViewPreferenceStore = create<ViewPreferenceState>()(
  persist(
    (set, get) => ({
      preferences: {},
      getPreference: (viewId) => get().preferences[viewId] ?? DEFAULT_PREFERENCE,
      setPreference: (viewId, patch) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            [viewId]: { ...(state.preferences[viewId] ?? DEFAULT_PREFERENCE), ...patch },
          },
        })),
      setLayout: (viewId, layout) => get().setPreference(viewId, { layout }),
      setGroupBy: (viewId, groupBy) => get().setPreference(viewId, { groupBy }),
      setOrderBy: (viewId, orderBy) => get().setPreference(viewId, { orderBy }),
    }),
    {
      name: 'view-preferences',
      storage: createJSONStorage(() => idbStorage),
    },
  ),
)
