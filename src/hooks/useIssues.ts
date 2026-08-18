
import { useEntitySync } from '@/hooks/useEntitySync'
import { cacheKey } from '@/lib/idb'
import { useAuthStore } from '@/store/authStore'
import { useIssueStore } from '@/store/issueStore'
import type { Issue } from '@/types/issue'


export const ISSUES_VIEW_ID = 'issues'

export function useIssues() {
  const ws = useAuthStore((s) => s.user?.workspaceId)
  const setAll = useIssueStore((s) => s.setAll)
  const applyDelta = useIssueStore((s) => s.applyDelta)
  const selectAll = useIssueStore((s) => s.selectAll)

  // Empty path/key until authed → the engine no-ops, then re-subscribes on ws.
  useEntitySync<Issue>(
    ws ? `workspaces/${ws}/issues` : '',
    ws ? cacheKey.issues(ws) : '',
    { setAll, applyDelta, selectAll },
  )
}
