import type { RouteHandle } from "@/lib/utils";

export type SidebarKey = 'projects' | 'issues' | 'cycles' | undefined;


export type NavLabel = {
    label: string;
    key: SidebarKey;
}

export type Navlinks = NavLabel & {
    path: string;
    icon: React.ReactNode;
}


export const sidebarHandle = (sidebarKey:SidebarKey):RouteHandle=>({sidebarKey});