// src/lib/optimistic.ts — the plumbing shared by every optimistic mutation (§6).
//
// A PLACEHOLDER is a row that exists only in this client until the server
// answers. Only the two server-created entities need one (issues and cycles mint
// their id server-side, so there is nothing to insert under); projects and
// templates mint their own id and write the real document straight away.
//
// Three rules keep placeholders from leaking, and each one closes a defect the
// naive version had:
//
//  · they are NEVER written to the IndexedDB cache (`withoutOptimistic`). The
//    cache is merged from docChanges(), which can only ever ADD — so a tab
//    closed mid-create used to leave a 'LIN-…' row that no snapshot would ever
//    remove, on screen forever.
//  · a full reconcile keeps only the ones still in flight (`reconcileInto`), so
//    a placeholder stranded by an older build is pruned on the first snapshot
//    rather than inherited.
//  · the id embeds a `clientRequestId` that travels to the server and is stored
//    on the created document (`placeholderIdFor`), so whichever arrives first —
//    the snapshot or the POST response — the swap happens in one commit and the
//    placeholder is never on screen next to the real row.

const PREFIX = 'optimistic-'

// Ids of placeholders whose server write is still outstanding. Module scope
// rather than store state because the sync engine has to consult it while
// rebuilding a store's map, and it is deliberately per-tab: a peer tab that
// hears about a placeholder over the BroadcastChannel is not the one waiting on
// it, and must not treat it as its own in-flight write.
const inFlight = new Set<string>()

export const isOptimisticId = (id: string) => id.startsWith(PREFIX)

/**
 * Opens a placeholder. The returned `clientRequestId` must be sent to the create
 * endpoint, which stores it on the document — that is what lets `applyDelta`
 * recognise an incoming server doc as THIS placeholder's replacement.
 */
export function beginOptimistic(): { tempId: string; clientRequestId: string } {
  const clientRequestId = randomId()
  const tempId = `${PREFIX}${clientRequestId}`
  inFlight.add(tempId)
  return { tempId, clientRequestId }
}

/** Closes a placeholder. Call it on BOTH the success and the failure path. */
export function endOptimistic(tempId: string) {
  inFlight.delete(tempId)
}

/**
 * The placeholder id a server document came back for, or null if it wasn't
 * created through one. Intentionally pure — it does not consult `inFlight`, so
 * a peer tab that only heard the placeholder over the BroadcastChannel resolves
 * the same swap. Deleting an id that isn't there is a no-op.
 */
export const placeholderIdFor = (doc: { clientRequestId?: string | null }) =>
  doc.clientRequestId ? `${PREFIX}${doc.clientRequestId}` : null

/** The cache view of a store: placeholders stripped. */
export const withoutOptimistic = <T extends { id: string }>(docs: readonly T[]) =>
  docs.filter((doc) => !isOptimisticId(doc.id))

/**
 * Replaces a store's keyed map with authoritative state, keeping only the
 * placeholders still in flight — so a reconcile can't erase a row the user added
 * a moment ago, and can't preserve one that was stranded by a closed tab.
 *
 * Mutates in place: every caller is inside an immer producer.
 */
export function reconcileInto<T extends { id: string }>(
  map: Record<string, T>,
  docs: readonly NoInfer<T>[],
) {
  for (const id of Object.keys(map)) {
    if (!inFlight.has(id)) delete map[id]
  }
  for (const doc of docs) map[doc.id] = doc
}

/**
 * The subset of `previous` that `patch` is about to change — the exact undo for
 * an optimistic write, and the payload a rollback should broadcast.
 *
 * Restoring the whole document instead (what every update action used to do)
 * also reverts any UNRELATED field that a realtime snapshot or a second edit
 * landed while the failing write was in flight.
 */
export function rollbackPatch<T extends object>(previous: T, patch: Partial<T>): Partial<T> {
  const undo: Partial<T> = {}
  for (const key of Object.keys(patch) as (keyof T)[]) undo[key] = previous[key]
  return undo
}

// crypto.randomUUID needs a secure context — true for https and for localhost,
// so the fallback only ever runs on an unusual dev origin.
function randomId() {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}
