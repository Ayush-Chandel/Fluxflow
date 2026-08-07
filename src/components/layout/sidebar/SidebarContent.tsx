import { cn } from '@/lib/utils'
import { motion } from 'motion/react';
import SideHeader from './SideHeader';
import SideContent from './SideContent';

type SideBarContentProps = {
    open:boolean;
    isHoverReveal:boolean;
    handleMouseLeave:()=>void;
}

function SidebarContent({open, isHoverReveal,handleMouseLeave}: SideBarContentProps) {
  return (

      <motion.div
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-[200px] p-4 pr-3 bg-background",
          isHoverReveal && "shadow-2xl rounded-r-xl"
        )}
        animate={{ x: open ? 0 : "-100%" }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onMouseLeave={handleMouseLeave}
      >
        <SideHeader />
        <SideContent />
      </motion.div>
  )
}

export default SidebarContent