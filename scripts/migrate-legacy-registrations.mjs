import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  process.stderr.write('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / VITE_SUPABASE_ANON_KEY\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  const { data: legacyRegs, error: fetchErr } = await supabase
    .from('registrations_legacy')
    .select('*');

  if (fetchErr) {
    process.stderr.write(`Error fetching legacy registrations: ${fetchErr.message}\n`);
    return;
  }

  if (!legacyRegs || legacyRegs.length === 0) {
    process.stdout.write('No legacy registrations to migrate.\n');
    return;
  }

  const unmatched = [];
  let migratedCount = 0;

  for (const reg of legacyRegs) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .ilike('usn', reg.university_reg_no)
      .maybeSingle();

    if (!profile) {
      unmatched.push({
        registration_id: reg.id,
        email: reg.email,
        name: reg.full_name,
        usn: reg.university_reg_no,
        event_id: reg.event_id,
        reason: 'No matching student profile found for USN'
      });
      continue;
    }

    const { error: insertErr } = await supabase
      .from('registrations')
      .insert({
        event_id: reg.event_id,
        student_id: profile.id,
        confirmation_id: reg.confirmation_id,
        status: 'registered',
        checked_in_at: reg.checked_in ? (reg.checked_in_at || new Date().toISOString()) : null,
        created_at: reg.created_at
      });

    if (insertErr) {
      unmatched.push({
        registration_id: reg.id,
        email: reg.email,
        name: reg.full_name,
        usn: reg.university_reg_no,
        event_id: reg.event_id,
        reason: insertErr.message
      });
    } else {
      migratedCount++;
    }
  }

  process.stdout.write(`Migration complete. Successfully migrated: ${migratedCount}. Unmatched/failed: ${unmatched.length}.\n`);
  if (unmatched.length > 0) {
    process.stdout.write('Unmatched records summary:\n' + JSON.stringify(unmatched, null, 2) + '\n');
  }
}

migrate().catch((err) => {
  process.stderr.write(`Migration failed: ${err.message}\n`);
  process.exit(1);
});
