
import type { Issue } from '@/types/issue'
import type { Milestone, Project } from '@/types/project'
import type { Cycle } from '@/types/cycle'
import type { Template } from '@/types/template'


export type BroadcastEntity = 'issues' | 'projects' | 'cycles' | 'templates' | 'milestones'


type EntityDelta<E extends BroadcastEntity, T> =
  | { entity: E; workspaceId: string; type: 'CREATE'; id: string; payload: T }
  | { entity: E; workspaceId: string; type: 'UPDATE'; id: string; payload: Partial<T> }
  | { entity: E; workspaceId: string; type: 'DELETE'; id: string }


type MilestoneDelta =
  | {
      entity: 'milestones'
      workspaceId: string
      type: 'CREATE'
      id: string
      payload: { projectId: string; milestone: Milestone }
    }
  | {
      entity: 'milestones'
      workspaceId: string
      type: 'UPDATE'
      id: string
      payload: { projectId: string; patch: Partial<Milestone> }
    }
  | {
      entity: 'milestones'
      workspaceId: string
      type: 'DELETE'
      id: string
      payload: { projectId: string }
    }

export type BroadcastDelta =
  | EntityDelta<'issues', Issue>
  | EntityDelta<'projects', Project>
  | EntityDelta<'cycles', Cycle>
  | EntityDelta<'templates', Template>
  | MilestoneDelta


export type EntityBroadcast<E extends BroadcastEntity> = Extract<BroadcastDelta, { entity: E }>

const CHANNEL_NAME = 'fluxflow'


const channel: BroadcastChannel | null =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null


export function broadcastDelta(delta: BroadcastDelta): void {
  channel?.postMessage(delta)
}

export function subscribeToBroadcast(handler: (delta: BroadcastDelta) => void): () => void {
  if (!channel) return () => {}
  const listener = (event: MessageEvent<BroadcastDelta>) => handler(event.data)
  channel.addEventListener('message', listener)
  return () => channel.removeEventListener('message', listener)
}
