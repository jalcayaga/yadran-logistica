const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// DMS to Decimal Conversion
function dmsToDecimal(dmsStr) {
    if (!dmsStr || typeof dmsStr !== 'string') return null;

    // Clean string: remove extra spaces
    const cleanStr = dmsStr.trim();

    // Regex to match Degrees, Minutes, Seconds and Direction
    // Format example: 43°08'28.14"S
    const regex = /(\d+)\s*°\s*(\d+)\s*'\s*([\d.]+)\s*"\s*([NSEW])/i;
    const match = cleanStr.match(regex);

    if (!match) {
        // Try a simpler version if the first one fails
        // Sometimes the symbols are different
        console.warn(`Could not parse DMS string: ${cleanStr}`);
        return null;
    }

    const degrees = parseFloat(match[1]);
    const minutes = parseFloat(match[2]);
    const seconds = parseFloat(match[3]);
    const direction = match[4].toUpperCase();

    let decimal = degrees + (minutes / 60) + (seconds / 3600);

    if (direction === 'S' || direction === 'W') {
        decimal = decimal * -1;
    }

    return decimal;
}

const PORTS = [
    { name: 'Puerto Aguirre', port_code: 'PAG', latitude: -45.16, longitude: -73.51 },
    { name: 'Puerto Chacabuco', port_code: 'PCH', latitude: -45.45, longitude: -72.82 },
    { name: 'Melinka', port_code: 'MEL', latitude: -43.89, longitude: -73.75 },
    { name: 'Quellón', port_code: 'QUE', latitude: -43.11, longitude: -73.61 },
    { name: 'Tenaún', port_code: 'TEN', latitude: -42.33, longitude: -73.35 },
    { name: 'Chaitén', port_code: 'CHA', latitude: -42.92, longitude: -72.71 }
];

const VESSEL_TYPES = [
    { name: 'Lancha Rápida (Small)', cruise_speed_knots: 20, max_wind_knots: 25, max_wave_meters: 1.5 },
    { name: 'Catamarán (Medium)', cruise_speed_knots: 25, max_wind_knots: 35, max_wave_meters: 2.5 },
    { name: 'Barcaza (Large)', cruise_speed_knots: 12, max_wind_knots: 45, max_wave_meters: 4.0 }
];

async function run() {
    console.log('🚀 Starting Maritime Data Ingestion...');

    // 1. Seed Ports
    console.log('📍 Seeding Ports...');
    for (const port of PORTS) {
        const { error } = await supabase.from('ports').upsert(port, { onConflict: 'port_code' });
        if (error) console.error(`Error seeding port ${port.port_code}:`, error.message);
    }

    // 2. Seed Vessel Types
    console.log('🚢 Seeding Vessel Types...');
    for (const type of VESSEL_TYPES) {
        const { error } = await supabase.from('vessel_types').upsert(type, { onConflict: 'name' });
        if (error) console.error(`Error seeding vessel type ${type.name}:`, error.message);
    }

    // 3. Parse Excel and Seed Centers
    console.log('📂 Parsing Excel for Centers...');
    const excelPath = path.resolve(__dirname, '../public/Trazabilidad Estructuras CY.xlsx');

    try {
        const workbook = XLSX.readFile(excelPath);
        // Use the most recent sheet or the one identified
        const sheetName = '10-01-26';
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
            throw new Error(`Sheet ${sheetName} not found in workbook`);
        }

        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Based on search_excel.js, headers are at row 1 (index 0 or 1 depending on sheet)
        // For 10-01-26, it seems row 1 had the headers
        const headerRow = rows[1];
        const latIdx = headerRow.indexOf('LATITUD');
        const lonIdx = headerRow.indexOf('LONGITUD');
        const centerIdx = headerRow.indexOf('CENTRO');
        const portIdx = headerRow.indexOf('JURIDICCION');

        console.log(`Mapping: Center=${centerIdx}, Lat=${latIdx}, Lon=${lonIdx}, Port=${portIdx}`);

        const centersToInsert = [];

        // Start from row after headers
        for (let i = 2; i < rows.length; i++) {
            const row = rows[i];
            const name = row[centerIdx];
            const latRaw = row[latIdx];
            const lonRaw = row[lonIdx];
            const portName = row[portIdx];

            if (!name || !latRaw || !lonRaw) continue;

            const lat = dmsToDecimal(latRaw);
            const lon = dmsToDecimal(lonRaw);

            if (lat !== null && lon !== null) {
                // Find which port this center belongs to (simple heuristic or manual mapping)
                // For now, let's try to map JURIDICCION to our port_codes
                let portCode = null;
                if (portName) {
                    const match = PORTS.find(p => portName.toUpperCase().includes(p.name.toUpperCase()) || p.name.toUpperCase().includes(portName.toUpperCase()));
                    if (match) portCode = match.port_code;
                }

                centersToInsert.push({
                    name: name.toString().trim(),
                    latitude: lat,
                    longitude: lon,
                    port_code: portCode
                });
            }
        }

        console.log(`✅ Found ${centersToInsert.length} centers to ingest.`);

        // Insert centers
        for (const center of centersToInsert) {
            const { error } = await supabase.from('centers').upsert(center, { onConflict: 'name' });
            if (error) {
                // If 'name' is not unique, we might need a composite key or just insert
                // Assuming 'name' is unique for this demo context or adding conflict handling
                const { error: insertError } = await supabase.from('centers').insert(center);
                if (insertError) console.error(`Error inserting center ${center.name}:`, insertError.message);
            }
        }

    } catch (error) {
        console.error('❌ Excel Error:', error.message);
    }

    console.log('🏁 Ingestion Finished.');
}

run();
