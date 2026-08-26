// src/components/projects/projectColumns.ts — the projects table's column contract.
// ONE grid template shared by the header row and every data row, so a column can
// never drift out of alignment between them (the reason this is a constant and
// not two hand-written class strings).
//
// Not a <table>: rows need hover styling, popover pickers and per-breakpoint
// column hiding, so this is a CSS grid carrying ARIA table roles instead.
import type { OrderBy } from '@/store/viewPreferenceStore'

// Narrow screens drop the least information-dense column (Target date). Its cell
// is `hidden lg:flex`, and display:none keeps it out of the grid's track order —
// so the five remaining cells land in the five base tracks in DOM order.
// The lg template lost its second 80px track along with the Lead column below.
export const PROJECT_GRID =
  'grid items-center gap-3 px-3 ' +
  'grid-cols-[minmax(0,1fr)_80px_70px_96px_32px] ' +
  'lg:grid-cols-[minmax(0,1fr)_80px_110px_70px_96px_32px]'

/** Cell basics WITHOUT a display class — each column supplies `flex`/`hidden lg:flex`
 *  itself, since Tailwind resolves competing display utilities by stylesheet order,
 *  not class order. */
export const PROJECT_CELL = 'items-center gap-1.5 min-w-0'

export interface ProjectColumn {
  id: string
  label: string
  /** null → header renders as a plain label instead of a sort button. */
  sortKey: OrderBy | null
  /** Display + alignment, applied identically to the header cell and the row cell. */
  className: string
  /** Keep an accessible header without taking visual space from a compact action column. */
  visuallyHidden?: boolean
}

// No Health column: Linear derives health from project updates, which §4 does not
// model — so there is no field to render and none to sort on (decided 2026-08-02).
export const PROJECT_COLUMNS: ProjectColumn[] = [
  { id: 'name', label: 'Name', sortKey: 'name', className: 'flex gap-3' },
  { id: 'priority', label: 'Priority', sortKey: 'priority', className: 'flex pl-2' },
  // Lead — hidden until a member entity exists to resolve `leadId`; the column
  // held nothing but a placeholder glyph. Restoring it also needs the second
  // 80px track back in PROJECT_GRID's lg template.
  // { id: 'lead', label: 'Lead', sortKey: 'lead', className: 'hidden lg:flex pl-2' },
  { id: 'target', label: 'Target date', sortKey: 'target', className: 'hidden lg:flex' },
  { id: 'issues', label: 'Issues', sortKey: 'issues', className: 'flex justify-end' },
  // Sorts by the status enum (what the glyph shows); the % beside it is progress.
  { id: 'status', label: 'Status', sortKey: 'status', className: 'flex' },
  { id: 'actions', label: 'Actions', sortKey: null, className: 'flex justify-end', visuallyHidden: true },
]
