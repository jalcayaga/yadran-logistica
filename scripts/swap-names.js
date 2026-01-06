#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function swapNames() {
    console.log('🔄 Swapping first_name and last_name for all people...\n');

    // Get all people
    const { data: people, error: fetchError } = await supabase
        .from('people')
        .select('id, first_name, last_name');

    if (fetchError) {
        console.error('❌ Error fetching people:', fetchError);
        return;
    }

    console.log(`Found ${people.length} people to update\n`);

    // Update each person (swap names)
    let updated = 0;
    for (const person of people) {
        const { error: updateError } = await supabase
            .from('people')
            .update({
                first_name: person.last_name,
                last_name: person.first_name
            })
            .eq('id', person.id);

        if (updateError) {
            console.error(`❌ Error updating ${person.id}:`, updateError.message);
        } else {
            updated++;
            if (updated % 50 === 0) {
                console.log(`   ✓ Updated ${updated}/${people.length}`);
            }
        }
    }

    console.log(`\n✅ Successfully swapped names for ${updated} people!`);

    // Verify with sample
    const { data: sample } = await supabase
        .from('people')
        .select('first_name, last_name, job_title')
        .ilike('first_name', '%IBARRA CARES%')
        .limit(1);

    if (sample && sample.length > 0) {
        console.log('\n📋 Sample after swap:');
        console.log(JSON.stringify(sample[0], null, 2));
    }
}

swapNames().catch(console.error);
