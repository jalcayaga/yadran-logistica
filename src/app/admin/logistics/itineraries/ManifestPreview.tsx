'use client';

import { useState, useEffect } from "react";
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, MessageSquare, Send, FileText } from 'lucide-react';
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
                        person:people(*), 
                        origin:itinerary_stops!bookings_origin_stop_id_fkey(*, location:locations(*)), 
                        destination:itinerary_stops!bookings_destination_stop_id_fkey(*, location:locations(*))
                    )
                `)
                .eq('id', itineraryId)
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
            const { pdf } = await import('@react-pdf/renderer');
            const blob = await pdf(
                <ManifestDocument
                    vesselName={data.vessel?.name || 'Nave Desconocida'}
                    vesselRegistration={data.vessel?.registration_number}
                    itineraryDate={formatDate(data.date)}
                    startTime={data.start_time}
                    passengers={data.bookings || []}
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

    // Filter confirmed bookings
    const passengers = data.bookings?.filter((b: any) => b.status === 'confirmed') || [];

    // Group crew by role
    const captain = data.crew?.find((c: any) => c.role === 'captain');
    const substitute = data.crew?.find((c: any) => c.role === 'substitute');
    const crewMembers = data.crew?.filter((c: any) => c.role === 'crew_member') || [];

    return (
        <div className="p-8 bg-white text-black print:p-0">
            <div className="flex justify-between items-start mb-8 print:hidden">
                <h2 className="text-2xl font-bold">Manifiesto de Pasajeros</h2>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleDownload} disabled={downloading}>
                        <FileText className="w-4 h-4 mr-2 text-blue-500" />
                        {downloading ? 'Generando...' : 'Descargar PDF'}
                    </Button>
                    <Button onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" /> Imprimir
                    </Button>
                </div>
            </div>

            {/* Header for Print */}
            <div className="text-center mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold uppercase tracking-wider">Manifiesto de Zarpe</h1>
                <p className="text-lg text-gray-600">Logística Yadran</p>
            </div>

            {/* Vessel & Itinerary Details */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <h3 className="font-bold text-gray-500 uppercase text-sm mb-1">Nave</h3>
                    <p className="text-xl font-semibold">{data.vessel?.name}</p>
                    <p className="text-sm text-gray-600">Capacidad: {data.vessel?.capacity} pax</p>
                </div>
                <div>
                    <h3 className="font-bold text-gray-500 uppercase text-sm mb-1">Fecha / Hora</h3>
                    <p className="text-xl font-semibold">{formatDate(data.date)} - {data.start_time}</p>
                </div>
            </div>

            {/* Crew Section */}
            <div className="mb-8 p-4 bg-gray-50 border rounded-md print:bg-white print:border-gray-300">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="font-bold text-lg">Tripulación</h3>
                    {captain?.person?.phone_e164 && (
                        <a
                            href={getCaptainManifestLink(captain.person.phone_e164, data, data.crew, passengers)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="print:hidden"
                        >
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                <Send className="w-4 h-4 mr-2" /> Enviar Manifiesto
                            </Button>
                        </a>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <span className="font-semibold block text-sm text-gray-500">Capitán</span>
                        <div className="text-lg">{captain?.person ? `${captain.person.first_name} ${captain.person.last_name}` : '---'}</div>
                        <div className="text-sm text-gray-600">{captain?.person?.rut_display}</div>
                    </div>
                    {substitute && (
                        <div>
                            <span className="font-semibold block text-sm text-gray-500">Sustituto (Patrón)</span>
                            <div className="text-lg">{substitute?.person ? `${substitute.person.first_name} ${substitute.person.last_name}` : ''}</div>
                            <div className="text-sm text-gray-600">{substitute?.person?.rut_display}</div>
                        </div>
                    )}
                    {crewMembers.map((cm: any, idx: number) => (
                        <div key={idx}>
                            <span className="font-semibold block text-sm text-gray-500">Tripulante</span>
                            <div className="text-lg">{cm?.person ? `${cm.person.first_name} ${cm.person.last_name}` : ''}</div>
                            <div className="text-sm text-gray-600">{cm?.person?.rut_display}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Passengers Table */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Pasajeros</h3>
                </div>
                <Table className="border collapse w-full">
                    <TableHeader>
                        <TableRow className="bg-gray-100 print:bg-gray-100">
                            <TableHead className="w-12 text-center border">#</TableHead>
                            <TableHead className="border">Nombre Completo</TableHead>
                            <TableHead className="border">RUT</TableHead>
                            <TableHead className="border">Origen</TableHead>
                            <TableHead className="border">Destino</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {passengers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-500 border">No hay pasajeros confirmados.</TableCell>
                            </TableRow>
                        ) : (
                            passengers.map((p: any, idx: number) => (
                                <TableRow key={p.id}>
                                    <TableCell className="text-center font-medium border text-gray-500">{idx + 1}</TableCell>
                                    <TableCell className="font-semibold border">{p.person ? `${p.person.first_name} ${p.person.last_name}` : ''}</TableCell>
                                    <TableCell className="border">{p.person?.rut_display}</TableCell>
                                    <TableCell className="border">{p.origin?.location?.name}</TableCell>
                                    <TableCell className="border">{p.destination?.location?.name}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Signature Section for Print */}
            <div className="hidden print:block mt-20 pt-8 border-t-2 border-black max-w-sm mx-auto text-center">
                <p className="font-bold mb-1">Firma Capitán</p>
                <p>{captain?.person ? `${captain.person.first_name} ${captain.person.last_name}` : ''}</p>
            </div>
        </div>
    );
}
