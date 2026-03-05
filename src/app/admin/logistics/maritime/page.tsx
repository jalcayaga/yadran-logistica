'use client';

import React, { useEffect, useState } from 'react';
import {
    Anchor, Wind, Waves, Eye, AlertTriangle, CheckCircle2,
    XCircle, RefreshCw, Info, Search, Radar, Thermometer,
    Droplets, Gauge, CloudRain, Navigation, ArrowUpRight,
    Languages
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface WeatherData {
    wind_speed: number;
    wind_direction: number;
    wind_gust: number;
    wave_height: number;
    wave_direction: number;
    wave_period: number;
    swell_wave_height: number;
    swell_wave_direction: number;
    swell_wave_period: number;
    temperature: number;
    humidity: number;
    pressure: number;
    precipitation: number;
    timestamp: string;
}

interface Port {
    id: string;
    name: string;
    port_code: string;
    status: {
        status: string;
        last_update: string;
        observation?: string;
    } | null;
}

interface Center {
    id: string;
    name: string;
    code: string;
    weather: WeatherData | null;
}

const translations = {
    es: {
        title: "Súper Estación",
        subtitle: "Yadran",
        mode: "Modo SaaS • v4.1 Industrial",
        realtime: "Datos Oceanográficos en Tiempo Real",
        sync: "Sincronizar",
        sync_success: "Sincronización Exitosa",
        sync_desc: "Súper Estación actualizada con 15+ variables.",
        error_conn: "Error de Conexión",
        error_desc: "No se pudieron obtener los datos SaaS.",
        initializing: "Iniciando Súper Estación SaaS",
        system_online: "Sistema en Línea",
        ports_jurisdiction: "Jurisdicción de Puertos",
        search_placeholder: "Filtrar centros operativos...",
        node: "Nodo",
        atm_pressure: "Presión Atmosférica",
        precipitation: "Precipitación",
        nautical_wind: "Datos Náuticos de Viento",
        wind_knots_avg: "Nudos (Promedio)",
        gusts: "Ráfagas",
        sea_state: "Análisis del Estado del Mar",
        combined_waves: "Olas Combinadas",
        dominant_period: "Periodo Dominante",
        swell_analysis: "Análisis de Swell",
        atm_engine: "Motor Atmosférico",
        temp_2m: "Temp. 2m",
        rel_hum: "Hum. Relat.",
        rain: "Lluvia",
        waiting_sync: "Esperando sincronización de métricas SaaS...",
        port_open: "ABIERTO",
        port_closed: "CERRADO",
        port_restricted: "RESTRINGIDO",
        port_pending: "PENDIENTE",
        reason_title: "MOTIVO DEL CIERRE",
        last_update: "ACTUALIZADO",
    },
    en: {
        title: "Super Station",
        subtitle: "Yadran",
        mode: "SaaS Mode • v4.1 Industrial",
        realtime: "Real-time Oceanographic Data",
        sync: "Synchronize",
        sync_success: "Sync Successful",
        sync_desc: "Super Station updated with 15+ variables.",
        error_conn: "Connection Error",
        error_desc: "Failed to fetch SaaS data.",
        initializing: "Initializing Super Station SaaS",
        system_online: "System Online",
        ports_jurisdiction: "Port Jurisdictions",
        search_placeholder: "Filter operational centers...",
        node: "Node",
        atm_pressure: "Atmospheric Pressure",
        precipitation: "Precipitation",
        nautical_wind: "Nautical Wind Data",
        wind_knots_avg: "Knots (Avg)",
        gusts: "Gusts",
        sea_state: "Sea State Analytics",
        combined_waves: "Combined Waves",
        dominant_period: "Dominance Period",
        swell_analysis: "Swell Analysis",
        atm_engine: "Atmospheric Engine",
        temp_2m: "Temp. 2m",
        rel_hum: "Relat. Humidity",
        rain: "Rain",
        waiting_sync: "Waiting for SaaS metrics sync...",
        port_open: "OPEN",
        port_closed: "CLOSED",
        port_restricted: "RESTRICTED",
        port_pending: "PENDING",
        reason_title: "CLOSURE REASON",
        last_update: "UPDATED",
    }
};

export default function MaritimeDashboard() {
    const [lang, setLang] = useState<'es' | 'en'>('es');
    const t = translations[lang];

    const [data, setData] = useState<{ ports: Port[], centers: Center[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    const fetchData = async (isManual = false) => {
        if (isManual) setLoading(true);
        try {
            const res = await fetch('/api/maritime/snapshots');
            if (res.ok) {
                const json = await res.json();
                setData(json);
                if (isManual) {
                    toast({ title: t.sync_success, description: t.sync_desc });
                }
            }
        } catch (error) {
            console.error("Error fetching maritime snapshots:", error);
            toast({ variant: "destructive", title: t.error_conn, description: t.error_desc });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 300000);
        return () => clearInterval(interval);
    }, []);

    const filteredCenters = data?.centers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const getWindColor = (speed: number) => {
        if (speed > 30) return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
        if (speed > 15) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    };

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 blur-xl bg-blue-500/20 animate-pulse rounded-full" />
                    <Radar className="w-16 h-16 animate-spin text-blue-500 relative z-10" />
                </div>
                <h2 className="text-xl font-bold text-zinc-100 tracking-widest uppercase">{t.initializing}</h2>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header SaaS Style */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 py-6 bg-zinc-900/40 rounded-3xl border border-zinc-100/5 backdrop-blur-3xl shadow-2xl">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg shadow-blue-900/20 ring-1 ring-white/10">
                        <Radar className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight uppercase">{t.title} <span className="text-blue-500 italic">{t.subtitle}</span></h1>
                        <p className="text-zinc-500 font-bold text-xs tracking-tighter uppercase flex items-center gap-2">
                            {t.mode} • {t.realtime}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end mr-4 hidden sm:flex">
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{t.system_online}</span>
                        <span className="text-xs font-mono text-zinc-500">{new Date().toLocaleTimeString()}</span>
                    </div>

                    {/* Language Switcher */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 px-3 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all border border-zinc-700 shadow-sm">
                                <Languages className="w-4 h-4 text-zinc-300" />
                                <span className="text-xs font-black text-zinc-300 uppercase">{lang}</span>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-300">
                            <DropdownMenuItem onClick={() => setLang('es')} className="hover:bg-zinc-800 cursor-pointer text-xs font-bold uppercase">
                                Español (ESP)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLang('en')} className="hover:bg-zinc-800 cursor-pointer text-xs font-bold uppercase">
                                English (ENG)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <button onClick={() => fetchData(true)} className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all font-black text-xs text-zinc-300 uppercase tracking-widest">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> {t.sync}
                    </button>
                </div>
            </div>

            {/* Jurisdictions / Ports */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                {data?.ports.map((port) => (
                    <Card key={port.id} className="bg-zinc-900/20 border-zinc-800/40 hover:border-zinc-700/60 transition-colors shadow-none group">
                        <CardHeader className="p-4 flex flex-row items-center justify-between pb-2">
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{port.port_code}</span>
                            <Anchor className={`w-4 h-4 ${port.status?.status === 'CERRADO' ? 'text-rose-500' : 'text-zinc-700'}`} />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <h3 className="text-sm font-bold text-zinc-300 truncate mb-3">{port.name}</h3>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger className="w-full">
                                        <Badge className={`w-full justify-center py-1.5 text-[10px] uppercase font-black tracking-widest border-0 ${port.status?.status === 'CERRADO' ? 'bg-rose-500/10 text-rose-500' :
                                                port.status?.status === 'ABIERTO' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'
                                            }`}>
                                            {port.status?.status === 'CERRADO' ? t.port_closed :
                                                port.status?.status === 'ABIERTO' ? t.port_open :
                                                    port.status?.status === 'RESTRINGIDO' ? t.port_restricted : t.port_pending}
                                        </Badge>
                                    </TooltipTrigger>
                                    {port.status?.observation && (
                                        <TooltipContent className="bg-black border-zinc-800 text-xs p-2 max-w-[200px]">
                                            <p className="font-black text-rose-500 text-[9px] mb-1">{t.reason_title}</p>
                                            {port.status.observation}
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            </TooltipProvider>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Mega Station View */}
            <div className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                    <Search className="w-5 h-5 text-zinc-500" />
                    <Input
                        placeholder={t.search_placeholder}
                        className="bg-transparent border-0 border-b border-zinc-800 rounded-none focus-visible:ring-0 text-xl font-bold text-zinc-200 placeholder:text-zinc-700 h-12"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {filteredCenters.map((center) => (
                        <Card key={center.id} className="bg-zinc-900/40 border-zinc-800 overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-zinc-800/10 to-transparent">
                                <div>
                                    <h2 className="text-2xl font-black text-white italic truncate">{center.name}</h2>
                                    <Badge variant="outline" className="mt-1 border-blue-500/20 text-blue-400 font-mono text-[9px] uppercase tracking-[0.3em]">
                                        {t.node}: {center.code}
                                    </Badge>
                                </div>
                                <div className="flex gap-4">
                                    {center.weather && (
                                        <>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black text-zinc-500 uppercase">{t.atm_pressure}</span>
                                                <span className="text-xl font-mono font-bold text-zinc-300">{center.weather.pressure} <span className="text-[9px] opacity-30">hPa</span></span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black text-zinc-500 uppercase">{t.precipitation}</span>
                                                <span className={`text-xl font-mono font-bold ${center.weather.precipitation > 0 ? 'text-blue-400' : 'text-zinc-300'}`}>{center.weather.precipitation} <span className="text-[9px] opacity-30">mm</span></span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <CardContent className="p-0">
                                {center.weather ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 divide-x divide-zinc-800">
                                        {/* Nautical Group: Wind */}
                                        <div className="p-6 bg-zinc-950/20">
                                            <div className="flex items-center justify-between mb-6">
                                                <h4 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                                    <Wind className="w-4 h-4 text-blue-500" /> {t.nautical_wind}
                                                </h4>
                                                <Navigation style={{ transform: `rotate(${center.weather.wind_direction}deg)` }} className="w-5 h-5 text-blue-500 transition-transform duration-1000" />
                                            </div>
                                            <div className="flex items-end gap-6">
                                                <div className="flex flex-col">
                                                    <span className={`text-5xl font-black italic ${getWindColor(center.weather.wind_speed).split(' ')[0]}`}>
                                                        {center.weather.wind_speed}
                                                    </span>
                                                    <span className="text-[10px] font-black text-zinc-600 uppercase">{t.wind_knots_avg}</span>
                                                </div>
                                                <div className="flex-1 pb-2">
                                                    <div className="flex justify-between text-[9px] font-black text-zinc-500 mb-2 uppercase">
                                                        <span>{t.gusts}</span>
                                                        <span className="text-zinc-300">{center.weather.wind_gust} KT</span>
                                                    </div>
                                                    <Progress value={(center.weather.wind_speed / 45) * 100} className="h-1.5 bg-zinc-800" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Nautical Group: Sea State */}
                                        <div className="p-6 bg-zinc-950/40">
                                            <div className="flex items-center justify-between mb-6">
                                                <h4 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                                    <Waves className="w-4 h-4 text-emerald-500" /> {t.sea_state}
                                                </h4>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] font-black text-zinc-500">{center.weather.wave_direction}°</span>
                                                    <ArrowUpRight style={{ transform: `rotate(${center.weather.wave_direction}deg)` }} className="w-4 h-4 text-emerald-500" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-8">
                                                <div>
                                                    <div className="text-4xl font-black text-zinc-100 flex items-baseline gap-1">
                                                        {center.weather.wave_height} <span className="text-sm">M</span>
                                                    </div>
                                                    <span className="text-[10px] font-black text-zinc-600 uppercase">{t.combined_waves}</span>
                                                </div>
                                                <div>
                                                    <div className="text-4xl font-black text-zinc-100 flex items-baseline gap-1">
                                                        {center.weather.wave_period} <span className="text-sm">S</span>
                                                    </div>
                                                    <span className="text-[10px] font-black text-zinc-600 uppercase">{t.dominant_period}</span>
                                                </div>
                                            </div>
                                            <div className="mt-6 flex items-center gap-4 p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-zinc-500 uppercase">{t.swell_analysis}</span>
                                                    <span className="text-[11px] font-bold text-zinc-300">{center.weather.swell_wave_height}m @ {center.weather.swell_wave_period}s</span>
                                                </div>
                                                <div className="ml-auto w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center">
                                                    <Navigation style={{ transform: `rotate(${center.weather.swell_wave_direction}deg)` }} className="w-4 h-4 text-zinc-600" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Atmospheric Group */}
                                        <div className="p-6 bg-zinc-950/20">
                                            <h4 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                <Gauge className="w-4 h-4 text-amber-500" /> {t.atm_engine}
                                            </h4>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center p-3 hover:bg-white/5 rounded-xl transition-colors cursor-default border border-transparent hover:border-zinc-800">
                                                    <div className="flex items-center gap-3">
                                                        <Thermometer className="w-4 h-4 text-rose-400" />
                                                        <span className="text-xs font-bold text-zinc-400 uppercase">{t.temp_2m}</span>
                                                    </div>
                                                    <span className="text-lg font-black text-zinc-100">{center.weather.temperature}°C</span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 hover:bg-white/5 rounded-xl transition-colors cursor-default border border-transparent hover:border-zinc-800">
                                                    <div className="flex items-center gap-3">
                                                        <Droplets className="w-4 h-4 text-blue-400" />
                                                        <span className="text-xs font-bold text-zinc-400 uppercase">{t.rel_hum}</span>
                                                    </div>
                                                    <span className="text-lg font-black text-zinc-100">{center.weather.humidity}%</span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 hover:bg-white/5 rounded-xl transition-colors cursor-default border border-transparent hover:border-zinc-800">
                                                    <div className="flex items-center gap-3">
                                                        <CloudRain className={`w-4 h-4 ${center.weather.precipitation > 0 ? 'text-blue-400 animate-bounce' : 'text-zinc-500'}`} />
                                                        <span className="text-xs font-bold text-zinc-400 uppercase">{t.rain}</span>
                                                    </div>
                                                    <span className={`text-lg font-black ${center.weather.precipitation > 0 ? 'text-blue-400' : 'text-zinc-600'}`}>
                                                        {center.weather.precipitation} mm
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-64 flex flex-col items-center justify-center space-y-4 border-t border-zinc-800">
                                        <RefreshCw className="w-10 h-10 text-zinc-800 animate-spin" />
                                        <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">{t.waiting_sync}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
