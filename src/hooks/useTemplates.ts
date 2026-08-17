
import { useEntitySync } from '@/hooks/useEntitySync'
import { cacheKey } from '@/lib/idb'
import { useAuthStore } from '@/store/authStore'
import { useTemplateStore } from '@/store/templateStore'
import type { Template } from '@/types/template'

export function useTemplates() {
  const ws = useAuthStore((s) => s.user?.workspaceId)
  const setAll = useTemplateStore((s) => s.setAll)
  const applyDelta = useTemplateStore((s) => s.applyDelta)
  const selectAll = useTemplateStore((s) => s.selectAll)

  // Empty path/key until authed → the engine no-ops, then re-subscribes on ws.
  useEntitySync<Template>(
    ws ? `workspaces/${ws}/templates` : '',
    ws ? cacheKey.templates(ws) : '',
    { setAll, applyDelta, selectAll },
  )
}
