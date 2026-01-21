#!/usr/bin/env node

/**
 * Update phone numbers from aerocord.csv
 * 
 * This script reads aerocord.csv and updates phone numbers for existing people
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing environment variables!');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Parse simple CSV
function parseCSV(content) {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = {};
        headers.forEach((header, idx) => {
            row[header] = values[idx]?.trim() || '';
        });
        if (row.RUT) rows.push(row);
    }

    return rows;
}

// Normalize RUT
function normalizeRUT(rut) {
    if (!rut) return null;
    return rut.replace(/\./g, '').trim();
}

async function updatePhones() {
    console.log('📞 Updating phone numbers from aerocord.csv...\n');

    const csvPath = path.join(__dirname, '../data/raw/aerocord.csv');
    const content = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(content);

    console.log(`📄 Loaded ${rows.length} rows from aerocord.csv\n`);

    let updated = 0;
    let notFound = 0;

    for (const row of rows) {
        const rut = normalizeRUT(row.RUT);
        const phone = row.CELULAR;

        if (!rut || !phone) continue;

        // Parse phone number
        const digits = phone.replace(/\D/g, '');
        let phone_e164 = null;

        if (digits.length === 9) {
            phone_e164 = `+56${digits}`;
        } else if (digits.length === 11 && digits.startsWith('56')) {
            phone_e164 = `+${digits}`;
        }

        if (!phone_e164) continue;

        // Update person by RUT
        const { data, error } = await supabase
            .from('people')
            .update({ phone_e164 })
            .eq('rut_normalized', rut)
            .select();

        if (error) {
            console.error(`❌ Error updating ${rut}:`, error.message);
        } else if (data && data.length > 0) {
            updated++;
            console.log(`✓ Updated ${row.NOMBRE} (${rut}): ${phone_e164}`);
        } else {
            notFound++;
        }
    }

    console.log(`\n✅ Updated ${updated} phone numbers`);
    console.log(`⚠️  ${notFound} people not found in database`);
}

updatePhones().catch(console.error);
