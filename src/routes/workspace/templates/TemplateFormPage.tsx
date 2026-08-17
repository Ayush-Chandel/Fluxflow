import TemplateIssue from '@/components/templates/TemplateIssue';
import TemplateProject from '@/components/templates/TemplateProject';
import { Component } from 'lucide-react'
import React from 'react'
import { Link, useParams } from 'react-router';

type Props = {}

function TemplateFormPage({}: Props) {

  const {type:templateType} = useParams();

  return (
    <div className='px-2 py-2'>
      <Link to={`/app/templates/${templateType ?? 'issues'}` } className='flex gap-x-1 items-center px-2 py-0.5 hover:bg-hover text-muted hover:text-foreground rounded-full w-fit transition-colors duration-150'>
         <span className=' text-md'>‹</span> 
         <span className=' text-xs'>{templateType === 'issues' ? 'issue' : 'project'} templates</span> 
      </Link>
      <div className='mx-auto pt-12 pb-4 space-y-7 w-full max-w-[640px]'>
      {templateType === 'issues' ? 
        <TemplateIssue/>
      : <TemplateProject />
      }
    </div>
    </div>
  )
}

export {TemplateFormPage as Component}