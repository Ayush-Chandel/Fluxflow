
import { useEffect } from 'react'
import { subscribeToBroadcast } from '@/lib/broadcastChannel'
import { useAuthStore } from '@/store/authStore'
import { useIssueStore } from '@/store/issueStore'
import { useProjectStore } from '@/store/projectStore'
import { useCycleStore } from '@/store/cycleStore'
import { useTemplateStore } from '@/store/templateStore'

export function useBroadcastSync() {
  const ws = useAuthStore((s) => s.user?.workspaceId)

  useEffect(() => {

    if (!ws) return

    const { applyBroadcast: applyIssue } = useIssueStore.getState()
    const { applyBroadcast: applyProject, applyMilestoneBroadcast: applyMilestone } =
      useProjectStore.getState()
    const { applyBroadcast: applyCycle } = useCycleStore.getState()
    const { applyBroadcast: applyTemplate } = useTemplateStore.getState()

    return subscribeToBroadcast((delta) => {
      if (delta.workspaceId !== ws) return

      switch (delta.entity) {
        case 'issues':
          applyIssue(delta)
          break
        case 'projects':
          applyProject(delta)
          break
        case 'milestones':
          // No store of its own — a map field on the project doc (§4).
          applyMilestone(delta)
          break
        case 'cycles':
          applyCycle(delta)
          break
        case 'templates':
          applyTemplate(delta)
          break
        default: {
          const unrouted: never = delta
          void unrouted
        }
      }
    })
  }, [ws])
}
