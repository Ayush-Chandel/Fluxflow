
import { useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router'
import {
  FILTER_FIELDS,
  isFilterActive,
  isValidValue,
  type FilterField,
  type IssueFilter,
} from '@/lib/issueFilters'
import type { Filter } from '@/components/reui/filters'

// Every field is pinned to ONE operator, so the chip's operator segment reads
// as a static label and the URL stays flat (?status=todo,done). Supporting
// `is_not` would mean encoding operators into the param and turning
// lib/issueFilters.ts into an expression evaluator; the vendored component
// keeps that machinery available for free if it is ever wanted.
export const PINNED_OPERATOR = 'is_any_of'

function parse(params: URLSearchParams): IssueFilter {
  const filter: IssueFilter = {}

  for (const field of FILTER_FIELDS) {
    // `has` not `get`: a present-but-empty param is a chip awaiting values.
    if (!params.has(field)) continue
    const raw = params.get(field) ?? ''
    // Unknown values are DROPPED, never rendered — a stale or hand-edited URL
    // must degrade to a wider list, not crash a chip that indexes its map.
    filter[field] = raw
      .split(',')
      .map((value) => value.trim())
      .filter((value) => isValidValue(field, value))
  }

  return filter
}

export function useIssueFilters() {
  const [searchParams, setSearchParams] = useSearchParams()


  const raw = FILTER_FIELDS.map((field) =>
    searchParams.has(field) ? `${field}=${searchParams.get(field)}` : '',
  ).join('|')

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filter = useMemo(() => parse(searchParams), [raw])

  // Chip ids must satisfy TWO things at once, which is why they are neither
  // regenerated nor invented here:
  //
  //  1. STABLE across rebuilds. This array is rebuilt from the URL after every
  //     change, so a fresh createFilter() id each time would change the React
  //     key, remount the chip, and close its popover on every value picked.
  //  2. EQUAL to the id the vendored <Filters> minted. Its add-filter submenu
  //     remembers that id for the open menu session (`sessionFilterIds`) and
  //     looks the chip up by it to accumulate further values into it. An id of
  //     our own never matches, so the second value picked starts a NEW chip and
  //     silently replaces the first — with no checkmarks along the way.
  //
  // Remembering what it handed us satisfies both. The field name is only the
  // fallback for chips restored from a URL, which no menu session is tracking.
  const idByField = useRef<Partial<Record<FilterField, string>>>({})

  const filters = useMemo<Filter<string>[]>(
    () =>
      FILTER_FIELDS.filter((field) => filter[field] !== undefined).map((field) => ({
        id: idByField.current[field] ?? field,
        field,
        operator: PINNED_OPERATOR,
        values: filter[field] ?? [],
      })),
    [filter],
  )

  const write = useCallback(
    (next: IssueFilter) => {
      setSearchParams(
        (prev) => {
          // Copy so params this hook does not own (a future ?q=) survive.
          const params = new URLSearchParams(prev)
          for (const field of FILTER_FIELDS) {
            const values = next[field]
            if (values === undefined) params.delete(field)
            else params.set(field, values.join(','))
          }
          return params
        },
        // Toggling a chip five times must not stack five entries in front of
        // the browser's Back button.
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const setFilters = useCallback(
    (next: Filter<string>[]) => {
      const built: IssueFilter = {}
      for (const entry of next) {
        const field = entry.field as FilterField
        if (!FILTER_FIELDS.includes(field)) continue
        const previous = built[field]
        built[field] = previous
          ? [...new Set([...previous, ...entry.values])]
          : entry.values
        idByField.current[field] = entry.id
      }
      // A chip that is gone releases its id; re-adding it mints a fresh one.
      for (const field of FILTER_FIELDS) {
        if (built[field] === undefined) delete idByField.current[field]
      }
      write(built)
    },
    [write],
  )

  const clear = useCallback(() => write({}), [write])

  return { filter, filters, setFilters, clear, active: isFilterActive(filter) }
}
