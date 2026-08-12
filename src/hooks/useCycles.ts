// src/hooks/useCycles.ts — thin wrapper binding the cycle store to the sync
// engine. Called once in WorkspaceLayout alongside useIssues/useProjects.
import { useEntitySync } from '@/hooks/useEntitySync'
import { cacheKey } from '@/lib/idb'
import { useAuthStore } from '@/store/authStore'
import { useCycleStore } from '@/store/cycleStore'
import type { Cycle } from '@/types/cycle'

export function useCycles() {
  const ws = useAuthStore((s) => s.user?.workspaceId)
  const setAll = useCycleStore((s) => s.setAll)
  const applyDelta = useCycleStore((s) => s.applyDelta)
  const selectAll = useCycleStore((s) => s.selectAll)

  // Empty path/key until authed → the engine no-ops, then re-subscribes on ws.
  useEntitySync<Cycle>(
    ws ? `workspaces/${ws}/cycles` : '',
    ws ? cacheKey.cycles(ws) : '',
    { setAll, applyDelta, selectAll },
  )
}
