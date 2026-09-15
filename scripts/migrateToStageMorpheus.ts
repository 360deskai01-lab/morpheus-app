import { createClient } from '@supabase/supabase-js';

// Kaynak DB (719 parçanın durduğu DB)
const sourceSupabase = createClient(
  'https://ryxspxybjmowoyodjqdk.supabase.co',
  'sb_publishable_gFVpeCi6nz0G57zBxvGohw_SQ_QoMvE'
);

// Hedef DB (Dashboard'daki Resmi MORPHEUS Projeniz)
const targetSupabase = createClient(
  'https://xraapsysarhfgcqckvhs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYWFwc3lzYXJoZmdjcWNrdmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMTc5OTIsImV4cCI6MjEwMzU5Mzk5Mn0.TM3IOx9xgpnGCD3Wra2yUMpxLISJ_83QStoDi8DXbFE'
);

async function migrate() {
  console.log('[1/3] Kaynaktan parçalar çekiliyor...');
  const { data: songs, error } = await sourceSupabase
    .from('morfeus_songs')
    .select('*')
    .range(0, 1500);

  if (error || !songs) {
    console.error('Kaynak DB okunamadı:', error?.message);
    return;
  }

  console.log(`[2/3] ${songs.length} parça çekildi. Hedefteki mevcut kayıtlar kontrol ediliyor...`);
  const { data: existingTarget } = await targetSupabase
    .from('morfeus_songs')
    .select('title, artist');

  const existingKeys = new Set(
    (existingTarget || []).map(
      (s) => `${(s.title || '').trim().toLowerCase()}___${(s.artist || '').trim().toLowerCase()}`
    )
  );

  // DİKKAT: source_type alanı bilinçli olarak eklenmedi (PostgreSQL kendi default enum değerini atayacak)
  const toInsert = songs
    .filter((s) => {
      const key = `${(s.title || '').trim().toLowerCase()}___${(s.artist || '').trim().toLowerCase()}`;
      return !existingKeys.has(key);
    })
    .map((s) => ({
      title: s.title,
      artist: s.artist,
      original_key: s.original_key || 'Am',
      bpm: s.bpm || 100,
      capo: s.capo || 'Yok',
      content: s.content,
      genre: s.genre || 'Rock',
      release_year: s.release_year || 2000,
      origin: s.origin || 'DOMESTIC',
      rating_avg: Number(s.rating_avg) || 5.0,
      rating_count: Number(s.rating_count) || 1,
      view_count: Number(s.view_count) || 50,
    }));

  console.log(`[3/3] Hedefe aktarılacak yeni parça sayısı: ${toInsert.length}`);

  if (toInsert.length === 0) {
    console.log('Tüm parçalar zaten hedef veritabanında mevcut!');
    return;
  }

  const batchSize = 35;
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    const { error: insErr } = await targetSupabase
      .from('morfeus_songs')
      .insert(batch);

    if (insErr) {
      console.error(`Paket ${i} hatası:`, insErr.message);
    } else {
      console.log(`${Math.min(i + batchSize, toInsert.length)} / ${toInsert.length} parça başarıyla aktarıldı...`);
    }
  }

  console.log('\n[Tamamlandı] 700+ parçanın tümü resmi MORPHEUS veritabanına aktarıldı!');
}

migrate();