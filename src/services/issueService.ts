// src/services/issueService.ts — §7 services layer for issues.
// Client Firestore SDK for update/delete; the sequential-ID create is the one
// server hop (Vercel Fn → real 'LIN-xxx'), reusing authService's Bearer pattern.
// In dev, MSW mocks /api/createIssue (build order 6); the real Fn lands in 7.
import { auth, db } from '@/lib/firebase'
import { deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import type { CreateIssueInput, Issue } from '@/types/issue'

const issueDoc = (ws: string, id: string) => doc(db, `workspaces/${ws}/issues/${id}`)

export const issueService = {
  // Server-sequential create: returns the real id + identifier the Fn assigned.
  // `clientRequestId` is stored on the document so the snapshot that delivers it
  // can be matched back to the local placeholder (lib/optimistic).
  async create(
    ws: string,
    data: CreateIssueInput,
    clientRequestId: string,
  ): Promise<{ id: string; identifier: string }> {
    const token = await auth.currentUser?.getIdToken()
    const res = await fetch('/api/createIssue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ workspaceId: ws, clientRequestId, ...data }),
    })
    if (!res.ok) throw new Error('Failed to create issue')
    return res.json()
  },


  updateIssue: (ws: string, id: string, patch: Partial<Issue>) =>
    updateDoc(issueDoc(ws, id), { ...patch, updatedAt: serverTimestamp() }),

  deleteIssue: (ws: string, id: string) => deleteDoc(issueDoc(ws, id)),
}
