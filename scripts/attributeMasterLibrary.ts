import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const source = createClient(
  'https://ryxspxybjmowoyodjqdk.supabase.co',
  'sb_publishable_gFVpeCi6nz0G57zBxvGohw_SQ_QoMvE'
);

const target = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xraapsysarhfgcqckvhs.supabase.co',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYWFwc3lzYXJoZmdjcWNrdmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMTc5OTIsImV4cCI6MjEwMzU5Mzk5Mn0.TM3IOx9xgpnGCD3Wra2yUMpxLISJ_83QStoDi8DXbFE'
);

const MASTER_EMAIL = 'master@360bct.com';

function songKey(title?: string, artist?: string) {
  return `${(title || '').trim().toLocaleLowerCase('tr-TR')}___${(artist || '').trim().toLocaleLowerCase('tr-TR')}`;
}

async function fetchAll(client: SupabaseClient) {
  const pageSize = 500;
  const rows: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await client
      .from('morfeus_songs')
      .select('id, title, artist, content, created_at')
      .range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

function pickKeeper(list: any[]) {
  return [...list].sort((a, b) => {
    const len = String(b.content || '').length - String(a.content || '').length;
    if (len !== 0) return len;
    return String(a.created_at || '').localeCompare(String(b.created_at || ''));
  })[0];
}

async function deleteDuplicateCopies(client: SupabaseClient, label: string) {
  const songs = await fetchAll(client);
  const groups = new Map<string, any[]>();
  for (const song of songs) {
    const key = songKey(song.title, song.artist);
    const list = groups.get(key) || [];
    list.push(song);
    groups.set(key, list);
  }

  const extras: any[] = [];
  for (const [, list] of groups) {
    if (list.length < 2) continue;
    const keeper = pickKeeper(list);
    extras.push(...list.filter((row) => row.id !== keeper.id));
  }

  let deleted = 0;
  for (const row of extras) {
    const { error } = await client.from('morfeus_songs').delete().eq('id', row.id);
    if (error) throw new Error(`${label} kopya silinemedi (${row.artist} - ${row.title}): ${error.message}`);
    deleted += 1;
    console.log(`[Silindi][${label}] ${row.artist} - ${row.title} (${row.id})`);
  }

  return {
    label,
    scanned: songs.length,
    extraCopies: extras.length,
    deleted,
    remaining: songs.length - deleted,
    extras: extras.map((row) => `${row.artist} - ${row.title}`),
  };
}

async function attributeToMaster() {
  const { data: admin, error } = await target
    .from('morfeus_profiles')
    .select('id, email')
    .eq('email', MASTER_EMAIL)
    .maybeSingle();
  if (error || !admin?.id) throw new Error('Master admin profili bulunamadı.');

  const { error: updateErr, count } = await target
    .from('morfeus_songs')
    .update({ user_id: admin.id }, { count: 'exact' })
    .not('id', 'is', null);
  if (updateErr) throw new Error(`Şarkı sahipliği yazılamadı: ${updateErr.message}`);

  const { count: owned } = await target
    .from('morfeus_songs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', admin.id);

  return { masterId: admin.id, updateCount: count, ownedNow: owned };
}

async function main() {
  const sourceDedup = await deleteDuplicateCopies(source, 'kaynak');
  const targetDedup = await deleteDuplicateCopies(target, 'hedef');
  const attributed = await attributeToMaster();
  console.log(JSON.stringify({ sourceDedup, targetDedup, attributed }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
