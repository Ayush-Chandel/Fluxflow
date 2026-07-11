import StaggerAccordion from '@/components/common/StaggerAccordion';
import { BoxIcon, CopyIcon, PlayCircleIcon } from '@/components/icons'
import { Navlinks } from '@/types/sidebar';
import React, { useState } from 'react'

type Props = {}

function SideContent({}: Props) {



    const navlinks:Navlinks[] = [
        {
            path:'',
            icon: <BoxIcon className='fill-muted' size={14}/>,
            label: 'Projects'
        },
        {
            path:'',
            icon: <CopyIcon className='fill-muted' size={14}/>,
            label: 'Issues'
        },
        {
            path:'',
            icon: <PlayCircleIcon className='fill-muted' size={14}/>,
            label: 'Cycles'
        },
    ] 

  return (
    <div className='mt-10'>
        <StaggerAccordion label='Workspace'  navlinks={navlinks}/>
    </div>
  )
}

export default SideContent