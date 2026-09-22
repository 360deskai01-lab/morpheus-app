import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { sanitizeSongContent } from '../src/utils/chordEngine';

const SOURCE_URL = 'https://ryxspxybjmowoyodjqdk.supabase.co';
const SOURCE_KEY = 'sb_publishable_gFVpeCi6nz0G57zBxvGohw_SQ_QoMvE';

const TARGET_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xraapsysarhfgcqckvhs.supabase.co';
const TARGET_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYWFwc3lzYXJoZmdjcWNrdmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMTc5OTIsImV4cCI6MjEwMzU5Mzk5Mn0.TM3IOx9xgpnGCD3Wra2yUMpxLISJ_83QStoDi8DXbFE';

const source = createClient(SOURCE_URL, SOURCE_KEY);
const target = createClient(TARGET_URL, TARGET_KEY);

async function fetchAll(client: SupabaseClient, columns = '*') {
  const pageSize = 500;
  const rows: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await client
      .from('morfeus_songs')
      .select(columns)
      .range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

function songKey(title?: string, artist?: string) {
  return `${(title || '').trim().toLocaleLowerCase('tr-TR')}___${(artist || '').trim().toLocaleLowerCase('tr-TR')}`;
}

function toCleanRow(s: any, masterUserId?: string) {
  const content = sanitizeSongContent(s.content || '');
  return {
    title: (s.title || '').trim(),
    artist: (s.artist || '').trim(),
    original_key: s.original_key || 'Am',
    bpm: Number(s.bpm) || 100,
    capo: s.capo || 'Yok',
    content,
    genre: s.genre || 'Rock',
    release_year: Number(s.release_year) || 2000,
    origin: s.origin || 'DOMESTIC',
    rating_avg: Number(s.rating_avg || s.rating) || 5.0,
    rating_count: Number(s.rating_count || s.votes_count) || 1,
    view_count: Number(s.view_count || s.views) || 50,
    rating: Number(s.rating || s.rating_avg) || 5.0,
    votes_count: Number(s.votes_count || s.rating_count) || 1,
    views: Number(s.views || s.view_count) || 50,
    user_id: masterUserId || s.user_id || null,
  };
}

async function wipeRelated() {
  const tables = ['playlist_songs', 'song_corrections'];
  for (const table of tables) {
    const { error } = await target.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      const fallback = await target.from(table).delete().gte('created_at', '1970-01-01');
      if (fallback.error) {
        console.warn(`[Uyarı] ${table} temizlenemedi: ${error.message}`);
      } else {
        console.log(`[Temizlendi] ${table}`);
      }
    } else {
      console.log(`[Temizlendi] ${table}`);
    }
  }
}

async function wipeSongs() {
  const { error } = await target.from('morfeus_songs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) {
    const fallback = await target.from('morfeus_songs').delete().gte('created_at', '1970-01-01');
    if (fallback.error) throw new Error(`Şarkılar silinemedi: ${error.message}`);
  }
}

async function insertBatch(rows: ReturnType<typeof toCleanRow>[]) {
  const slim = rows.map(({ rating, votes_count, views, ...rest }) => rest);
  const { error } = await target.from('morfeus_songs').insert(rows);
  if (!error) return;
  const retry = await target.from('morfeus_songs').insert(slim);
  if (retry.error) throw new Error(retry.error.message);
}

async function rebuild() {
  console.log('[1/4] Kaynak katalog okunuyor...');
  const sourceSongs = await fetchAll(source);
  console.log(`Kaynak: ${sourceSongs.length} parça`);

  const { data: admin } = await target
    .from('morfeus_profiles')
    .select('id')
    .eq('email', 'master@360bct.com')
    .maybeSingle();

  const seen = new Set<string>();
  const clean = [];
  let skippedEmpty = 0;
  let skippedDup = 0;
  for (const song of sourceSongs) {
    const row = toCleanRow(song, admin?.id);
    if (!row.title || !row.artist || !row.content.trim()) {
      skippedEmpty += 1;
      continue;
    }
    const key = songKey(row.title, row.artist);
    if (seen.has(key)) {
      skippedDup += 1;
      continue;
    }
    seen.add(key);
    clean.push(row);
  }
  console.log(`Temizlenecek aktarım: ${clean.length} (boş: ${skippedEmpty}, kopya: ${skippedDup})`);

  console.log('[2/4] Hedefteki eski/test şarkı kayıtları siliniyor...');
  const before = await fetchAll(target, 'id');
  console.log(`Hedef önceki sayı: ${before.length}`);
  await wipeRelated();
  await wipeSongs();
  const afterWipe = await fetchAll(target, 'id');
  console.log(`Hedef silme sonrası: ${afterWipe.length}`);

  console.log('[3/4] Sanitize edilmiş katalog yükleniyor...');
  const batchSize = 25;
  for (let i = 0; i < clean.length; i += batchSize) {
    const batch = clean.slice(i, i + batchSize);
    await insertBatch(batch);
    console.log(`${Math.min(i + batchSize, clean.length)} / ${clean.length}`);
  }

  console.log('[4/4] Doğrulama...');
  const finalRows = await fetchAll(target, 'id,title,artist,content');
  const emptyContent = finalRows.filter((s) => !String(s.content || '').trim()).length;
  console.log(
    JSON.stringify(
      {
        source: sourceSongs.length,
        imported: clean.length,
        targetNow: finalRows.length,
        emptyContent,
      },
      null,
      2
    )
  );
  if (finalRows.length < 700) {
    throw new Error(`Beklenen 700+ eser yüklenmedi. Şu an: ${finalRows.length}`);
  }
  console.log('Kütüphane yeniden kuruldu.');
}

rebuild().catch((err) => {
  console.error(err);
  process.exit(1);
});
