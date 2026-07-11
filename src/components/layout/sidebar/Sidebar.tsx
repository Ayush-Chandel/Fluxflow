import { useSidebar } from "@/components/ui/sidebar"
import { AnimatePresence, motion } from "framer-motion"
import SidebarContent from "./SidebarContent"

type Props = {
  isPinned: boolean
  onPin: () => void
  onUnpin: () => void
}

function Sidebar({ isPinned, onPin, onUnpin }: Props) {
  const { open, setOpen } = useSidebar()

  const isHoverReveal = open && !isPinned
  const isPinnedOpen  = open && isPinned

  const handleMouseLeave = () => {
    if (!isPinned) setOpen(false)
  }

  return (
    <>
      
      {/* Spacer — only when pinned, pushes <main> to the right */}
      {isPinnedOpen && <div className="shrink-0 w-[17%]" />}

      {/* Single sidebar — always fixed, slides in/out */}
      <SidebarContent handleMouseLeave={handleMouseLeave} isHoverReveal={isHoverReveal} open={open} />

      {/* Backdrop — hover reveal only */}
      <AnimatePresence>
        {isHoverReveal && (
          <motion.div
            key="sidebar-backdrop"
            className="fixed inset-0 z-30 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onMouseEnter={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Hover zone strip */}
      {!open && (
        <div
          className=" h- w-3 z-50"
          onMouseEnter={() => setOpen(true)}
        />
      )}


    </>
  )
}
export default Sidebar