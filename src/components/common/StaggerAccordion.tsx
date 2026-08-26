
import type { NavItem, SidebarKey } from '@/types/layout';
import { CollapseArrowIcon } from '../icons'
import { AnimatePresence, motion } from 'motion/react';
import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { cn } from '@/lib/utils';

type Props = {
    label: string;
    navItems: NavItem[],
    activeKey?: SidebarKey;
    onNavigate: () => void;
}

type NavLeafProps = {
    to: string;
    label: string;
    icon?: ReactNode;
    isActive: boolean;
    onNavigate: () => void;
}


const isPathActive = (pathname: string, path: string) =>
    pathname === path || pathname.startsWith(path + '/')

function NavLeaf({ to, label, icon, isActive, onNavigate }: NavLeafProps) {
    return (
        <Link
            to={to}
            onClick={onNavigate}
            className={cn(
                'flex items-center gap-2 rounded-md px-2 py-0.5 text-[13px] font-medium text-muted',
                isActive ? 'bg-selected' : 'hover:bg-hover',
            )}
        >
            {icon}
            <span>{label}</span>
        </Link>
    )
}

function StaggerAccordion({
    label,
    navItems,
    activeKey,
    onNavigate,
}: Props) {

    const isNavRoute = navItems.some((nav)=>(activeKey===nav.key));
    const [open, setOpen] = useState(isNavRoute );
    const { pathname } = useLocation();

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
            <span className={`${open ? 'rotate-90' : 'rotate-0'}`}>
                <CollapseArrowIcon size={18} className='fill-muted' />
            </span>
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
                    navItems.map((nav)=>(
                        <motion.li
                        key={nav.label}
                            variants={navlinkVariants}
                            transition={{
                                duration: 0.2,
                                ease: 'easeIn'
                            }} >
                            {'children' in nav ? (
                                <>
                                    {nav.path ? (
                                        <NavLeaf
                                            to={nav.path}
                                            label={nav.label}
                                            icon={nav.icon}
                                            onNavigate={onNavigate}
                                            isActive={
                                                activeKey === nav.key &&
                                                !nav.children.some((child) => isPathActive(pathname, child.path))
                                            }
                                        />
                                    ) : (
                                        <div className='flex items-center gap-2 px-2 py-0.5 text-[13px] font-medium text-muted select-none'>
                                            {nav.icon}
                                            <span>{nav.label}</span>
                                        </div>
                                    )}

                                    <motion.ul variants={navparentVariants} className='mt-1 ml-[15px] space-y-1 border-l border-edge pl-1.5'>
                                        {nav.children.map((child)=>(
                                            <motion.li
                                                key={child.path}
                                                variants={navlinkVariants}
                                                transition={{
                                                    duration: 0.2,
                                                    ease: 'easeIn'
                                                }} >
                                                <NavLeaf
                                                    to={child.path}
                                                    label={child.label}
                                                    icon={child.icon}
                                                    onNavigate={onNavigate}
                                                    isActive={isPathActive(pathname, child.path)}
                                                />
                                            </motion.li>
                                        ))}
                                    </motion.ul>
                                </>
                            ) : (
                                <NavLeaf
                                    to={nav.path}
                                    label={nav.label}
                                    icon={nav.icon}
                                    onNavigate={onNavigate}
                                    isActive={activeKey === nav.key}
                                />
                            )}
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
