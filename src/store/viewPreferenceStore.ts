
import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { idb } from '@/lib/idb'

export type LayoutMode = 'list' | 'board'
export type GroupBy = 'status' | 'priority' | 'assignee' | 'project' | 'cycle' | 'none'

export type OrderBy =
  | 'manual' | 'priority' | 'created' | 'updated' | 'title'
  | 'name' | 'status' | 'lead' | 'target' | 'issues' | 'progress'

export type SortDir = 'asc' | 'desc'


export interface ViewPreference {
  layout: LayoutMode
  groupBy: GroupBy
  orderBy: OrderBy
  sortDir: SortDir
}

export const DEFAULT_PREFERENCE: ViewPreference = {
  layout: 'list',
  groupBy: 'status',
  orderBy: 'manual',
  sortDir: 'asc',
}

interface ViewPreferenceState {
  // Keyed by a stable viewId (e.g. 'issues', 'projects', 'project:<id>:issues').
  preferences: Record<string, ViewPreference>
  getPreference: (viewId: string) => ViewPreference
  setPreference: (viewId: string, patch: Partial<ViewPreference>) => void
  setLayout: (viewId: string, layout: LayoutMode) => void
  setGroupBy: (viewId: string, groupBy: GroupBy) => void
  setOrderBy: (viewId: string, orderBy: OrderBy) => void
  setSortDir: (viewId: string, sortDir: SortDir) => void
  /** Table-header click: same column flips direction, a new column starts ascending. */
  toggleSort: (viewId: string, orderBy: OrderBy) => void
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
      getPreference: (viewId) => ({ ...DEFAULT_PREFERENCE, ...get().preferences[viewId] }),
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
      setSortDir: (viewId, sortDir) => get().setPreference(viewId, { sortDir }),

      toggleSort: (viewId, orderBy) => {
        const current = get().getPreference(viewId)
        get().setPreference(viewId, {
          orderBy,
          sortDir:
            current.orderBy === orderBy && current.sortDir === 'asc' ? 'desc' : 'asc',
        })
      },
    }),
    {
      name: 'view-preferences',
      storage: createJSONStorage(() => idbStorage),
    },
  ),
)
