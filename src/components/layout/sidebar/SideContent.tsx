import StaggerAccordion from '@/components/common/StaggerAccordion';
import { BoxIcon, CopyIcon, PlayCircleIcon } from '@/components/icons'
import { useSidebarKey } from '@/lib/utils';
import type { Navlinks } from '@/types/sidebar';
import React, { useState } from 'react'
import { useMatches } from 'react-router';

type Props = {}

function SideContent({}: Props) {

    const sidebarKey = useSidebarKey();

    const navlinks:Navlinks[] = [
        {
            path:'/app/projects',
            icon: <BoxIcon className='fill-muted' size={14}/>,
            label: 'Projects'
        },
        {
            path:'/app/issues',
            icon: <CopyIcon className='fill-muted' size={14}/>,
            label: 'Issues'
        },
        {
            path:'/app/cycles',
            icon: <PlayCircleIcon className='fill-muted' size={14}/>,
            label: 'Cycles'
        },
    ] 

  return (
    <div className='mt-10'>
        <StaggerAccordion label='Workspace'  navlinks={navlinks}
        />
    </div>
  )
}

export default SideContent