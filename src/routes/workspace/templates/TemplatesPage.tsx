import TemplateManager from '@/components/templates/TemplateManager';
import { TEMPLATE_TYPE_BY_SLUG, isTemplateTypeSlug } from '@/types/template';
import type { TemplateType } from '@/types/template';
import React from 'react'
import { Navigate, useParams } from 'react-router';

type Props = {}

function TemplatesPage({}: Props) {

  const { type: slug } = useParams();
  const type: TemplateType = TEMPLATE_TYPE_BY_SLUG[isTemplateTypeSlug(slug) ? slug : 'issues'];

  if(!type) return <Navigate to='/app/templates/issues' replace/>

  return (
    <TemplateManager type={type} />
  )
}

export { TemplatesPage as Component }