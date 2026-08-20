// api/setWorkspaceClaims.ts
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

  // workspaceId = the user's own uid (each user gets their own workspace on signup)
  const workspaceId = decoded.uid

  const db = getFirestore()

  const wsRef = db.collection('workspaces').doc(workspaceId)
  await db.runTransaction(async (tx) => {
    if ((await tx.get(wsRef)).exists) return
    tx.create(wsRef, {
      ownerId: decoded.uid,
      createdAt: FieldValue.serverTimestamp(),
    })
  })

  // 2. Burn workspaceId into every future JWT for this user as a custom claim
  await getAuth().setCustomUserClaims(decoded.uid, { workspaceId })

  // 3. Return workspaceId so authService can patch the store immediately
  //    (needed in dev where MSW can't set real token claims)
  return res.status(200).json({ workspaceId })
}