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
    colNum: { width: '5%' },
    colName: { width: '35%' },
    colRut: { width: '15%' },
    colOrg: { width: '20%' },
    colDst: { width: '20%' },
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
    passengers: any[]; // Using any for simplicity in template, ideally typed
}

export const ManifestDocument = ({ vesselName, itineraryDate, startTime, passengers }: ManifestProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>Listado de Pasajeros y Tripulantes</Text>
                <Text style={styles.subtitle}>Logística Yadran</Text>
            </View>

            <View style={styles.infoSection}>
                <View style={styles.infoCol}>
                    <Text style={styles.label}>Nave:</Text>
                    <Text style={styles.value}>{vesselName}</Text>
                    <Text style={styles.label}>Capitán:</Text>
                    <Text style={styles.value}>_______________________</Text>
                </View>
                <View style={styles.infoCol}>
                    <Text style={styles.label}>Fecha Zarpe:</Text>
                    <Text style={styles.value}>{itineraryDate}</Text>
                    <Text style={styles.label}>Hora Programada:</Text>
                    <Text style={styles.value}>{startTime}</Text>
                </View>
            </View>

            <View style={styles.table}>
                {/* Header */}
                <View style={[styles.tableRow, styles.tableHeader]}>
                    <View style={[styles.tableCol, styles.colNum]}><Text>N°</Text></View>
                    <View style={[styles.tableCol, styles.colName]}><Text>Nombre Completo</Text></View>
                    <View style={[styles.tableCol, styles.colRut]}><Text>RUT / ID</Text></View>
                    <View style={[styles.tableCol, styles.colOrg]}><Text>Origen</Text></View>
                    <View style={[styles.tableCol, styles.colDst]}><Text>Destino</Text></View>
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
                            <View style={[styles.tableCol, styles.colOrg]}><Text>{p.origin_stop?.location?.name}</Text></View>
                            <View style={[styles.tableCol, styles.colDst]}><Text>{p.destination_stop?.location?.name}</Text></View>
                        </View>
                    ))
                )}
            </View>

            <Text style={{ marginTop: 20, fontSize: 10 }}>Total Pasajeros: {passengers.length}</Text>

            <View style={styles.footer}>
                <Text>Generado automáticamente por Sistema Logístico Yadran - {new Date().toLocaleString("es-CL")}</Text>
            </View>
        </Page>
    </Document>
);
