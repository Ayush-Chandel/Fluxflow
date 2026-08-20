// api/_sequence.ts — race-free sequential numbering for the two server-created
// entities (build order 19, closing the last §14.2 defect).
//
// Underscore prefix = not a routable endpoint (vite/localApi.ts skips these).
//
// WHAT WAS WRONG. Both functions minted their number as `count() + 1` over the
// collection. That is the race the server hop exists to prevent — two concurrent
// creates read the same count and file the same identifier — and it carries a
// second, far more reachable bug: `count()` measures how many documents exist,
// not how many have ever existed, so DELETING an issue makes the next create
// reuse a retired identifier. LIN-N is the string the URL, the breadcrumb and
// every deep link are built from, and IssueDetailView resolves an issue by it.
//
// THE FIX. A counter document per collection, read and incremented inside the
// same transaction that creates the entity, so the number and the document that
// carries it commit together or not at all. The counter only ever rises, so a
// deleted identifier stays retired.
//
// The counter lives at `workspaces/{ws}/counters/{collection}`. It is written by
// the Admin SDK, which bypasses rules, and no client reads it — firestore.rules
// has no match block for that path, so it is denied by default, which is correct.
import './_firebase' // shared Admin SDK init (side-effect import)
import {
  getFirestore,
  type CollectionReference,
  type DocumentData,
} from 'firebase-admin/firestore'

type Sequenced = 'issues' | 'cycles'

/**
 * The highest number this collection has EVER issued — the seed for a workspace
 * that predates the counter document.
 *
 * Deliberately not `count()`: the number of surviving documents is not the
 * high-water mark. Three issues with one deleted counts 2, and seeding from 2
 * would hand the next create LIN-3 — an identifier that is still on screen. The
 * old code had exactly that bug; inheriting it on the migrating create would
 * defeat the point of the step.
 *
 * A projection read of the whole collection, which is affordable because it
 * happens ONCE per workspace, ever — and because the app already streams every
 * issue into the store on each page load (useEntitySync), so this is strictly
 * cheaper than what the client does anyway.
 */
async function highestIssued(col: CollectionReference, collection: Sequenced): Promise<number> {
  const field = collection === 'issues' ? 'identifier' : 'number'
  const snap = await col.select(field).get()

  let max = 0
  snap.forEach((doc) => {
    // Issues carry the number inside 'LIN-N'; cycles store it bare.
    const value =
      collection === 'issues'
        ? Number(String(doc.get('identifier') ?? '').replace(/^LIN-/, ''))
        : Number(doc.get('number'))
    if (Number.isFinite(value) && value > max) max = value
  })
  return max
}

/**
 * Allocates the next sequential number for `collection` and creates the document
 * in the same transaction. `build` receives that number so the caller can bake it
 * into the document (an issue's `identifier`, a cycle's `number`).
 */
export async function createWithSequence(
  workspaceId: string,
  collection: Sequenced,
  build: (n: number) => DocumentData,
): Promise<{ id: string; number: number }> {
  const db = getFirestore()
  const col = db.collection(`workspaces/${workspaceId}/${collection}`)
  const counterRef = db.doc(`workspaces/${workspaceId}/counters/${collection}`)

  // Generate the id up front (the Admin SDK mints it locally) so it can be
  // returned after the transaction commits — inside one, `add()` isn't available.
  const docRef = col.doc()

  // Returns null when the counter is missing and no seed was supplied, having
  // written nothing — that is the signal to seed and run again. `seed` is only
  // ever consulted on that path; a counter that exists always wins.
  const allocate = (seed?: number) =>
    db.runTransaction(async (tx) => {
      const snap = await tx.get(counterRef)
      const stored = snap.exists ? snap.get('count') : undefined
      const last = typeof stored === 'number' ? stored : seed
      if (last === undefined) return null

      const next = last + 1
      tx.set(counterRef, { count: next }, { merge: true })
      tx.create(docRef, build(next))
      return next
    })

  let number = await allocate()

  if (number === null) {
    // Seeding is a two-phase dance ON PURPOSE. The obvious version reads the
    // seed inside the transaction, but an aggregate/collection read there breaks
    // the moment the transaction retries: concurrent first-creates all take the
    // seeding branch, contend on the counter, and the retried attempt fails with
    // "Transaction is invalid or closed" (observed against the emulator, 12
    // parallel creates). Reading the seed OUTSIDE keeps the transaction to a
    // single document read, which retries cleanly.
    //
    // Two callers racing here both seed with the same value and both compute the
    // same `next` — but they also both READ counterRef inside their transaction,
    // so the second one's read precondition fails, it retries, and by then the
    // counter exists and wins over the seed. The sequence stays dense.
    number = await allocate(await highestIssued(col, collection))
  }

  if (number === null) {
    // Unreachable — allocate() only declines when it was given no seed. Kept as
    // a real check rather than a `!` so a later edit can't turn it into a NaN
    // that would ship as the identifier 'LIN-NaN'.
    throw new Error(`Could not allocate a ${collection} number in ${workspaceId}`)
  }

  return { id: docRef.id, number }
}
