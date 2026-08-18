import { useParams } from 'react-router'
import CycleDetailView from '@/components/cycles/CycleDetailView'

function CycleDetail() {
  const { id } = useParams()

  return <CycleDetailView cycleId={id} />
}

export { CycleDetail as Component }
