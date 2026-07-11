import { clsx, type ClassValue } from "clsx"
import { useMatches } from "react-router";
import { twMerge } from "tailwind-merge"

type RouteHandle = { sidebarKey?: string }

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function useSidebarKey() {
  const matches = useMatches()
  return matches.findLast(m => (m.handle as RouteHandle)?.sidebarKey)
    ?.handle as RouteHandle | undefined
}
