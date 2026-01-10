'use client';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Shield, LayoutDashboard, Ship } from "lucide-react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { format } from "date-fns";

interface UserNavProps {
    email?: string | null;
    role?: string | null;
}

export function UserNav({ email, role }: UserNavProps) {
    const initials = email ? email.substring(0, 2).toUpperCase() : 'U';

    return (
        <div className="flex items-center gap-4">
            {/* Context Switchers - Visible on Desktop */}
            <div className="hidden md:flex items-center gap-2 mr-2">
                <Link href="/logistica/dashboard">
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
                        <Ship className="w-4 h-4" />
                        Logística
                    </Button>
                </Link>
                <Link href="/admin">
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
                        <Shield className="w-4 h-4" />
                        Admin
                    </Button>
                </Link>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10 border border-border/50">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{email?.split('@')[0]}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {email}
                            </p>
                            {role && (
                                <span className="inline-flex mt-1 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                    {role}
                                </span>
                            )}
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/logistica/dashboard" className="cursor-pointer">
                            <Ship className="mr-2 h-4 w-4" />
                            <span>Vista Logística</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                            <Shield className="mr-2 h-4 w-4" />
                            <span>Panel Admin</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <div className="p-1">
                        <LogoutButton variant="destructive" className="w-full justify-start h-8 text-xs" showLabel={true} />
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
