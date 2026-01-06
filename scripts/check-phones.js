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

async function checkPhones() {
    const { data, error } = await supabase
        .from('people')
        .select('first_name, last_name, phone_e164')
        .not('phone_e164', 'is', null)
        .limit(10);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`\n📞 Sample of ${data.length} people with phones:\n`);
        data.forEach(p => {
            console.log(`   ${p.first_name} ${p.last_name}: ${p.phone_e164}`);
        });
    }

    const { count } = await supabase
        .from('people')
        .select('*', { count: 'exact', head: true })
        .not('phone_e164', 'is', null);

    console.log(`\n✅ Total people with phone numbers: ${count}/346`);
}

checkPhones().catch(console.error);
