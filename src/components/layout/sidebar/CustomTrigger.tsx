import { BarLeftIcon} from "@/components/icons"
import { useSidebar } from "@/components/ui/sidebar"
import { useMediaQuery } from "@/hooks/useMediaQuery"

type TriggerProps = {
  isPinned: boolean
  onPin: () => void
  onUnpin: () => void
}
export function CustomTrigger({ isPinned, onPin, onUnpin }: TriggerProps) {
  const { setOpen } = useSidebar()
  const isMobile = useMediaQuery("(max-width: 1023px)")

  const handleClick = () => {
    // On mobile the button is a plain open/close toggle for the overlay drawer.
    // Pin state is left untouched so the desktop layout is restored on resize.
    if (isMobile) {
      setOpen((o) => !o)
      return
    }

    if (isPinned) {
      onUnpin()
      setOpen(false)  // collapse immediately on unpin
    } else {
      onPin()
      setOpen(true)   // expand and lock on pin
    }
  }

  return (
    <button onClick={handleClick} className="hover:bg-hover px-1.5 py-1.5 rounded-full">
      <BarLeftIcon size={14} />
    </button>
  )
}