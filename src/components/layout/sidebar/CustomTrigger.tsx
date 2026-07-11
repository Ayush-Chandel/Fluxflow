import { BarLeftIcon} from "@/components/icons"
import { useSidebar } from "@/components/ui/sidebar"

type TriggerProps = {
  isPinned: boolean
  onPin: () => void
  onUnpin: () => void
}
export function CustomTrigger({ isPinned, onPin, onUnpin }: TriggerProps) {
  const { setOpen } = useSidebar()

  const handleClick = () => {
    if (isPinned) {
      onUnpin()
      setOpen(false)  // collapse immediately on unpin
    } else {
      onPin()
      setOpen(true)   // expand and lock on pin
    }
  }

  return (
    <button onClick={handleClick} className="p-1.5 rounded-full bg-elevated border-edge border w-fit absolute left-3 top-3">
      <BarLeftIcon size={14} />
    </button>
  )
}