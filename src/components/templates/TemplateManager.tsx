
import { TEMPLATE_INFO, TEMPLATE_SLUG_BY_TYPE, type TemplateType } from '@/types/template'
import { PlusIcon } from '../icons'
import { Link } from 'react-router'
import ProjectIcon from '../common/ProjectIcon'
import TemplateActionsMenu from './TemplateActionsMenu'
import { useTemplateList } from '@/hooks/useTemplateSelectors'

type TemplateManagerProps = {
    type: TemplateType
}

function TemplateManager({type}: TemplateManagerProps) {

    const slug = TEMPLATE_SLUG_BY_TYPE[type]
    const templateInfo = TEMPLATE_INFO[slug]

    const templates = useTemplateList(type)

    return (
        <div className='mx-auto pt-12 pb-4 space-y-7 w-full max-w-[640px]'>
            <div className='px-2 space-y-1'>
                <h1 className='text-2xl text-foreground font-medium'>{templateInfo?.header.title}</h1>
                <p className='text-lsm text-muted'>{templateInfo?.header.desc}</p>
            </div>

            <div className='w-full overflow-hidden rounded-xl border border-hover '>
                <div className='flex items-center justify-between pt-4 pb-2 px-3 border-b border-hover'>
                    <p className='text-lsm text-foreground font-medium'>
                        {templates.length} {type} template{templates.length === 1 ? '' : 's'}
                    </p>
                    <Link to={`/app/templates/${slug}/new`} aria-label={`New ${type} template`}>
                        <PlusIcon size={13} className='text-foreground' />
                    </Link>
                </div>
                <div className='divide-y divide-hover'>
                    {templates.length === 0 ? (
                        <div className='px-3 py-6'>
                            <p className='text-lsm text-muted'>
                                No {type} templates yet — the   + above creates one.
                            </p>
                        </div>
                    ) : (
                        templates.map((template) => (
                            <div key={template.id} className='group relative flex items-center min-h-[58px] px-5 py-3 gap-2 hover:bg-hover'>
                                {/* Stretched link: an overlay covering the row, so the
                                    padding and the space beside the text open the editor
                                    too. Still a real anchor, so cmd/middle-click and
                                    keyboard focus behave. The menu sits above it via
                                    z-10 — the only part of the row that must not
                                    navigate. */}
                                <Link
                                    to={`/app/templates/${slug}/${template.id}`}
                                    aria-label={`Edit ${template.name}`}
                                    className='absolute inset-0 cursor-default'
                                />
                                <ProjectIcon icon={template.icon} color={template.color} size={16} />
                                <div className='min-w-0 flex-1'>
                                    <p className='text-lsm text-foreground truncate'>{template.name}</p>
                                    {template.description && (
                                        <span className='text-xs text-muted line-clamp-1'>
                                            {template.description}
                                        </span>
                                    )}
                                </div>
                                {template.isDefault && (
                                    <span className='shrink-0 rounded-full border border-edge px-2 py-0.5 text-xs text-muted'>
                                        Default
                                    </span>
                                )}
                                <div className='relative z-10 shrink-0'>
                                    <TemplateActionsMenu template={template} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

export default TemplateManager
