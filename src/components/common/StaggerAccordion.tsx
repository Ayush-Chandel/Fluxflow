
import type { Navlinks, SidebarKey } from '@/types/layout';
import { CollapseArrowIcon } from '../icons'
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router';

type Props = {
    label: string;
    navlinks: Navlinks[],
    activeKey?: SidebarKey;
}

function StaggerAccordion({
    label,
    navlinks,
    activeKey
}: Props) {

    const [open, setOpen] = useState(false);

    const navparentVariants = {
        open: {
            transition:{
                staggerChildren: 0.03,
            }
        } ,
        closed:{
            transition:{
                staggerChildren: 0.02,
                staggerDirection: -1
            }
        }
    }

    const navlinkVariants  = {
        open: {
            y: 0,
            opacity: 1
        } ,
        closed:{
            opacity: 0,
            y: -10
        }
    }

    
    
  return (
    <motion.div     
        initial='closed'
        animate={open ? 'open' : 'closed'}   
        className='pl-2 space-y-3 '>
        <button onClick={()=>(setOpen((prev)=>(!prev)))} className='flex  items-center hover:bg-hover py-1 px-2 rounded-md w-full'>
            <p className='text-xs font-medium text-muted'>{label}</p>
            <CollapseArrowIcon size={18} className='fill-muted' />
        </button>
        
        <AnimatePresence >
            {
                open &&
                <motion.ul
                        initial={'closed'} 
                        animate={open ? 'open' : 'closed'}
                        className={`space-y-1 pl-2`}
                        exit={'closed'}
                        variants={navparentVariants}
                        >
                 {
                    navlinks.map((nav)=>(
                        <motion.li 
                        key={nav.label}
                            variants={navlinkVariants} 
                            transition={{
                                duration: 0.2,
                                ease: 'easeIn'
                            }} >
                            <Link to={nav.path} className={`text-[13px] text-muted font-medium ${!(activeKey === nav.key) ? 'hover:bg-hover' : ''}  py-0.5 px-2 rounded-md flex gap-2 items-center  ${activeKey === nav.key ? 'bg-selected' : ''}`}>
                            {nav.icon}
                            <span>
                                {nav.label}
                            </span>
                            </Link>
                            
                            </motion.li>
                    ))
                 }
        </motion.ul>
            }
        </AnimatePresence>
        
    </motion.div>
  )
}

export default StaggerAccordion