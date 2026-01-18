'use client';

import { useState, useEffect } from "react";
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, MessageSquare, Send, FileText, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ManifestDocument } from '@/components/pdf/ManifestDocument';
import { formatDate } from "@/utils/formatters";
import { getCaptainManifestLink, getPassengerNotificationLink } from "@/utils/whatsapp";

interface ManifestPreviewProps {
    itineraryId: string;
}

export default function ManifestPreview({ itineraryId }: ManifestPreviewProps) {
    const supabase = createClient();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        const fetchManifest = async () => {
            setLoading(true);

            // Fetch Itinerary + Vessel + Crew + Bookings (nested people)
            const { data: itin, error } = await supabase
                .from('itineraries')
                .select(`
                    *,
                    vessel:vessels(*),
                    crew:crew_assignments(*, person:people(*)),
                    bookings:bookings(
                        *, 
                        passenger:people(*), 
                        origin_stop:itinerary_stops!bookings_origin_stop_id_fkey(*, location:locations(*)), 
                        destination_stop:itinerary_stops!bookings_destination_stop_id_fkey(*, location:locations(*))
                    ),
                    stops:itinerary_stops(*, location:locations(*))
                `)
                .eq('id', itineraryId)
                .order('stop_order', { foreignTable: 'itinerary_stops', ascending: true })
                .single();

            if (error) {
                console.error('Error fetching manifest:', error);
            } else {
                setData(itin);
            }
            setLoading(false);
        };

        fetchManifest();
    }, [itineraryId]);

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = async () => {
        if (!data) return;
        setDownloading(true);
        try {
            const sortedPassengers = (data.bookings?.filter((b: any) => b.status !== 'cancelled') || [])
                .sort((a: any, b: any) => {
                    const orderA = a.destination_stop?.stop_order || 999;
                    const orderB = b.destination_stop?.stop_order || 999;
                    return orderA - orderB;
                });

            const { pdf } = await import('@react-pdf/renderer');
            const blob = await pdf(
                <ManifestDocument
                    vesselName={data.vessel?.name || 'Nave Desconocida'}
                    vesselRegistration={data.vessel?.registration_number}
                    vesselClass={data.vessel?.vessel_class}
                    callSign={data.vessel?.call_sign}
                    operatorName={data.vessel?.operator_name}
                    registrationPort={data.vessel?.registration_port}
                    originPort={data.stops?.[0]?.location?.name || '---'}
                    destinationPort={data.stops?.[data.stops.length - 1]?.location?.name || '---'}
                    itineraryDate={formatDate(data.date)}
                    startTime={data.start_time}
                    passengers={sortedPassengers}
                    crew={data.crew || []}
                />
            ).toBlob();

            const pdfBlob = new Blob([blob], { type: 'application/pdf' });
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `manifiesto_${data.date}_${data.vessel?.name?.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Error generating PDF:", e);
        } finally {
            setDownloading(false);
        }
    };

    if (loading) return <div>Cargando manifiesto...</div>;
    if (!data) return <div>No se pudo cargar el manifiesto.</div>;

    // Filter non-cancelled bookings and sort by destination stop order
    const passengers = (data.bookings?.filter((b: any) => b.status !== 'cancelled') || [])
        .sort((a: any, b: any) => {
            const orderA = a.destination_stop?.stop_order || 999;
            const orderB = b.destination_stop?.stop_order || 999;
            return orderA - orderB;
        });

    // Group crew by role
    const captain = data.crew?.find((c: any) => c.role === 'captain');
    const substitute = data.crew?.find((c: any) => c.role === 'substitute');
    const crewMembers = data.crew?.filter((c: any) => c.role === 'crew_member') || [];

    // DIRECTEMAR Headers
    const originPort = data.stops?.[0]?.location?.name || '---';
    const destinationPort = data.stops?.[data.stops.length - 1]?.location?.name || '---';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center print:hidden pb-4 border-b dark:border-slate-800">
                <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Manifiesto de Zarpe</h2>
                    <p className="text-xs text-muted-foreground">Logística Yadran - Control Oficial</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading} className="h-9 border-blue-200 dark:border-blue-900/50">
                        <FileText className="w-4 h-4 mr-2 text-blue-500" />
                        {downloading ? 'Generando...' : 'Descargar PDF'}
                    </Button>
                    <Button variant="default" size="sm" onClick={handlePrint} className="h-9 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700">
                        <Printer className="w-4 h-4 mr-2" /> Imprimir
                    </Button>
                </div>
            </div>

            {/* Premium Container */}
            <div className="bg-white dark:bg-slate-900/40 backdrop-blur-md rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden p-8 print:p-0 print:border-none print:shadow-none">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-10 border-b border-slate-100 dark:border-white/5 pb-8">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">Armada de Chile</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Directemar</span>
                        </div>
                        <h1 className="text-3xl font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white mt-2">Lista de Pasajeros</h1>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Armador / Operador:</span>
                            <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">{data.vessel?.operator_name || 'YADRAN QUELLÓN'}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-tighter py-1 px-3 border-blue-200 dark:border-blue-900/50 text-blue-600">
                            Zarpe Autorizado
                        </Badge>
                        <div className="text-right mt-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase block tracking-widest mb-0.5">Fecha de Zarpe</span>
                            <div className="text-xl font-black text-slate-900 dark:text-white uppercase leading-none">{formatDate(data.date)}</div>
                        </div>
                    </div>
                </div>

                {/* Vessel & Route Boxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="space-y-6">
                        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-500 mb-3 block">Embarcación</span>
                            <div className="flex flex-col">
                                <span className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                                    {data.vessel?.vessel_class} {data.vessel?.name}
                                </span>
                                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-200 dark:border-white/5">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Matrícula</span>
                                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                                            {data.vessel?.registration_port ? `${data.vessel.registration_port} ` : ''}{data.vessel?.registration_number}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Call Sign</span>
                                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{data.vessel?.call_sign || 'CB 0000'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Capacidad</span>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{data.vessel?.capacity} PAX</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-5 rounded-2xl bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-500 mb-3 block">Ruta Navegación</span>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Puerto Salida</span>
                                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{originPort}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Puerto Destino</span>
                                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{destinationPort}</span>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-blue-100 dark:border-blue-900/20">
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Hora estimada:</span>
                                    <span className="text-xs font-black text-blue-700 dark:text-blue-400">{data.start_time} HRS</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Crew Section */}
                <div className="mb-10 bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-6 border-b border-slate-200 dark:border-white/5 pb-3">
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Personal de Dotación</h3>
                        {captain?.person?.phone_e164 && (
                            <a
                                href={getCaptainManifestLink(captain.person.phone_e164, data, data.crew, passengers)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="print:hidden"
                            >
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase h-8 px-4 rounded-lg shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                                    <Send className="w-3.5 h-3.5 mr-2" /> Enviar Manifiesto
                                </Button>
                            </a>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase tracking-wider text-blue-500">Capitán</span>
                            <div className="text-sm font-black text-slate-900 dark:text-white uppercase leading-tight">
                                {captain?.person ? `${captain.person.first_name} ${captain.person.last_name}` : 'SIN ASIGNAR'}
                            </div>
                            <div className="font-mono text-[10px] text-slate-500 font-bold">{captain?.person?.rut_display}</div>
                        </div>
                        {substitute && (
                            <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase tracking-wider text-orange-500">Patrón (Sustituto)</span>
                                <div className="text-sm font-black text-slate-900 dark:text-white uppercase leading-tight">
                                    {substitute.person ? `${substitute.person.first_name} ${substitute.person.last_name}` : ''}
                                </div>
                                <div className="font-mono text-[10px] text-slate-500 font-bold">{substitute.person?.rut_display}</div>
                            </div>
                        )}
                        {crewMembers.map((cm: any, idx: number) => (
                            <div key={idx} className="space-y-1">
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Tripulante</span>
                                <div className="text-sm font-black text-slate-900 dark:text-white uppercase leading-tight">
                                    {cm?.person ? `${cm.person.first_name} ${cm.person.last_name}` : ''}
                                </div>
                                <div className="font-mono text-[10px] text-slate-500 font-bold">{cm?.person?.rut_display}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Passengers Table */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Listado de Pasajeros</h3>
                        <Badge variant="outline" className="text-[10px] font-bold">TOTAL: {passengers.length} PAX</Badge>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden">
                        <Table className="w-full">
                            <TableHeader>
                                <TableRow className="bg-slate-50 dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-200 dark:border-white/5">
                                    <TableHead className="w-12 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">#</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pasajero</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">RUT</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Empresa / Cargo</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Tramo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {passengers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-slate-400 text-sm font-medium italic">
                                            No hay pasajeros registrados para este zarpe.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    passengers.map((p: any, idx: number) => (
                                        <TableRow key={p.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                            <TableCell className="text-center font-bold text-[11px] text-slate-400 border-r border-slate-100 dark:border-white/5">{idx + 1}</TableCell>
                                            <TableCell className="font-black text-slate-900 dark:text-white uppercase text-xs">
                                                {p.passenger ? `${p.passenger.first_name} ${p.passenger.last_name}` : '---'}
                                            </TableCell>
                                            <TableCell className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                {p.passenger?.rut_display}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">{p.passenger?.company || '---'}</span>
                                                    <span className="text-[9px] font-bold text-blue-500/70 uppercase tracking-tight">{p.passenger?.job_title || '---'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800/50">
                                                    <span className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-tighter">
                                                        {p.origin_stop?.location?.name || 'SUBIDA'}
                                                    </span>
                                                    <ArrowRight className="w-2.5 h-2.5 text-blue-300 dark:text-blue-700" />
                                                    <span className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-tighter">
                                                        {p.destination_stop?.location?.name || 'BAJADA'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                {/* Footer Section */}
                <div className="mt-12 flex flex-col md:flex-row justify-between items-center gap-10 border-t border-slate-100 dark:border-white/5 pt-8 print:hidden">
                    <div className="flex flex-col items-center md:items-start text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-2 border-l-2 border-blue-500">
                        <p>Generado por Sistema Logístico Yadran</p>
                        <p>{new Date().toLocaleString("es-CL")} HRS</p>
                    </div>
                    <div className="w-64 pt-6 border-t border-slate-300 dark:border-white/20 text-center">
                        <div className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">
                            {captain?.person ? `${captain.person.first_name} ${captain.person.last_name}` : '____________________'}
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-tighter text-slate-400">Firma del Capitán</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
