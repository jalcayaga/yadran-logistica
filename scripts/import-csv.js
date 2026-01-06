#!/usr/bin/env node

/**
 * CSV Import Script for Logística Yadran
 * 
 * This script reads CSV files from data/raw/ and populates the catalog tables:
 * - people
 * - locations
 * - operators
 * - vessels
 * 
 * Usage: node scripts/import-csv.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Debug - Environment variables:');
console.log('   SUPABASE_URL:', SUPABASE_URL ? `${SUPABASE_URL.substring(0, 30)}...` : 'MISSING');
console.log('   SERVICE_KEY:', SUPABASE_SERVICE_KEY ? `${SUPABASE_SERVICE_KEY.substring(0, 20)}...` : 'MISSING');
console.log('');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing environment variables!');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Utility: Parse CSV (handles quoted fields and multi-line headers)
function parseCSV(content) {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 3) return [];

    // Skip first 2 lines (metadata), line 3 is the real header
    const headerLine = lines[2];
    const headers = headerLine.split(',').map(h => h.trim());
    const rows = [];

    for (let i = 3; i < lines.length; i++) {
        const line = lines[i];
        // Simple CSV split (handles basic quoted fields)
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());

        if (values.length < headers.length) continue; // Skip malformed rows

        const row = {};
        headers.forEach((header, idx) => {
            row[header] = values[idx] || '';
        });
        rows.push(row);
    }

    return rows;
}

// Utility: Normalize RUT (remove dots, keep hyphen)
function normalizeRUT(rut) {
    if (!rut) return null;
    return rut.replace(/\./g, '').trim();
}

// Utility: Split full name into first_name and last_name
// Chilean format: APELLIDO_PATERNO APELLIDO_MATERNO NOMBRE1 NOMBRE2
function splitName(fullName) {
    if (!fullName) return { first_name: '', last_name: '' };

    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
        return { first_name: parts[0], last_name: '' };
    }

    if (parts.length === 2) {
        // Assume: APELLIDO NOMBRE
        return { first_name: parts[1], last_name: parts[0] };
    }

    // For 3+ words, assume first 2 are last names (Apellido Paterno + Materno)
    // and the rest are first names
    const last_name = parts.slice(0, 2).join(' ');
    const first_name = parts.slice(2).join(' ');

    return { first_name, last_name };
}

// Utility: Format RUT for display (12.345.678-9)
function formatRUT(rut) {
    if (!rut) return '';
    const normalized = normalizeRUT(rut);
    const match = normalized.match(/^(\d{1,2})(\d{3})(\d{3})([\dkK])$/);
    if (!match) return normalized;
    return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
}

// Main import function
async function importCatalogs() {
    console.log('🚀 Starting CSV import...\n');

    // Read manifiestos.csv (more complete)
    const csvPath = path.join(__dirname, '../data/raw/manifiestos.csv');
    const content = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(content);

    console.log(`📄 Loaded ${rows.length} rows from manifiestos.csv\n`);

    // Extract unique values
    const peopleMap = new Map();
    const locationsSet = new Set();
    const operatorsSet = new Set();
    const vesselsSet = new Set();

    rows.forEach(row => {
        // People
        const rut = normalizeRUT(row.RUT);
        if (rut && row.NOMBRE) {
            const { first_name, last_name } = splitName(row.NOMBRE);

            // Parse phone number (remove non-digits, add +56 if needed)
            let phone_e164 = null;
            if (row.CELULAR) {
                const digits = row.CELULAR.replace(/\D/g, '');
                if (digits.length === 9) {
                    phone_e164 = `+56${digits}`;
                } else if (digits.length === 11 && digits.startsWith('56')) {
                    phone_e164 = `+${digits}`;
                }
            }

            peopleMap.set(rut, {
                rut_normalized: rut,
                rut_display: formatRUT(rut),
                first_name,
                last_name,
                company: row.EMPRESA || 'N/A',
                job_title: row.CARGO || null,
                phone_e164,
                active: true
            });
        }

        // Locations (CENTRO column)
        if (row.CENTRO) {
            locationsSet.add(row.CENTRO.trim());
        }

        // Operators (AVIÓN column often contains operator name)
        if (row.AVIÓN && row.AVIÓN !== 'NO APLICA' && row.AVIÓN !== 'MK') {
            operatorsSet.add(row.AVIÓN.trim());
        }

        // Vessels (EMBARCACIÓN column)
        if (row.EMBARCACIÓN && row.EMBARCACIÓN !== 'NO APLICA') {
            vesselsSet.add(row.EMBARCACIÓN.trim());
        }
    });

    console.log(`📊 Extracted:`);
    console.log(`   - ${peopleMap.size} unique people`);
    console.log(`   - ${locationsSet.size} unique locations`);
    console.log(`   - ${operatorsSet.size} unique operators`);
    console.log(`   - ${vesselsSet.size} unique vessels\n`);

    // Insert Locations (check existing first since no unique constraint)
    console.log('📍 Inserting locations...');
    const locations = Array.from(locationsSet).map(name => {
        // Generate code from name (uppercase, remove spaces/special chars, max 10 chars)
        const code = name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10);
        return { name, code };
    });

    for (const loc of locations) {
        const { data: existing } = await supabase
            .from('locations')
            .select('id')
            .eq('name', loc.name)
            .single();

        if (!existing) {
            const { error } = await supabase.from('locations').insert(loc);
            if (error) console.error(`  ❌ Error inserting ${loc.name}:`, error.message);
        }
    }
    console.log(`✅ Locations inserted\n`);

    // Insert Operators
    console.log('🚢 Inserting operators...');
    const operators = Array.from(operatorsSet).map(name => ({ name }));
    const { data: opData, error: opError } = await supabase
        .from('operators')
        .upsert(operators, { onConflict: 'name', ignoreDuplicates: true });

    if (opError) console.error('❌ Operators error:', opError);
    else console.log(`✅ Operators inserted\n`);

    // Insert Vessels
    console.log('⛴️ Inserting vessels...');
    const vessels = Array.from(vesselsSet).map(name => ({ name }));
    const { data: vesData, error: vesError } = await supabase
        .from('vessels')
        .upsert(vessels, { onConflict: 'name', ignoreDuplicates: true });

    if (vesError) console.error('❌ Vessels error:', vesError);
    else console.log(`✅ Vessels inserted\n`);

    // Insert People (in batches to avoid timeout)
    console.log('👥 Inserting people...');
    const people = Array.from(peopleMap.values());
    const batchSize = 100;

    for (let i = 0; i < people.length; i += batchSize) {
        const batch = people.slice(i, i + batchSize);
        const { error: peopleError } = await supabase
            .from('people')
            .upsert(batch, { onConflict: 'rut_normalized', ignoreDuplicates: false });

        if (peopleError) {
            console.error(`❌ People batch ${i / batchSize + 1} error:`, peopleError);
        } else {
            console.log(`   ✓ Batch ${i / batchSize + 1}/${Math.ceil(people.length / batchSize)}`);
        }
    }

    console.log(`✅ People inserted\n`);
    console.log('🎉 Import complete!');
}

// Run
importCatalogs().catch(console.error);
