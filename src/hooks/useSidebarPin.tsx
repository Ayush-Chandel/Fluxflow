import { useState } from "react"

export function useSidebarPin(defaultPinned = true) {
  const [isPinned, setIsPinned] = useState(defaultPinned)
  return { isPinned, pin: () => setIsPinned(true), unpin: () => setIsPinned(false) }
}