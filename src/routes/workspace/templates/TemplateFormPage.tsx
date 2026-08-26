import { useEffect, useState } from 'react';
import { Link, Navigate, useOutletContext, useParams } from 'react-router';
import TemplateIssue from '@/components/templates/TemplateIssue';
import TemplateProject from '@/components/templates/TemplateProject';
import PageLoader from '@/components/common/PageLoader';
import { CustomTrigger } from '@/components/layout/sidebar/CustomTrigger';
import { useTemplate } from '@/hooks/useTemplateSelectors';
import { useTemplateStore } from '@/store/templateStore';
import type { SidebarControls } from '@/types/layout';
import { TEMPLATE_TYPE_BY_SLUG, isTemplateTypeSlug } from '@/types/template';

const HYDRATION_GRACE_MS = 1200

function TemplateFormPage() {

  const { type: slug, id } = useParams();
  const { isPinned, pin, unpin } = useOutletContext<SidebarControls>();

  // Undefined on /new, and while an edit's document is still on its way in.
  const template = useTemplate(id);
  const hasTemplates = useTemplateStore((s) => Object.keys(s.templates).length > 0);

  const [settledId, setSettledId] = useState<string | undefined>(undefined);
  const graceElapsed = settledId === id;

  useEffect(() => {
    const timer = setTimeout(() => setSettledId(id), HYDRATION_GRACE_MS)
    return () => clearTimeout(timer)
  }, [id])

  if (!isTemplateTypeSlug(slug)) return <Navigate to='/app/templates/issues' replace/>

  const type = TEMPLATE_TYPE_BY_SLUG[slug];

  const renderForm = () => {
    // Creating: no document to wait for, so the slug decides the form.
    if (!id) return type === 'issue' ? <TemplateIssue/> : <TemplateProject/>

    if (!template) {
      if (hasTemplates || graceElapsed) {
        return <p className='px-3 text-lsm text-muted'>Template not found</p>
      }
      return <PageLoader delay={150} className='min-h-[50vh]' />
    }

    return template.type === 'issue'
      ? <TemplateIssue key={template.id} template={template}/>
      : <TemplateProject key={template.id} template={template}/>
  }

  return (
    <div className='flex min-h-0 flex-1 flex-col px-2 py-2'>
      <div className='flex shrink-0 items-center gap-2'>
        <CustomTrigger isPinned={isPinned} onPin={pin} onUnpin={unpin} />
      <Link to={`/app/templates/${slug}`} className='flex gap-x-1 items-center px-2 py-0.5 hover:bg-hover text-muted hover:text-foreground rounded-full w-fit transition-colors duration-150'>
         <span className=' text-md'>‹</span>
         <span className=' text-xs'>{type} templates</span>
      </Link>
      </div>
      <div className='min-h-0 flex-1 overflow-y-auto'>
        <div className='mx-auto pt-12 pb-4 space-y-7 w-full max-w-[640px]'>
          {renderForm()}
        </div>
      </div>
    </div>
  )
}

export {TemplateFormPage as Component}
