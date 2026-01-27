import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkUser() {
  const email = 'nathaniel.davin@gmail.com';
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
  const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const { data: user } = await supabase
    .from('users')
    .select('id, email, last_activity_at, current_page')
    .eq('email', email)
    .single();

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('=== USER STATUS ===');
  console.log('Email:', user.email);
  console.log('Last activity:', user.last_activity_at);
  console.log('Current page:', user.current_page);

  const lastActivity = new Date(user.last_activity_at);
  const minsAgo = Math.round((now.getTime() - lastActivity.getTime()) / 1000 / 60);
  console.log('Minutes since last activity:', minsAgo);
  console.log('');

  const { data: hourViews } = await supabase
    .from('user_page_views')
    .select('page_path, duration_seconds, entered_at')
    .eq('user_id', user.id)
    .gte('entered_at', oneHourAgo)
    .order('entered_at', { ascending: false });

  const { data: tenMinViews } = await supabase
    .from('user_page_views')
    .select('duration_seconds')
    .eq('user_id', user.id)
    .gte('entered_at', tenMinsAgo);

  const { data: fiveMinViews } = await supabase
    .from('user_page_views')
    .select('duration_seconds')
    .eq('user_id', user.id)
    .gte('entered_at', fiveMinsAgo);

  const { data: sessions } = await supabase
    .from('study_sessions')
    .select('feature, duration_seconds, metadata, started_at')
    .eq('user_id', user.id)
    .gte('started_at', oneHourAgo)
    .order('started_at', { ascending: false });

  const sumSeconds = (arr: any[]) => arr?.reduce((s, v) => s + (v.duration_seconds || 0), 0) || 0;

  console.log('=== TIME ON SITE ===');
  console.log('Past hour:', Math.round(sumSeconds(hourViews || []) / 60), 'minutes');
  console.log('Past 10 mins:', Math.round(sumSeconds(tenMinViews || []) / 60), 'minutes');
  console.log('Past 5 mins:', Math.round(sumSeconds(fiveMinViews || []) / 60), 'minutes');
  console.log('');

  console.log('=== RECENT PAGE VIEWS (past hour) ===');
  (hourViews || []).slice(0, 10).forEach(v => {
    const mins = v.duration_seconds ? Math.round(v.duration_seconds / 60) : 0;
    const time = new Date(v.entered_at).toLocaleTimeString();
    console.log(`  ${time} - ${v.page_path} (${mins}m)`);
  });
  console.log('');

  console.log('=== STUDY SESSIONS (past hour) ===');
  (sessions || []).forEach(s => {
    const mins = s.duration_seconds ? Math.round(s.duration_seconds / 60) : 0;
    const time = new Date(s.started_at).toLocaleTimeString();
    const topic = (s.metadata as any)?.topic || 'N/A';
    console.log(`  ${time} - ${s.feature}: ${topic} (${mins}m)`);
  });

  // Get activity over past 24 hours
  const { data: dayViews } = await supabase
    .from('user_page_views')
    .select('page_path, duration_seconds, entered_at')
    .eq('user_id', user.id)
    .gte('entered_at', yesterday)
    .order('entered_at', { ascending: false });

  console.log('');
  console.log('=== ACTIVITY TIMELINE (past 24 hours) ===');
  (dayViews || []).slice(0, 25).forEach(v => {
    const mins = v.duration_seconds ? Math.round(v.duration_seconds / 60) : 0;
    const dt = new Date(v.entered_at).toLocaleString();
    console.log(`  ${dt} - ${v.page_path} (${mins}m)`);
  });
}

checkUser();
