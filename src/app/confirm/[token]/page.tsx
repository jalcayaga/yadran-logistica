'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function CrewConfirmationPage() {
    const { token } = useParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Procesando tu confirmación...');
    const [role, setRole] = useState<string>('');
    const [trackingToken, setTrackingToken] = useState<string | null>(null);

    useEffect(() => {
        async function confirm() {
            try {
                const res = await fetch(`/api/public/confirm/${token}`, {
                    method: 'POST'
                });

                if (res.ok) {
                    const data = await res.json();
                    setStatus('success');
                    setMessage('¡Viaje confirmado con éxito!');
                    if (data.role) setRole(data.role);
                    if (data.tracking_token) setTrackingToken(data.tracking_token);
                } else {
                    const data = await res.json();
                    setStatus('error');
                    setMessage(data.error || 'No se pudo confirmar el viaje.');
                }
            } catch (err) {
                setStatus('error');
                setMessage('Error de conexión al servidor.');
            }
        }
        if (token) confirm();
    }, [token]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100 animate-in fade-in zoom-in duration-500">
                <div className="mb-6">
                    {status === 'loading' && (
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    )}
                    {status === 'success' && (
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner">
                            ✓
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner">
                            ✕
                        </div>
                    )}
                </div>

                <h1 className="text-2xl font-bold text-slate-800 mb-2">
                    {status === 'success' ? '¡Confirmado!' :
                        status === 'error' ? 'Oops...' : 'Confirmando...'}
                </h1>

                <p className={`text-lg ${status === 'error' ? 'text-rose-500' : 'text-slate-600'}`}>
                    {message}
                </p>

                {status === 'success' && (
                    <div className="mt-8 pt-8 border-t border-slate-50">
                        {role === 'captain' || role === 'substitute' ? (
                            <div className="space-y-4">
                                <p className="text-sm text-slate-600 font-medium">
                                    Puedes acceder a tu Panel de Control para ver el Manifiesto y las confirmaciones.
                                </p>
                                <button
                                    onClick={() => window.location.href = `/m/${token}`}
                                    className="w-full px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                                >
                                    Abrir Panel del Capitán
                                </button>
                            </div>
                        ) : trackingToken ? (
                            <div className="space-y-4">
                                <p className="text-sm text-slate-600 font-medium">
                                    Puedes ver el estado en tiempo real de tu viaje en el Panel de Monitoreo.
                                </p>
                                <button
                                    onClick={() => window.location.href = `/i/${trackingToken}`}
                                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                                >
                                    Ver Estado del Viaje
                                </button>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-slate-400 italic">
                                    Gracias por confirmar. El equipo de Logística Yadran ha sido notificado.
                                </p>
                                <div className="mt-6 text-2xl">⚓🚢✨</div>
                            </>
                        )}
                    </div>
                )}

                {status === 'error' && (
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-8 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                    >
                        Reintentar
                    </button>
                )}
            </div>
        </div>
    );
}
