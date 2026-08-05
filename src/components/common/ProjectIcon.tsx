
import { cn } from '@/lib/utils'
import { DEFAULT_PROJECT_COLOR, resolveProjectIcon } from './constants/projectIcons'

type ProjectIconProps = {
  /** Persisted Project.icon. Widened to string because Firestore can hand back
   *  a key this build no longer ships. */
  icon: string | null | undefined
  /** Persisted Project.color (hex). */
  color?: string | null
  size?: number
  className?: string
}

function ProjectIcon({ icon, color, size = 16, className }: ProjectIconProps) {
  const Icon = resolveProjectIcon(icon).icon

  return (
    <Icon
      size={size}
      className={cn('shrink-0', className)}
      style={{ color: color || DEFAULT_PROJECT_COLOR }}
    />
  )
}

export default ProjectIcon
