import type { SidebarKey } from "@/types/layout";
import { clsx, type ClassValue } from "clsx"
import { useMatches } from "react-router";
import { twMerge } from "tailwind-merge"

export type RouteHandle = { sidebarKey?: SidebarKey }

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function useSidebarKey() {
  const matches = useMatches()
  return matches.findLast(m => (m.handle as RouteHandle)?.sidebarKey)
    ?.handle as RouteHandle | undefined
}
