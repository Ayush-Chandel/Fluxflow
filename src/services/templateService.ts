import {
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  writeBatch,
  type WriteBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { CreateTemplateInput, NewTemplateDoc } from '@/types/template'

const templatesCollection = (ws: string) => collection(db, `workspaces/${ws}/templates`)
const templateDoc = (ws: string, id: string) => doc(db, `workspaces/${ws}/templates/${id}`)


function writeWithDefaultCleared(
  ws: string,
  clearDefaultId: string | null | undefined,
  apply: (batch: WriteBatch) => void,
) {
  const batch = writeBatch(db)
  apply(batch)
  if (clearDefaultId) {
    batch.update(templateDoc(ws, clearDefaultId), {
      isDefault: false,
      updatedAt: serverTimestamp(),
    })
  }
  return batch.commit()
}

export const templateService = {
  newId: (ws: string) => doc(templatesCollection(ws)).id,

  create: (ws: string, id: string, data: NewTemplateDoc, clearDefaultId?: string | null) =>
    writeWithDefaultCleared(ws, clearDefaultId, (batch) =>
      batch.set(templateDoc(ws, id), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    ),

  update: (ws: string, id: string, input: CreateTemplateInput, clearDefaultId?: string | null) =>
    writeWithDefaultCleared(ws, clearDefaultId, (batch) =>
      batch.update(templateDoc(ws, id), { ...input, updatedAt: serverTimestamp() }),
    ),

  remove: (ws: string, id: string) => deleteDoc(templateDoc(ws, id)),

  setDefault: (ws: string, nextId: string | null, prevId: string | null) =>
    writeWithDefaultCleared(ws, prevId, (batch) => {
      if (nextId) {
        batch.update(templateDoc(ws, nextId), { isDefault: true, updatedAt: serverTimestamp() })
      }
    }),
}
