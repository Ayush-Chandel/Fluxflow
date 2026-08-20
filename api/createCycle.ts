// api/createCycle.ts — the one server hop for cycles (§7/§8), same shape as
// api/createIssue. A cycle's `number` is sequential and human-facing ("Cycle 5"),
// so clients are create-blocked in firestore.rules and route through here.
import type { VercelRequest, VercelResponse } from '@vercel/node'
import './_firebase' // shared Admin SDK init (side-effect import)
import { createWithSequence } from './_sequence'
import { getAuth } from 'firebase-admin/auth'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = req.headers.authorization?.split('Bearer ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  let decoded
  try {
    decoded = await getAuth().verifyIdToken(token)
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }

  const { workspaceId, ...input } = (req.body ?? {}) as Record<string, unknown>
  if (!workspaceId || typeof workspaceId !== 'string') {
    return res.status(400).json({ error: 'workspaceId is required' })
  }

  // A user may only write to their own workspace — mirrors firestore.rules and
  // api/createIssue (falls back to uid for tokens minted before the claim).
  const callerWorkspace = (decoded.workspaceId as string | undefined) ?? decoded.uid
  if (workspaceId !== callerWorkspace) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  // The range crosses the wire as epoch millis (JSON has no Timestamp) and is
  // rebuilt here. Both ends are REQUIRED — every cycle's derived status depends
  // on them, so a cycle without a range has no status at all (§4).
  const startMs = Number(input.startDate)
  const endMs = Number(input.endDate)
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    return res.status(400).json({ error: 'startDate and endDate are required' })
  }
  if (endMs <= startMs) {
    return res.status(400).json({ error: 'endDate must be after startDate' })
  }

  // Sequential number from the same transactional counter api/createIssue uses —
  // "Cycle 5" is as user-facing as 'LIN-5', and count() had the same race and the
  // same reuse-after-delete bug (§14.2, api/_sequence.ts).
  const { id, number } = await createWithSequence(workspaceId, 'cycles', (n) => ({
    number: n,
    name: typeof input.name === 'string' && input.name.trim() ? input.name.trim() : null,
    goal: typeof input.goal === 'string' && input.goal.trim() ? input.goal.trim() : null,
    startDate: Timestamp.fromMillis(startMs),
    endDate: Timestamp.fromMillis(endMs),
    createdBy: decoded.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }))

  return res.status(200).json({ id, number })
}
