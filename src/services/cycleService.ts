
import { auth, db } from '@/lib/firebase'
import { deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import type { CreateCycleInput, Cycle } from '@/types/cycle'

const cycleDoc = (ws: string, id: string) => doc(db, `workspaces/${ws}/cycles/${id}`)

export const cycleService = {
  // Returns the real id + the sequential number the Fn assigned. `clientRequestId`
  // is stored on the document so the snapshot that delivers it can be matched
  // back to the local placeholder (lib/optimistic).
  async create(
    ws: string,
    data: CreateCycleInput,
    clientRequestId: string,
  ): Promise<{ id: string; number: number }> {
    const token = await auth.currentUser?.getIdToken()
    const res = await fetch('/api/createCycle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        workspaceId: ws,
        clientRequestId,
        name: data.name,
        goal: data.goal,
        startDate: data.startDate.toMillis(),
        endDate: data.endDate.toMillis(),
      }),
    })
    if (!res.ok) throw new Error('Failed to create cycle')
    return res.json()
  },

  update: (ws: string, id: string, patch: Partial<Cycle>) =>
    updateDoc(cycleDoc(ws, id), { ...patch, updatedAt: serverTimestamp() }),

  remove: (ws: string, id: string) => deleteDoc(cycleDoc(ws, id)),
}
