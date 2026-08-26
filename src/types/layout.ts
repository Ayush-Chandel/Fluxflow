import type { RouteHandle } from "@/lib/utils";
import React from "react";

export type SidebarKey = 'projects' | 'issues' | 'cycles' | 'templates' | undefined;

export type SidebarControls = {
    isPinned: boolean;
    pin: () => void;
    unpin: () => void;
}


export type NavLabel = {
    label: string;
    key: SidebarKey;
    path: string;
}

export type Navlinks = NavLabel & {
    path: string;
    icon: React.ReactNode;
}

export type NavChild = {
    label: string;
    path: string;
    icon?: React.ReactNode;
}

export type NavGroup = Omit<Navlinks, 'path'> & {
    path?: string;
    children: NavChild[]
}

export type NavItem = Navlinks | NavGroup

export const sidebarHandle = (sidebarKey:SidebarKey):RouteHandle=>({sidebarKey});
