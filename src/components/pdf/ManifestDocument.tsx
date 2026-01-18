import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Disable hyphenation globally to avoid "JUAN EN-RIQUE" issues
Font.registerHyphenationCallback(word => [word]);

// Create styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 35,
        fontSize: 9,
        fontFamily: 'Helvetica',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: 2.5,
        borderColor: '#000',
        paddingBottom: 8,
        marginBottom: 12,
    },
    headerLogo: {
        flexDirection: 'column',
        gap: 1,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    operatorLine: {
        fontSize: 8,
        fontWeight: 'bold',
        marginBottom: 8,
        paddingBottom: 4,
        borderBottom: 1,
        borderColor: '#e0e0e0',
    },
    boxGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 18,
        borderWidth: 1.5,
        borderColor: '#000',
    },
    box: {
        padding: 6,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#000',
    },
    boxLabel: {
        fontSize: 6.5,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 3,
        color: '#333',
    },
    boxValue: {
        fontSize: 9,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        textAlign: 'center',
        paddingTop: 2,
    },
    table: {
        width: '100%',
        borderWidth: 1.5,
        borderColor: '#000',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#000',
        minHeight: 24,
        alignItems: 'center',
    },
    tableHeader: {
        backgroundColor: '#f5f5f5',
        minHeight: 28,
    },
    tableCol: {
        borderRightWidth: 1,
        borderColor: '#000',
        padding: 4,
        justifyContent: 'center',
    },
    tableHeaderText: {
        fontSize: 7.5,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    colNum: { width: '3%', textAlign: 'center' },
    colName: { width: '24%' },
    colRut: { width: '11%' },
    colCompany: { width: '20%' },
    colCargo: { width: '13%' },
    colOrg: { width: '14%' },
    colDst: { width: '15%', borderRightWidth: 0 },

    footer: {
        marginTop: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 20,
    },
    signatureSection: {
        width: '45%',
        flexDirection: 'column',
        alignItems: 'center',
    },
    captainName: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 35,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    signatureBox: {
        width: '100%',
        borderTopWidth: 1.5,
        borderColor: '#000',
        textAlign: 'center',
        paddingTop: 6,
        fontSize: 8,
        fontWeight: 'bold',
    },
    stampBox: {
        width: '50%',
        borderWidth: 1.5,
        borderColor: '#000',
        padding: 8,
        minHeight: 85,
        flexDirection: 'column',
        justifyContent: 'center',
    },
});

interface ManifestProps {
    vesselName: string;
    vesselRegistration?: string;
    vesselClass?: string;
    callSign?: string;
    operatorName?: string;
    registrationPort?: string;
    originPort?: string;
    destinationPort?: string;
    itineraryDate: string;
    startTime: string;
    passengers: any[];
    crew: any[];
}

