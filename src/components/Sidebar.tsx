"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    CalendarRange,
    Users,
    ShipWheel,
    Ship,
    MapPin,
    Anchor,
    Route,
    ShieldCheck,
    Menu,
    X,
    ChevronRight
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { Button } from './ui/button';

export const ROLES = {
    SYSADMIN: 'sysadmin',
    ADMIN: 'admin',
    OPERATOR: 'operator',
};

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    color?: string;
    role?: string;
}

interface NavGroup {
    group: string;
    items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
    {
        group: "Principal",
        items: [
            { label: "Resumen Operativo", href: "/logistica/dashboard", icon: LayoutDashboard, color: "text-blue-500" },
        ]
    },
    {
        group: "Operaciones",
        items: [
            { label: "Itinerarios", href: "/admin/logistics/itineraries", icon: CalendarRange, color: "text-blue-600" },
            { label: "Tripulación", href: "/admin/crew", icon: ShipWheel, color: "text-orange-600" },
            { label: "Pasajeros", href: "/admin/people", icon: Users, color: "text-indigo-600" },
        ]
    },
    {
        group: "Maestros",
        items: [
            { label: "Naves", href: "/admin/vessels", icon: Ship, color: "text-cyan-600" },
            { label: "Locaciones", href: "/admin/locations", icon: MapPin, color: "text-emerald-600" },
            { label: "Operadores", href: "/admin/operators", icon: Anchor, color: "text-orange-500" },
            { label: "Rutas", href: "/admin/routes", icon: Route, color: "text-slate-600" },
        ]
    },
    {
        group: "Sistema",
        items: [
            { label: "Usuarios", href: "/admin/users", icon: ShieldCheck, color: "text-purple-600", role: ROLES.SYSADMIN },
        ]
    }
];

export function Sidebar({ role }: { role?: string }) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    // Close mobile sidebar on navigation
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    const SidebarContent = () => (
        <div className="flex flex-col h-full py-6 px-4">
            <div className="px-3 mb-8 flex items-center gap-3">
                <BrandLogo variant="yadran" className="h-8 w-auto" />
                <div className="h-4 w-px bg-border/60 mx-1" />
                <BrandLogo variant="netsea" className="h-8 w-auto" />
            </div>

            <div className="flex-1 space-y-8 overflow-y-auto no-scrollbar">
                {NAV_GROUPS.map((group) => {
                    const filteredItems = group.items.filter(item => !item.role || item.role === role);
                    if (filteredItems.length === 0) return null;

                    return (
                        <div key={group.group} className="space-y-2">
                            <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                                {group.group}
                            </h3>
                            <div className="space-y-1">
                                {filteredItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    const Icon = item.icon;

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                                                isActive
                                                    ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-1.5 rounded-lg transition-colors",
                                                    isActive ? "bg-white shadow-sm dark:bg-slate-800" : "bg-transparent group-hover:bg-white dark:group-hover:bg-slate-800"
                                                )}>
                                                    <Icon className={cn("w-4 h-4", isActive ? item.color : "text-slate-500")} />
                                                </div>
                                                <span>{item.label}</span>
                                            </div>
                                            {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-auto pt-6 border-t border-border/50 px-2 text-[10px] text-muted-foreground font-medium flex justify-between items-center">
                <span>Yadran Logística v2.0</span>
                <span className="bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-full ring-1 ring-emerald-500/20">Online</span>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-72 flex-col fixed inset-y-0 z-50 border-r border-border/40 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Toggle */}
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden fixed top-4 left-4 z-[60] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-border shadow-sm rounded-xl"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            {/* Mobile Sidebar Drawer */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}
            <aside className={cn(
                "lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-zinc-950 shadow-2xl transition-transform duration-300 ease-in-out transform",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <SidebarContent />
            </aside>
        </>
    );
}
