import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import TemplateIssue from '@/components/templates/TemplateIssue';
import TemplateProject from '@/components/templates/TemplateProject';
import { Skeleton } from '@/components/ui/skeleton';
import { useTemplate } from '@/hooks/useTemplateSelectors';
import { useTemplateStore } from '@/store/templateStore';
import { TEMPLATE_TYPE_BY_SLUG, isTemplateTypeSlug } from '@/types/template';

const HYDRATION_GRACE_MS = 1200

type Props = {}

function TemplateFormPage({}: Props) {

  const { type: slug, id } = useParams();

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
      return (
        <div className='px-3'>
          <Skeleton className='h-8 w-64' />
          <Skeleton className='mt-3 h-4 w-80' />
          <Skeleton className='mt-8 h-32 w-full rounded-xl' />
        </div>
      )
    }

    return template.type === 'issue'
      ? <TemplateIssue key={template.id} template={template}/>
      : <TemplateProject key={template.id} template={template}/>
  }

  return (
    <div className='flex min-h-0 flex-1 flex-col px-2 py-2'>
      <Link to={`/app/templates/${slug}`} className='flex gap-x-1 items-center px-2 py-0.5 hover:bg-hover text-muted hover:text-foreground rounded-full w-fit transition-colors duration-150'>
         <span className=' text-md'>‹</span>
         <span className=' text-xs'>{type} templates</span>
      </Link>
      <div className='min-h-0 flex-1 overflow-y-auto'>
        <div className='mx-auto pt-12 pb-4 space-y-7 w-full max-w-[640px]'>
          {renderForm()}
        </div>
      </div>
    </div>
  )
}

export {TemplateFormPage as Component}
