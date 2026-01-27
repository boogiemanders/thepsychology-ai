import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkUser(email: string) {
  const { data: user } = await supabase.from('users').select('id, created_at').eq('email', email).single();
  if (!user) {
    console.log(email + ': not found');
    return;
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Get page views on topic-teacher grouped by day
  const { data: views } = await supabase
    .from('user_page_views')
    .select('page_path, duration_seconds, entered_at')
    .eq('user_id', user.id)
    .eq('page_path', '/topic-teacher')
    .gte('entered_at', thirtyDaysAgo);

  // Group by day
  const byDay: Record<string, { views: number; seconds: number }> = {};
  (views || []).forEach(v => {
    const day = v.entered_at.substring(0, 10);
    if (!byDay[day]) byDay[day] = { views: 0, seconds: 0 };
    byDay[day].views++;
    byDay[day].seconds += v.duration_seconds || 0;
  });

  console.log('=== ' + email + ' ===');
  console.log('Account created:', user.created_at?.substring(0, 10));
  console.log('');
  console.log('Topic-teacher activity by day:');
  Object.entries(byDay)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 10)
    .forEach(([day, stats]) => {
      const avgSec = stats.seconds / stats.views;
      console.log('  ' + day + ': ' + stats.views + ' views, ' + Math.round(stats.seconds / 60) + 'm total, ' + avgSec.toFixed(1) + 's avg');
    });
  console.log('');
}

async function main() {
  await checkUser('chunjulie98@gmail.com');
  await checkUser('amy@maliya.ca');
  await checkUser('firewhisky_jen@hotmail.com');
}

main();
