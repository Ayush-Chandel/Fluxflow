import { useEffect } from "react"
import { useSidebar } from "@/components/ui/sidebar"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { AnimatePresence, motion } from "framer-motion"
import SidebarContent from "./SidebarContent"

type Props = {
  isPinned: boolean
  onPin: () => void
  onUnpin: () => void
}

function Sidebar({ isPinned }: Props) {
  const { open, setOpen } = useSidebar()
  const isMobile = useMediaQuery("(max-width: 1023px)")

  useEffect(() => {
    setOpen(isMobile ? false : isPinned)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile])

  const isDocked  = open && isPinned && !isMobile
  const isOverlay = open && (isMobile || !isPinned)

  const handleMouseLeave = () => {
    // Hover-away close is a desktop-only concern.
    if (!isMobile && !isPinned) setOpen(false)
  }

  return (
    <>
      {/* Spacer — only when docked, pushes <main> to the right */}
      {isDocked && <div className="shrink-0 w-[200px]" />}

      {/* Single sidebar — always fixed, slides in/out */}
      <SidebarContent handleMouseLeave={handleMouseLeave} isHoverReveal={isOverlay} open={open} />

      {/* Backdrop — shown whenever the panel is floating (hover reveal or mobile drawer) */}
      <AnimatePresence>
        {isOverlay && (
          <motion.div
            key="sidebar-backdrop"
            className="fixed inset-0 z-30 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
            onMouseEnter={() => { if (!isMobile) setOpen(false) }}
          />
        )}
      </AnimatePresence>

      {/* Hover zone strip — desktop only, so hover can't reveal the sidebar on mobile */}
      {!open && !isMobile && (
        <div
          className=" h- w-3 z-50"
          onMouseEnter={() => setOpen(true)}
        />
      )}
    </>
  )
}
export default Sidebar
