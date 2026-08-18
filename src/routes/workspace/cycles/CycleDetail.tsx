import { useParams } from 'react-router'
import CycleDetailView from '@/components/cycles/CycleDetailView'
import { cycleIssuesViewId } from '@/hooks/useCycleSelectors'

function CycleDetail() {
  const { id } = useParams()

  return <CycleDetailView cycleId={id} viewId={cycleIssuesViewId(id ?? '')} />
}

export { CycleDetail as Component }
