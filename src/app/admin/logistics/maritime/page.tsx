'use client';

import React, { useEffect, useState } from 'react';
import {
    Anchor,
    Wind,
    Waves,
    Eye,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Info,
    Search,
    Radar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';

interface WeatherData {
    wind_speed: number;
    wind_gust: number;
    wave_height: number;
    visibility: number;
    timestamp: string;
}

interface Port {
    id: string;
    name: string;
    port_code: string;
    status: {
        status: string;
        last_update: string;
    } | null;
}

interface Center {
    id: string;
    name: string;
    code: string;
    weather: WeatherData | null;
}

export default function MaritimeDashboard() {
    const [data, setData] = useState<{ ports: Port[], centers: Center[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/maritime/snapshots');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error("Error fetching maritime snapshots:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 120000); // 2 min refresh
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
                    <RefreshCw className="w-16 h-16 animate-spin text-blue-500 relative z-10" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-semibold text-zinc-200">Sincronizando Torre de Control</h2>
                    <p className="text-zinc-500 max-w-xs">Obteniendo datos oceanográficos y meteorológicos en tiempo real...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <Radar className="w-6 h-6 text-blue-400" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-zinc-100 uppercase italic italic">
                            Torre de Control <span className="text-blue-500">Marítimo</span>
                        </h1>
                    </div>
                    <p className="text-zinc-400 text-lg font-medium pl-1">
                        Sincronización en tiempo real • Red de Monitoreo Yadran
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-100/10 backdrop-blur-md">
                    <Badge variant="outline" className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                        LIVE DATA
                    </Badge>
                    <button
                        onClick={fetchData}
                        className="p-2.5 hover:bg-zinc-800 rounded-xl transition-all active:scale-95 text-zinc-400 hover:text-white border border-transparent hover:border-zinc-700"
                        title="Actualizar ahora"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Ports Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5 px-1">
                {data?.ports.map((port) => (
                    <Card key={port.id} className="relative overflow-hidden border-zinc-800 bg-zinc-900/40 backdrop-blur-xl hover:bg-zinc-800/60 transition-all duration-300 group shadow-2xl">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-25 transition-opacity">
                            <Anchor className="w-12 h-12 text-blue-400" />
                        </div>
                        <CardHeader className="p-5 pb-2 relative z-10">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black text-blue-500 tracking-[0.2em] uppercase">{port.port_code}</span>
                                <Badge variant="outline" className="text-[9px] border-zinc-700 text-zinc-500 px-1 py-0">JURID</Badge>
                            </div>
                            <CardTitle className="text-lg font-bold text-zinc-200">{port.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-0 relative z-10">
                            <div className="mt-3">
                                {port.status?.status === 'CERRADO' ? (
                                    <div className="flex flex-col gap-2">
                                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-rose-500 w-full" />
                                        </div>
                                        <Badge className="w-full justify-center py-1.5 gap-2 bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30">
                                            <XCircle className="w-4 h-4" /> CERRADO
                                        </Badge>
                                    </div>
                                ) : port.status?.status === 'RESTRINGIDO' ? (
                                    <div className="flex flex-col gap-2">
                                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-amber-500 w-2/3" />
                                        </div>
                                        <Badge className="w-full justify-center py-1.5 gap-2 bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30">
                                            <AlertTriangle className="w-4 h-4" /> RESTRINGIDO
                                        </Badge>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 w-full" />
                                        </div>
                                        <Badge className="w-full justify-center py-1.5 gap-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 ring-1 ring-emerald-500/20">
                                            <CheckCircle2 className="w-4 h-4" /> ABIERTO
                                        </Badge>
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] font-mono text-zinc-500 mt-4 text-center tracking-tighter">
                                ACT: {port.status?.last_update ? new Date(port.status.last_update).toLocaleTimeString() : 'PENDIENTE'}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Centers Table Section */}
            <Card className="border-none bg-zinc-900/60 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
                <CardHeader className="p-8 border-b border-zinc-800/50 bg-zinc-900/20">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-3 text-2xl font-bold text-zinc-100">
                                <div className="p-2 bg-zinc-800 rounded-xl">
                                    <Wind className="w-6 h-6 text-blue-400" />
                                </div>
                                Estado de Centros Operativos
                            </CardTitle>
                            <CardDescription className="text-zinc-500 font-medium text-sm pl-12 uppercase tracking-wide">
                                Microclima local y alertas de navegación
                            </CardDescription>
                        </div>
                        <div className="relative w-full lg:w-96 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                            <Input
                                placeholder="Buscar por nombre o código de centro..."
                                className="pl-12 h-14 bg-zinc-950/50 border-zinc-800 focus:border-blue-500/50 text-zinc-200 text-lg rounded-2xl transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-zinc-950/30">
                                <TableRow className="hover:bg-transparent border-zinc-800">
                                    <TableHead className="w-[300px] pl-8 py-5 font-black text-[10px] text-zinc-500 uppercase tracking-[0.2em]">Centro Operativo</TableHead>
                                    <TableHead className="py-5 font-black text-[10px] text-zinc-500 uppercase tracking-[0.2em]">Viento (Nudos)</TableHead>
                                    <TableHead className="py-5 font-black text-[10px] text-zinc-500 uppercase tracking-[0.2em]">Ráfagas (Nudos)</TableHead>
                                    <TableHead className="py-5 font-black text-[10px] text-zinc-500 uppercase tracking-[0.2em]">Ola (Metros)</TableHead>
                                    <TableHead className="py-5 font-black text-[10px] text-zinc-500 uppercase tracking-[0.2em]">Visibilidad (KM)</TableHead>
                                    <TableHead className="pr-8 py-5 font-black text-[10px] text-zinc-500 uppercase tracking-[0.2em]">Última Actualización</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCenters.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                                                <Search className="w-12 h-12" />
                                                <p className="text-xl font-medium">No se encontraron centros</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredCenters.map((center) => (
                                        <TableRow key={center.id} className="hover:bg-zinc-800/30 transition-all border-zinc-800/40 group">
                                            <TableCell className="pl-8 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-lg font-bold text-zinc-200 group-hover:text-blue-400 transition-colors tracking-tight leading-none">{center.name}</span>
                                                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{center.code}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {center.weather ? (
                                                    <div className="flex items-center gap-4">
                                                        <span className={`w-14 text-center py-1.5 rounded-lg font-black text-sm border ${getWindColor(center.weather.wind_speed)}`}>
                                                            {center.weather.wind_speed} <span className="text-[10px] opacity-70 font-bold uppercase tracking-tighter">kt</span>
                                                        </span>
                                                        <div className="w-24 h-2 bg-zinc-800/50 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full transition-all duration-1000 ${center.weather.wind_speed > 30 ? 'bg-rose-500' :
                                                                    center.weather.wind_speed > 15 ? 'bg-amber-500' : 'bg-emerald-500'
                                                                    }`}
                                                                style={{ width: `${Math.min((center.weather.wind_speed / 45) * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-zinc-700 font-mono">---</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {center.weather ? (
                                                    <div className="flex items-center gap-2">
                                                        <Wind className={`w-4 h-4 ${center.weather.wind_gust > 30 ? 'text-rose-400' : 'text-zinc-500'}`} />
                                                        <span className="text-base font-bold text-zinc-300">{center.weather.wind_gust} <span className="text-[10px] text-zinc-500 uppercase">kt</span></span>
                                                    </div>
                                                ) : <span className="text-zinc-700">---</span>}
                                            </TableCell>
                                            <TableCell>
                                                {center.weather ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <Waves className={`w-5 h-5 ${center.weather.wave_height > 2.5 ? 'text-blue-400' : 'text-zinc-600'}`} />
                                                            {center.weather.wave_height > 2.5 && (
                                                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                                                            )}
                                                        </div>
                                                        <span className="text-base font-bold text-zinc-200">{center.weather.wave_height}m</span>
                                                    </div>
                                                ) : <span className="text-zinc-700">---</span>}
                                            </TableCell>
                                            <TableCell>
                                                {center.weather ? (
                                                    <div className="flex items-center gap-2 text-zinc-400">
                                                        <Eye className="w-4 h-4" />
                                                        <span className="text-sm font-semibold tracking-tight">{center.weather.visibility}km</span>
                                                    </div>
                                                ) : <span className="text-zinc-700">---</span>}
                                            </TableCell>
                                            <TableCell className="pr-8">
                                                {center.weather?.timestamp ? (
                                                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                                                        <span className="bg-zinc-800/50 px-2 py-1 rounded-md border border-zinc-700/30">
                                                            {new Date(center.weather.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', hour12: false })} HRS
                                                        </span>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                    <div className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors">
                                                                        <Info className="w-3.5 h-3.5 text-zinc-500" />
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="bg-zinc-900 border-zinc-700 text-zinc-200">
                                                                    <p className="font-bold flex items-center gap-2 text-blue-400 mb-1">
                                                                        <RefreshCw className="w-3 h-3" /> DATOS SINCRO
                                                                    </p>
                                                                    <p>Modelo: ECMWF / NOAA</p>
                                                                    <p>ID Consulta: {center.id.slice(0, 8)}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                ) : <span className="text-zinc-700 tracking-tighter">SIN DATOS RECIENTES</span>}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
