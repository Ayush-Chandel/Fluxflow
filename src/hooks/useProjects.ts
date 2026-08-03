
import { useEntitySync } from '@/hooks/useEntitySync'
import { cacheKey } from '@/lib/idb'
import { useAuthStore } from '@/store/authStore'
import { useProjectStore } from '@/store/projectStore'
import type { Project } from '@/types/project'

export function useProjects() {
  const ws = useAuthStore((s) => s.user?.workspaceId)
  const setAll = useProjectStore((s) => s.setAll)
  const applyDelta = useProjectStore((s) => s.applyDelta)
  const selectAll = useProjectStore((s) => s.selectAll)

  // Empty path/key until authed → the engine no-ops, then re-subscribes on ws.
  useEntitySync<Project>(
    ws ? `workspaces/${ws}/projects` : '',
    ws ? cacheKey.projects(ws) : '',
    { setAll, applyDelta, selectAll },
  )
}
