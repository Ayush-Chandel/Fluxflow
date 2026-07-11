
import type { Navlinks } from '@/types/sidebar';
import { CollapseArrowIcon } from '../icons'
import { useState } from 'react';

type Props = {
    label: string;
    navlinks: Navlinks[]
}

function AccordionWrapper({
    label,
    navlinks
}: Props) {

    const [open, setOpen] = useState(false);
  return (
    <div   className='pl-2 space-y-3'>
        <button onClick={()=>(setOpen((prev)=>(!prev)))} className='flex  items-center'>
            <p className='text-xs font-medium text-muted'>{label}</p>
            <CollapseArrowIcon size={18} className='fill-muted' />
        </button>
        {
            open &&
            (
                <ul className='space-y-2'>
                 {
                    navlinks.map((nav)=>(
                        <li className='flex gap-2 items-center'>
                            {nav.icon}
                            <span className='text-[13px] text-muted font-medium'>{nav.label}</span>
                            
                        </li>
                    ))
                 }
        </ul>
            )
        }
    </div>
  )
}

export default AccordionWrapper