import { useNavigate } from 'react-router'
import { slugify } from '@/lib/slug'
import type { Project } from '@/types/project'


export function useOpenProject() {
  const navigate = useNavigate()
  return (project: Project) =>
    navigate(`/app/projects/${project.id}/${slugify(project.name)}`)
}
