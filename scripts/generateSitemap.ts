import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { buildSitemapXml } from '../api/sitemap';
import type { SongLike } from '../src/utils/portalRouting';

async function main() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL ve EXPO_PUBLIC_SUPABASE_ANON_KEY gerekli.');
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/morfeus_songs?select=id,title,artist&order=id.desc`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Supabase şarkı listesi alınamadı: ${response.status}`);
  }

  const songs = (await response.json()) as SongLike[];
  const xml = buildSitemapXml(songs);
  const outPath = resolve(__dirname, '../public/sitemap.xml');
  writeFileSync(outPath, xml, 'utf8');
  console.log(`sitemap.xml yazıldı: ${songs.length} şarkı → ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