export const ManifestDocument = ({
    vesselName,
    vesselRegistration,
    vesselClass = 'L/M',
    callSign = '---',
    operatorName = 'YADRAN QUELLÓN',
    registrationPort = '',
    originPort = '---',
    destinationPort = '---',
    itineraryDate,
    startTime,
    passengers,
    crew = []
}: ManifestProps) => {
    // Group crew by role
    const captain = crew.find((c: any) => c.role === 'captain');
    const substitute = crew.find((c: any) => c.role === 'substitute');
    const crewMembers = crew.filter((c: any) => c.role === 'crew_member') || [];

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View style={styles.headerLogo}>
                        <Text style={{ fontSize: 8, color: '#333' }}>Armada de Chile</Text>
                        <Text style={{ fontSize: 10, fontWeight: 'bold' }}>DIRECTEMAR</Text>
                    </View>
                    <Text style={styles.headerTitle}>Lista de Pasajeros</Text>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 }}>SALIDAS</Text>
                </View>

                <Text style={styles.operatorLine}>ARMADOR / OPERADOR: {(operatorName || 'YADRAN QUELLÓN').toUpperCase()}</Text>

                <View style={styles.boxGrid}>
                    <View style={[styles.box, { width: '65%' }]}>
                        <Text style={styles.boxLabel}>Clase, nombre de la embarcación, distintivo de llamada</Text>
                        <Text style={styles.boxValue}>{(vesselClass || 'L/M').toUpperCase()} {(vesselName || 'NAVE').toUpperCase()} {(callSign || '---').toUpperCase()}</Text>
                    </View>
                    <View style={[styles.box, { width: '15%', borderRightWidth: 1 }]}>
                        <Text style={styles.boxLabel}>Puerto salida</Text>
                        <Text style={styles.boxValue}>{(originPort || '---').toUpperCase()}</Text>
                    </View>
                    <View style={[styles.box, { width: '20%', borderRightWidth: 0 }]}>
                        <Text style={styles.boxLabel}>Fecha salida</Text>
                        <Text style={styles.boxValue}>{itineraryDate || '---'}</Text>
                    </View>

                    <View style={[styles.box, { width: '65%', borderBottomWidth: 0 }]}>
                        <Text style={styles.boxLabel}>Nacionalidad de la embarcación / número de matrícula</Text>
                        <Text style={styles.boxValue}>CHILENA / {(registrationPort || '').toUpperCase()} {(vesselRegistration || '---').toUpperCase()}</Text>
                    </View>
                    <View style={[styles.box, { width: '35%', borderBottomWidth: 0, borderRightWidth: 0 }]}>
                        <Text style={styles.boxLabel}>Puerto de destino</Text>
                        <Text style={styles.boxValue}>{(destinationPort || '---').toUpperCase()}</Text>
                    </View>
                </View>

                <View style={styles.table}>
                    {/* Header */}
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={[styles.tableCol, styles.colNum]}><Text style={styles.tableHeaderText}>N°</Text></View>
                        <View style={[styles.tableCol, styles.colName]}><Text style={styles.tableHeaderText}>Nombre</Text></View>
                        <View style={[styles.tableCol, styles.colRut]}><Text style={styles.tableHeaderText}>RUT</Text></View>
                        <View style={[styles.tableCol, styles.colCompany]}><Text style={styles.tableHeaderText}>Empresa</Text></View>
                        <View style={[styles.tableCol, styles.colCargo]}><Text style={styles.tableHeaderText}>Cargo</Text></View>
                        <View style={[styles.tableCol, styles.colOrg]}><Text style={styles.tableHeaderText}>Origen</Text></View>
                        <View style={[styles.tableCol, styles.colDst]}><Text style={styles.tableHeaderText}>Destino</Text></View>
                    </View>

                    {/* Rows */}
                    {passengers.length === 0 ? (
                        <View style={styles.tableRow}>
                            <View style={[styles.tableCol, { width: '100%' }]}><Text>Sin pasajeros registrados</Text></View>
                        </View>
                    ) : (
                        passengers.map((p, index) => (
                            <View style={styles.tableRow} key={index}>
                                <View style={[styles.tableCol, styles.colNum]}><Text style={{ fontSize: 8 }}>{index + 1}</Text></View>
                                <View style={[styles.tableCol, styles.colName]}><Text style={{ fontSize: 8, fontWeight: 'bold' }}>{((p.passenger?.first_name || p.person?.first_name || '') + ' ' + (p.passenger?.last_name || p.person?.last_name || '')).trim().toUpperCase() || 'PASAJERO'}</Text></View>
                                <View style={[styles.tableCol, styles.colRut]}><Text style={{ fontSize: 7.5 }}>{p.passenger?.rut_display || p.person?.rut_display || '---'}</Text></View>
                                <View style={[styles.tableCol, styles.colCompany]}><Text style={{ fontSize: 7.5 }}>{(p.passenger?.company || p.person?.company || '---').toUpperCase()}</Text></View>
                                <View style={[styles.tableCol, styles.colCargo]}><Text style={{ fontSize: 7.5 }}>{(p.passenger?.job_title || p.person?.job_title || '---').toUpperCase()}</Text></View>
                                <View style={[styles.tableCol, styles.colOrg]}><Text style={{ fontSize: 7.5 }}>
                                    {(p.origin_stop?.location?.name || p.origin?.location?.name || '---').toUpperCase()}
                                </Text></View>
                                <View style={[styles.tableCol, styles.colDst]}><Text style={{ fontSize: 7.5 }}>
                                    {(p.destination_stop?.location?.name || p.destination?.location?.name || '---').toUpperCase()}
                                </Text></View>
                            </View>
                        ))
                    )}
                </View>


                <View style={styles.footer}>
                    <View style={styles.signatureSection}>
                        <Text style={styles.captainName}>{captain?.person ? `${captain.person.first_name} ${captain.person.last_name}`.toUpperCase() : ''}</Text>
                        <Text style={styles.signatureBox}>Firma del Capitán / Patrón</Text>
                    </View>

                    <View style={styles.stampBox}>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#cc0000', textAlign: 'center', marginBottom: 6, letterSpacing: 0.5 }}>FIRMA ELECTRÓNICA</Text>
                        <Text style={{ fontSize: 7.5, textAlign: 'center', color: '#333' }}>Validado por Sistema Logístico Yadran</Text>
                        <Text style={{ fontSize: 7, textAlign: 'center', marginTop: 12, fontFamily: 'Courier' }}>Control ID: {new Date().getTime().toString(36).toUpperCase()}</Text>
                        <Text style={{ fontSize: 7, textAlign: 'center', marginTop: 2, color: '#666' }}>{new Date().toLocaleString("es-CL")}</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};
