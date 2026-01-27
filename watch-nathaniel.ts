import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const USER_ID = 'b4aa08a1-6d14-4928-bd23-799f246cdb4f';
let lastTTSession: string | null = null;
let lastRecoverSession: string | null = null;

async function check() {
  // Check latest Topic Teacher session
  const { data: ttSession } = await supabase
    .from('study_sessions')
    .select('id, started_at, duration_seconds, metadata')
    .eq('user_id', USER_ID)
    .eq('feature', 'topic-teacher')
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  // Check for Recover visits
  const { data: recoverSession } = await supabase
    .from('recover_chat_sessions')
    .select('id, created_at, message_count')
    .eq('user_id', USER_ID)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Check for Recover study session
  const { data: recoverStudy } = await supabase
    .from('study_sessions')
    .select('id, started_at, duration_seconds')
    .eq('user_id', USER_ID)
    .eq('feature', 'recover')
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  const now = new Date().toLocaleTimeString();

  // Report new Topic Teacher activity
  if (ttSession && ttSession.id !== lastTTSession) {
    const topic = ttSession.metadata?.topic || 'unknown';
    console.log(`[${now}] 📚 Topic Teacher: ${topic} (${ttSession.duration_seconds}s)`);
    lastTTSession = ttSession.id;
  }

  // Report Recover visit
  if (recoverSession && recoverSession.id !== lastRecoverSession) {
    console.log(`[${now}] ✅ RECOVER VISITED! Messages: ${recoverSession.message_count}`);
    lastRecoverSession = recoverSession.id;
  }

  if (recoverStudy) {
    console.log(`[${now}] ✅ Recover study session: ${recoverStudy.duration_seconds}s`);
  }
}

// Initial check
console.log('Watching nathaniel.davin@gmail.com for Recover activity...');
console.log('Will notify when they visit Recover or continue Topic Teacher.\n');

check();
setInterval(check, 30000); // Check every 30 seconds
