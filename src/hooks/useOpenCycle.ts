import { useNavigate } from 'react-router'
import { isOptimisticId } from '@/lib/optimistic'
import { slugify } from '@/lib/slug'
import { cycleLabel, type Cycle } from '@/types/cycle'

export function useOpenCycle() {
  const navigate = useNavigate()
  return (cycle: Cycle) => {
    // The temp id is not a document id — see useOpenIssue.
    if (isOptimisticId(cycle.id)) return
    navigate(`/app/cycles/${cycle.id}/${slugify(cycleLabel(cycle))}`)
  }
}
