// api/createIssue.ts — the one server hop for issues (§7/§8).
// Issues carry a sequential human-readable identifier ('LIN-1', 'LIN-2', …) that
// can't be minted race-free from the client, so the client SDK is create-blocked
// for issues (firestore.rules) and routes creates through this Vercel Fn instead.
// In dev, MSW mocks this route (build order 6); this is the real thing (step 7).
import type { VercelRequest, VercelResponse } from '@vercel/node'
import './_firebase' // shared Admin SDK init (side-effect import)
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify the Firebase ID token from the Authorization header
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

  // A user may only write to their own workspace. The workspaceId claim is the
  // source of truth (falls back to uid for freshly-created accounts whose token
  // predates the claim), mirroring the firestore.rules check.
  const callerWorkspace = (decoded.workspaceId as string | undefined) ?? decoded.uid
  if (workspaceId !== callerWorkspace) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  if (!input.title || typeof input.title !== 'string') {
    return res.status(400).json({ error: 'title is required' })
  }

  const db = getFirestore()
  const ref = db.collection(`workspaces/${workspaceId}/issues`)

  // Sequential identifier: count existing issues + 1 → 'LIN-N'.
  const identifier = `LIN-${(await ref.count().get()).data().count + 1}`

  // Only accept the user-supplied fields (CreateIssueInput); server stamps the
  // rest. Never trust a client-sent identifier / createdBy / timestamps.
  const status = (input.status as string | undefined) ?? 'backlog'
  const startedNow = status === 'in_progress' || status === 'done'

  const doc = {
    title: input.title,
    description: input.description ?? '',
    status,
    priority: input.priority ?? 'no_priority',
    startedAt: startedNow ? FieldValue.serverTimestamp() : null,
    completedAt: status === 'done' ? FieldValue.serverTimestamp() : null,
    assigneeId: input.assigneeId ?? null,
    labelIds: Array.isArray(input.labelIds) ? input.labelIds : [],
    projectId: input.projectId ?? null,
    milestoneId: input.milestoneId ?? null,
    cycleId: input.cycleId ?? null,
    identifier,
    createdBy: decoded.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }

  const docRef = await ref.add(doc)
  return res.status(200).json({ id: docRef.id, identifier })
}
