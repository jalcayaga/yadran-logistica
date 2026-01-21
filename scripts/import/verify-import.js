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

async function verify() {
    console.log('🔍 Verifying imported data...\n');

    // Check IBARRA CARES
    const { data: ibarra, error } = await supabase
        .from('people')
        .select('*')
        .ilike('last_name', '%IBARRA CARES%')
        .limit(1);

    if (error) {
        console.error('❌ Error:', error);
    } else if (ibarra && ibarra.length > 0) {
        console.log('✅ Sample person (IBARRA CARES):');
        console.log(JSON.stringify(ibarra[0], null, 2));
    } else {
        console.log('⚠️  No person found with last name IBARRA CARES');
    }

    // Count totals
    const { count: peopleCount } = await supabase
        .from('people')
        .select('*', { count: 'exact', head: true });

    const { count: locCount } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true });

    const { count: opCount } = await supabase
        .from('operators')
        .select('*', { count: 'exact', head: true });

    const { count: vesCount } = await supabase
        .from('vessels')
        .select('*', { count: 'exact', head: true });

    console.log('\n📊 Total counts:');
    console.log(`   People: ${peopleCount}`);
    console.log(`   Locations: ${locCount}`);
    console.log(`   Operators: ${opCount}`);
    console.log(`   Vessels: ${vesCount}`);
}

verify().catch(console.error);
