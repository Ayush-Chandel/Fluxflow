

import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Milestone, NewProjectDoc, Project } from '@/types/project'

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

  newMilestoneId: () => crypto.randomUUID(),

  createMilestone: (ws: string, projectId: string, milestone: Milestone) =>
    updateDoc(projectDoc(ws, projectId), {
      [`milestones.${milestone.id}`]: milestone,
      updatedAt: serverTimestamp(),
    }),

  updateMilestone: (
    ws: string,
    projectId: string,
    milestoneId: string,
    patch: Partial<Milestone>,
  ) =>
    updateDoc(projectDoc(ws, projectId), {
      ...Object.fromEntries(
        Object.entries(patch).map(([field, value]) => [
          `milestones.${milestoneId}.${field}`,
          value,
        ]),
      ),
      updatedAt: serverTimestamp(),
    }),

  removeMilestone: (ws: string, projectId: string, milestoneId: string) =>
    updateDoc(projectDoc(ws, projectId), {
      [`milestones.${milestoneId}`]: deleteField(),
      updatedAt: serverTimestamp(),
    }),
}
