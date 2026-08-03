// src/services/projectService.ts — §7 services layer for projects.
// Pure client Firestore CRUD: a project has no server-generated id (unlike an
// issue's sequential 'LIN-N' or a cycle's number), so there is NO Vercel Fn hop
// here — the client SDK writes straight to Firestore and the rules enforce the
// workspace scope.
//
// `newId()` pre-generates the document id locally (§6: "id is known immediately
// via doc()"), which is what lets the store skip the issue store's temp-id
// dance: the optimistic project is keyed by the REAL id from the start, so when
// onSnapshot echoes the written doc it simply upserts over it.
//
// Milestones (the projects/{id}/milestones subcollection) land in build order 12.
import { collection, deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { NewProjectDoc, Project } from '@/types/project'

const projectsCollection = (ws: string) => collection(db, `workspaces/${ws}/projects`)
const projectDoc = (ws: string, id: string) => doc(db, `workspaces/${ws}/projects/${id}`)

export const projectService = {
  // Reserves an id without touching the network — doc() only builds a reference.
  newId: (ws: string) => doc(projectsCollection(ws)).id,

  // setDoc (not addDoc) so the caller controls the id it already showed the user.
  create: (ws: string, id: string, data: NewProjectDoc) =>
    setDoc(projectDoc(ws, id), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),

  update: (ws: string, id: string, patch: Partial<Project>) =>
    updateDoc(projectDoc(ws, id), { ...patch, updatedAt: serverTimestamp() }),

  remove: (ws: string, id: string) => deleteDoc(projectDoc(ws, id)),
}
