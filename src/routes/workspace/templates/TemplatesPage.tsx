import TemplateManager from '@/components/templates/TemplateManager';
import { TEMPLATE_TYPE_BY_SLUG, isTemplateTypeSlug } from '@/types/template';
import { Navigate, useParams } from 'react-router';

type Props = {}

function TemplatesPage({}: Props) {

  const { type: slug } = useParams();

  if (!isTemplateTypeSlug(slug)) return <Navigate to='/app/templates/issues' replace/>

  return (
    <div className='min-h-0 flex-1 overflow-y-auto'>
      <TemplateManager type={TEMPLATE_TYPE_BY_SLUG[slug]} />
    </div>
  )
}

export { TemplatesPage as Component }
