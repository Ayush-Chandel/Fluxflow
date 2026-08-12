import { useNavigate } from 'react-router'
import { slugify } from '@/lib/slug'
import { cycleLabel, type Cycle } from '@/types/cycle'

export function useOpenCycle() {
  const navigate = useNavigate()
  return (cycle: Cycle) => navigate(`/app/cycles/${cycle.id}/${slugify(cycleLabel(cycle))}`)
}
