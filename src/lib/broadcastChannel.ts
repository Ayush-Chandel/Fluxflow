// src/lib/broadcastChannel.ts — cross-tab sync (§6, mutation pipeline step 3).
// One native BroadcastChannel shared by every store. A mutation in one tab lands
// in the others in ~1ms, ahead of the ~100–300ms Firestore onSnapshot echo.
//
// NOTE: this is a DIFFERENT delta shape from the Firestore snapshot delta in
// useEntitySync (added/modified/removed). This one is what a local store mutation
// publishes to peer tabs, tagged with `entity` so the receiver routes it to the
// right store. Consumption is wired into stores later (build order 16).

// Which store a delta belongs to. Milestones are per-project, so their payload
// carries the projectId the receiver needs.
export type BroadcastEntity = 'issues' | 'projects' | 'cycles' | 'templates' | 'milestones'

export interface BroadcastDelta<T = unknown> {
  entity: BroadcastEntity
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  id: string
  // Full doc for CREATE, partial patch for UPDATE, omitted for DELETE.
  payload?: T
}

const CHANNEL_NAME = 'fluxflow'

// Guard for any non-browser context (tests/SSR); it's native in all real targets.
const channel: BroadcastChannel | null =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null

// Publish a local mutation to peer tabs. The posting tab never receives its own
// message, so there's no self-echo to guard against.
export function broadcastDelta<T>(delta: BroadcastDelta<T>): void {
  channel?.postMessage(delta)
}

// Subscribe to peer-tab mutations. Returns an unsubscribe fn.
export function subscribeToBroadcast(handler: (delta: BroadcastDelta) => void): () => void {
  if (!channel) return () => {}
  const listener = (event: MessageEvent<BroadcastDelta>) => handler(event.data)
  channel.addEventListener('message', listener)
  return () => channel.removeEventListener('message', listener)
}
