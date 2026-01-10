import { ThemeToggle } from '@/components/ThemeToggle';

import { BrandLogo } from './BrandLogo';
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { Moon, Printer, Sun, MoreVertical, LogOut, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

type HeaderBarProps = {
    theme?: 'light' | 'dark';
    onToggleTheme?: () => void;
    onPrint?: () => void;
    onLogout?: () => void;
    canPrint?: boolean;
    className?: string;
    title?: string;
    subtitle?: string;
    hideTitle?: boolean;
    showPrintButton?: boolean;
    children?: React.ReactNode;
    navContent?: React.ReactNode; // Added custom nav content
    onNavigateHome?: () => void;
};

const HeaderBar = ({
    theme = 'light',
    onToggleTheme,
    onPrint,
    onLogout,
    canPrint = false,
    className,
    title = "Logística Yadran",
    subtitle = "Gestión de Itinerarios y Recursos",
    hideTitle = false,
    showPrintButton = false,
    children,
    navContent,
    onNavigateHome,
}: HeaderBarProps) => (
    <div className={cn("overflow-hidden rounded-3xl border border-border bg-card shadow-xl ring-1 ring-border/40 mb-6", className)}>
        <div className="flex flex-col gap-4 p-4 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <BrandLogo variant="yadran" className="h-10 w-[120px] shrink-0" />
                    <BrandLogo variant="netsea" className="h-12 w-[120px] shrink-0" />
                </div>

                {navContent && (
                    <div className="flex-1 flex justify-center">
                        {navContent}
                    </div>
                )}

                {!navContent && !hideTitle && (
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground md:text-right">
                        <p className="font-medium text-primary">{title}</p>
                        <p>{subtitle}</p>
                    </div>
                )}

                {/* Mobile actions: DropdownMenu */}
                <div className="md:hidden flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Más acciones</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">

                            {onLogout && (
                                <DropdownMenuItem onClick={onLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Cerrar sesión
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                {/* Desktop actions: Buttons */}
                <div className="hidden md:flex flex-wrap items-center justify-end gap-2 print-hidden">
                    {onNavigateHome && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onNavigateHome}
                            className="gap-2 text-muted-foreground hover:bg-muted/40 dark:hover:bg-muted/30"
                            title="Volver a Inicio"
                        >
                            <div className="flex items-center gap-2 bg-secondary/50 hover:bg-secondary/80 px-3 py-1 rounded-full transition-colors">
                                <span className="text-xs font-medium">Inicio</span>
                            </div>
                        </Button>
                    )}

                    {children}

                    <ThemeToggle />

                    {showPrintButton && onPrint && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onPrint}
                            className="gap-2 border-primary/20 text-primary hover:bg-primary/10 dark:border-primary/30 dark:hover:bg-primary/20"
                            disabled={!canPrint}
                        >
                            <Printer className="h-4 w-4" />
                            Imprimir PDF
                        </Button>
                    )}

                    {onLogout && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted/40 dark:hover:bg-muted/30"
                            onClick={onLogout}
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="sr-only">Cerrar sesión</span>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    </div >
);

export default HeaderBar;
