
import { useCommitOnExit } from '@/hooks/useCommitOnExit'
import { useProjectProgress } from '@/hooks/useProjectSelectors'
import { useProjectMilestones } from '@/hooks/useProjectMilestones'
import { useProjectStore } from '@/store/projectStore'
import type { Project } from '@/types/project'
import AutoGrowTextarea from '@/components/common/AutoGrowTextarea'
import ProgressBar from '@/components/common/ProgressBar'
import ProjectDetailHeader from './ProjectDetailHeader'
import ProjectMilestoneList from './ProjectMilestoneList'

function ProjectOverview({ project }: { project: Project }) {
  const updateProject = useProjectStore((s) => s.updateProject)
  const progress = useProjectProgress(project.id)
  const milestones = useProjectMilestones(project.id)

  // Project.content — the long-form brief, one write per editing session.
  const content = useCommitOnExit(
    project.content,
    (next: string) => {
      updateProject(project.id, { content: next })
    },
    project.id,
  )

  return (
    <div className='flex flex-col gap-8'>
      <ProjectDetailHeader project={project} />

      <section className='flex flex-col gap-2'>
        <div className='flex items-center justify-between gap-3'>
          <h2 className='text-lsm font-medium text-foreground'>Progress</h2>
          {/* Derived from the issue store on every render (§4) — no counter on
              the project doc to drift out of date. */}
          <span className='text-lsm tabular-nums text-muted'>
            {progress.done}/{progress.total} done · {progress.pct}%
          </span>
        </div>
        <ProgressBar value={progress.pct} label={`${project.name} progress`} />
      </section>

      <section className='flex flex-col gap-1'>
        <h2 className='text-lsm font-medium text-foreground'>Description</h2>
        <AutoGrowTextarea
          key={`${project.id}-content`}
          defaultValue={project.content}
          onInput={(e) => content.track(e.currentTarget.value)}
          onBlur={content.flush}
          placeholder='Add description...'
          className='min-h-24 w-full resize-none overflow-hidden bg-transparent text-sm text-foreground outline-none placeholder:text-muted'
        />
      </section>

      <ProjectMilestoneList projectId={project.id} milestones={milestones} />
    </div>
  )
}

export default ProjectOverview
