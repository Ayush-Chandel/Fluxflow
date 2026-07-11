import React from 'react'
import {  ChevronDownIcon,  ExternalLinkIcon } from '../../icons'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

type Props = {}

function SideHeader({}: Props) {
  return (
    <div className='flex justify-between items-center'>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" onClick={()=>{}} className='flex gap-2 bg-background hover:bg-[oklch(0.94_0.00_264)] px-2 py-1 rounded-xl transition-colors duration-100 border-none shadow-none'>
            <div className='bg-blue-400 w-[22px] h-[22px] rounded-full flex items-center justify-center text-white text-[12px]'>P</div>
            <span className='text-[14px] font-medium'>
                Project
            </span>
            <ChevronDownIcon size={12}/>
        </Button>
        </PopoverTrigger>
        <PopoverContent>
          <div>test</div>
        </PopoverContent>
      </Popover>
        
        <div className='flex gap-1'>
          <div className='p-1.5 rounded-full bg-surface border-edge border'>
              <ExternalLinkIcon size={14} />
          </div>
        </div>
    </div>
  )
}

export default SideHeader