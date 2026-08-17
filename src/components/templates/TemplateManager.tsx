
import { TEMPLATE_INFO, isTemplateTypeSlug, type TemplateType } from '@/types/template'
import React from 'react'
import { PlusIcon } from '../icons'
import { Link, useParams } from 'react-router'

type TemplateManagerProps = {
    type: TemplateType
}

function TemplateManager({type}: TemplateManagerProps) {

    const {type:templateType} = useParams();

    const templateInfo = TEMPLATE_INFO[isTemplateTypeSlug(templateType) ? templateType : 'issues'];

    return (
        <div className='mx-auto pt-12 pb-4 space-y-7 w-full max-w-[640px]'>
            <div className='px-2 space-y-1'>
                <h1 className='text-2xl text-foreground font-medium'>{templateInfo?.header.title}</h1>
                <p className='text-lsm text-muted'>{templateInfo?.header.desc}</p>
            </div>

            <div className='w-full overflow-hidden rounded-xl border border-hover space-y-2'>
                <div className='flex items-center justify-between pt-4 pb-2 px-3 border-b border-hover'>
                    <p className='text-lsm text-foreground font-medium'>2 {templateType ==='issues' ? 'issue' : 'project'} templates</p>
                    <Link to={`/app/templates/${templateType ?? 'issues'}/new`}>
                        <PlusIcon size={13} className='text-foreground' />
                    </Link>
                </div>
                <div className='divide-y divide-hover px-2'>    
                    <div className='flex items-center px-3 py-2 gap-2'>
                    <PlusIcon size={16} />
                    <div className=''>
                        <p className='text-lsm'>Form</p>
                        <span className='text-xs text-muted'>Add some info</span>
                    </div>
                    </div>
                    <div className='flex items-center px-3 py-2 gap-2'>
                    <PlusIcon size={16} />
                    <div className=''>
                        <p className='text-lsm'>Form</p>
                        <span className='text-xs text-muted'>Add some info</span>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TemplateManager