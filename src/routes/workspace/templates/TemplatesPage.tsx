import TemplateManager from '@/components/templates/TemplateManager';
import { CustomTrigger } from '@/components/layout/sidebar/CustomTrigger';
import type { SidebarControls } from '@/types/layout';
import { TEMPLATE_TYPE_BY_SLUG, isTemplateTypeSlug } from '@/types/template';
import { Navigate, useOutletContext, useParams } from 'react-router';

function TemplatesPage() {

  const { type: slug } = useParams();
  const { isPinned, pin, unpin } = useOutletContext<SidebarControls>();

  if (!isTemplateTypeSlug(slug)) return <Navigate to='/app/templates/issues' replace/>

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='shrink-0 px-3 pt-2.5 pb-1.5'>
        <CustomTrigger isPinned={isPinned} onPin={pin} onUnpin={unpin} />
      </div>
      <div className='min-h-0 flex-1 overflow-y-auto'>
        <TemplateManager type={TEMPLATE_TYPE_BY_SLUG[slug]} />
      </div>
    </div>
  )
}

export { TemplatesPage as Component }
