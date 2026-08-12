
import { create } from 'zustand'
import type { CreateCycleInput } from '@/types/cycle'

interface CreateCycleDialogState {
  open: boolean
  prefill: Partial<CreateCycleInput> | null
  editingId: string | null

  openWith: (prefill?: Partial<CreateCycleInput>) => void
  openForEdit: (cycleId: string) => void
  close: () => void
}

export const useCreateCycleDialog = create<CreateCycleDialogState>((set) => ({
  open: false,
  prefill: null,
  editingId: null,

  openWith: (prefill) => set({ open: true, prefill: prefill ?? null, editingId: null }),
  openForEdit: (cycleId) => set({ open: true, prefill: null, editingId: cycleId }),
  // Clearing both stops a stale prefill (or a stale edit target) leaking into
  // the next open — the create form must never come up holding an old cycle.
  close: () => set({ open: false, prefill: null, editingId: null }),
}))
