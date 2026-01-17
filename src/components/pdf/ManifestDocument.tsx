import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontSize: 10,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottom: 1,
        paddingBottom: 10,
        alignItems: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 12,
        marginBottom: 5,
    },
    infoSection: {
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoCol: {
        width: '45%',
    },
    label: {
        fontWeight: 'bold',
        fontSize: 9,
        color: '#666',
    },
    value: {
        fontSize: 11,
        marginBottom: 4,
    },
    table: {
        width: '100%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#000',
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row',
    },
    tableHeader: {
        backgroundColor: '#f0f0f0',
        fontWeight: 'bold',
    },
    tableCol: {
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderColor: '#000',
        padding: 5,
    },
    colNum: { width: '10%' },
    colName: { width: '60%' },
    colRut: { width: '30%' },
    colNat: { width: '5%' }, // Nacionalidad

    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 8,
        color: '#999',
        borderTop: 1,
        paddingTop: 10,
    },
});

interface ManifestProps {
    vesselName: string;
    itineraryDate: string;
    startTime: string;
    passengers: any[];
    crew: any[];
}

export const ManifestDocument = ({ vesselName, itineraryDate, startTime, passengers, crew = [] }: ManifestProps) => {
    // Group crew by role
    const captain = crew.find((c: any) => c.role === 'captain');
    const substitute = crew.find((c: any) => c.role === 'substitute');
    const crewMembers = crew.filter((c: any) => c.role === 'crew_member') || [];

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>Manifiesto de Zarpe</Text>
                    <Text style={styles.subtitle}>Logística Yadran</Text>
                </View>

                <View style={styles.infoSection}>
                    <View style={styles.infoCol}>
                        <Text style={styles.label}>Nave:</Text>
                        <Text style={styles.value}>{vesselName}</Text>
                        <Text style={styles.label}>Capitán:</Text>
                        <Text style={styles.value}>{captain?.person ? `${captain.person.first_name} ${captain.person.last_name}` : '_______________________'}</Text>
                    </View>
                    <View style={styles.infoCol}>
                        <Text style={styles.label}>Fecha Zarpe:</Text>
                        <Text style={styles.value}>{itineraryDate}</Text>
                        <Text style={styles.label}>Hora Programada:</Text>
                        <Text style={styles.value}>{startTime}</Text>
                    </View>
                </View>

                {/* Crew Section - Added */}
                <View style={{ marginBottom: 20, padding: 10, backgroundColor: '#f9f9f9' }}>
                    <Text style={[styles.label, { marginBottom: 5 }]}>Tripulación Asignada:</Text>
                    {captain && (
                        <Text style={{ fontSize: 10, marginBottom: 2 }}>• Capitán: {captain.person?.first_name} {captain.person?.last_name} ({captain.person?.rut_display})</Text>
                    )}
                    {substitute && (
                        <Text style={{ fontSize: 10, marginBottom: 2 }}>• Patrón: {substitute.person?.first_name} {substitute.person?.last_name} ({substitute.person?.rut_display})</Text>
                    )}
                    {crewMembers.map((cm: any, idx: number) => (
                        <Text key={idx} style={{ fontSize: 10, marginBottom: 2 }}>• Tripulante: {cm.person?.first_name} {cm.person?.last_name} ({cm.person?.rut_display})</Text>
                    ))}
                    {crew.length === 0 && (
                        <Text style={{ fontSize: 10, color: '#999' }}>Ninguna tripulación asignada</Text>
                    )}
                </View>

                <View style={styles.table}>
                    {/* Header */}
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={[styles.tableCol, styles.colNum]}><Text>N°</Text></View>
                        <View style={[styles.tableCol, styles.colName]}><Text>Nombre Completo</Text></View>
                        <View style={[styles.tableCol, styles.colRut]}><Text>RUT / ID</Text></View>
                    </View>

                    {/* Rows */}
                    {passengers.length === 0 ? (
                        <View style={styles.tableRow}>
                            <View style={[styles.tableCol, { width: '100%' }]}><Text>Sin pasajeros registrados</Text></View>
                        </View>
                    ) : (
                        passengers.map((p, index) => (
                            <View style={styles.tableRow} key={index}>
                                <View style={[styles.tableCol, styles.colNum]}><Text>{index + 1}</Text></View>
                                <View style={[styles.tableCol, styles.colName]}><Text>{p.passenger?.first_name} {p.passenger?.last_name}</Text></View>
                                <View style={[styles.tableCol, styles.colRut]}><Text>{p.passenger?.rut_display || 'S/I'}</Text></View>
                            </View>
                        ))
                    )}
                </View>


                <View style={styles.footer}>
                    <Text>Generado automáticamente por Sistema Logístico Yadran - {new Date().toLocaleString("es-CL")}</Text>
                </View>
            </Page>
        </Document>
    );
};
