import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Ship,
    Clock,
    CheckCircle,
    AlertCircle,
    TrendingUp,
    XCircle,
    UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsProps {
    total: number;
    inProgress: number;
    completed: number;
    pending: number;
    suspended: number;
    cancelled: number;
    crewConfirmed: number;
}

export default function StatsOverview({ total, inProgress, completed, pending, suspended, cancelled, crewConfirmed }: StatsProps) {
    const statCards = [
        {
            title: "Operaciones Totales",
            value: total,
            icon: Ship,
            bgColor: "bg-blue-50 dark:bg-blue-900/20",
            textColor: "text-blue-600 dark:text-blue-400",
        },
        {
            title: "En Navegación",
            value: inProgress,
            icon: Clock,
            bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
            textColor: "text-emerald-600 dark:text-emerald-400",
        },
        {
            title: "Pto. Cerrado / Susp.",
            value: suspended,
            icon: AlertCircle,
            bgColor: "bg-amber-50 dark:bg-amber-900/20",
            textColor: "text-amber-600 dark:text-amber-400",
        },
        {
            title: "Trip. Confirmada",
            value: crewConfirmed,
            icon: UserCheck,
            bgColor: "bg-purple-50 dark:bg-purple-900/20",
            textColor: "text-purple-600 dark:text-purple-400",
        }
    ];

    const secondaryStats = [
        { label: "Cancelados", value: cancelled, icon: XCircle, color: "text-red-500" },
        { label: "Finalizados", value: completed, icon: CheckCircle, color: "text-slate-400" },
        { label: "Pendientes", value: pending, icon: Clock, color: "text-blue-400" },
    ];

    return (
        <div className="flex flex-col gap-4 mb-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, idx) => (
                    <Card key={idx} className={cn(
                        "border-none shadow-lg transition-all duration-300",
                        "bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm",
                        "border border-white/20 dark:border-slate-800/50"
                    )}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                {stat.title}
                            </CardTitle>
                            <div className={cn("p-1.5 rounded-lg", stat.bgColor)}>
                                <stat.icon className={cn("h-4 w-4", stat.textColor)} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                                    {stat.value}
                                </div>
                                <div className="text-[9px] font-bold text-slate-400 flex items-center gap-0.5">
                                    LIVE
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex gap-6 px-6 py-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 self-start">
                {secondaryStats.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <s.icon className={cn("w-3.5 h-3.5", s.color)} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{s.label}:</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{s.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
