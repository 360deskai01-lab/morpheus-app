import { createClient } from '@supabase/supabase-js';
import { sanitizeSongContent } from '../src/utils/chordEngine';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xraapsysarhfgcqckvhs.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
  throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY gerekli.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchAllSongs() {
  const pageSize = 500;
  const songs: { id: string; title: string; artist: string; content: string | null }[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('morfeus_songs')
      .select('id, title, artist, content')
      .range(from, from + pageSize - 1);

    if (error) throw new Error(error.message);
    if (!data?.length) break;
    songs.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return songs;
}

async function sanitizeLibrary() {
  console.log('Kütüphane taranıyor...');
  const songs = await fetchAllSongs();
  console.log(`Toplam parça: ${songs.length}`);

  let changed = 0;
  let failed = 0;

  for (const song of songs) {
    const next = sanitizeSongContent(song.content || '');
    if (next === (song.content || '')) continue;

    const { error } = await supabase
      .from('morfeus_songs')
      .update({ content: next })
      .eq('id', song.id);

    if (error) {
      failed += 1;
      console.warn(`Güncellenemedi: ${song.artist} - ${song.title} (${error.message})`);
      continue;
    }

    changed += 1;
    console.log(`Düzeltildi: ${song.artist} - ${song.title}`);
  }

  console.log(`Bitti. Güncellenen: ${changed}, atlanan: ${songs.length - changed - failed}, hata: ${failed}`);
}

sanitizeLibrary().catch((err) => {
  console.error(err);
  process.exit(1);
});
