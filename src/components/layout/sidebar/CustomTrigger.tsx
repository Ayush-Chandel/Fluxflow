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
    <button onClick={handleClick} className=" ">
      <BarLeftIcon size={14} />
    </button>
  )
}