import React from 'react'
import {  ExternalLinkIcon } from '../../icons'

type Props = {}

function SideHeader({}: Props) {
  return (
    <div className='flex justify-between items-center'>
        <div className='flex gap-2'>
            <div className='bg-blue-400 w-[22px] h-[22px] rounded-full flex items-center justify-center text-white text-[12px]'>P</div>
            <span className='text-[14px] font-medium'>
                Project
            </span>
        </div>
        <div className='flex gap-1'>
          <div className='p-1.5 rounded-full bg-surface border-edge border'>
              <ExternalLinkIcon size={14} />
          </div>
        </div>
    </div>
  )
}

export default SideHeader