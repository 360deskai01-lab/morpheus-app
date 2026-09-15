import { createClient } from '@supabase/supabase-js';

// Canlı Vercel sitesinin baktığı 718 parçalık veritabanı
const SUPABASE_URL = 'https://ryxspxybjmowoyodjqdk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_gFVpeCi6nz0G57zBxvGohw_SQ_QoMvE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const GENRE_RULES: { match: string[]; genre: string; year: number; origin: 'DOMESTIC' | 'FOREIGN' }[] = [
  { match: ['duman', 'mor ve ötesi', 'şebnem ferah', 'teoman', 'manga', 'kurban', 'çilekeş', 'gripin', 'barış akarsu', 'cem karaca', 'haluk levent', 'ogün sanlısoy', 'hayko cepkin', 'pentagram'], genre: 'Rock', year: 2004, origin: 'DOMESTIC' },
  { match: ['sezen aksu', 'nilüfer', 'tarkan', 'sıla', 'kenan doğulu', 'yalın', 'gökhan türkmen', 'pinhani', 'emre aydın', 'mustafa sandal', 'sertab erener', 'levent yüksel', 'yaşar'], genre: 'Pop', year: 1998, origin: 'DOMESTIC' },
  { match: ['müslüm gürses', 'ferdi tayfur', 'orhan gencebay', 'ibrahim tatlıses', 'azer bülbül', 'bergen', 'cengiz kurtoğlu', 'ebru gündeş'], genre: 'Arabesk', year: 1988, origin: 'DOMESTIC' },
  { match: ['neşet ertaş', 'zeki müren', 'müzeyyen senar', 'zeki müren', 'erkan oğur', 'aşık veysel'], genre: 'Türk Sanat', year: 1975, origin: 'DOMESTIC' },
  { match: ['metallica', 'iron maiden', 'megadeth', 'judas priest', 'black sabbath'], genre: 'Metal', year: 1991, origin: 'FOREIGN' },
  { match: ['queen', 'pink floyd', 'beatles', 'nirvana', 'scorpions', 'guns n roses', 'oasis'], genre: 'Rock', year: 1980, origin: 'FOREIGN' },
  { match: ['coldplay', 'sting', 'adele', 'elton john', 'ed sheeran', 'michael jackson'], genre: 'Pop', year: 2005, origin: 'FOREIGN' },
];

async function fixAllMetadata() {
  console.log('[Canlı DB] 700+ parçalık veritabanına bağlanılıyor...');

  const { data: songs, error } = await supabase
    .from('morfeus_songs')
    .select('id, title, artist');

  if (error || !songs) {
    console.error('Hata:', error?.message);
    return;
  }

  console.log(`Bulunan eser sayısı: ${songs.length}. Türler ayrıştırılıyor...`);
  let count = 0;

  for (const s of songs) {
    const artistStr = (s.artist || '').toLowerCase();
    const titleStr = (s.title || '').toLowerCase();

    let targetGenre = 'Pop';
    let targetYear = 2005;
    let targetOrigin: 'DOMESTIC' | 'FOREIGN' = 'DOMESTIC';

    let found = false;
    for (const rule of GENRE_RULES) {
      if (rule.match.some((m) => artistStr.includes(m) || titleStr.includes(m))) {
        targetGenre = rule.genre;
        targetYear = rule.year;
        targetOrigin = rule.origin;
        found = true;
        break;
      }
    }

    if (!found) {
      // Yabancı karakter kontrolü
      const isEnglish = /^[a-zA-Z0-9\s,.'"-]+$/.test(s.title || '');
      targetGenre = isEnglish ? 'Rock' : 'Pop';
      targetOrigin = isEnglish ? 'FOREIGN' : 'DOMESTIC';
    }

    await supabase
      .from('morfeus_songs')
      .update({
        genre: targetGenre,
        release_year: targetYear,
        origin: targetOrigin,
      })
      .eq('id', s.id);

    count++;
    if (count % 50 === 0) console.log(`${count}/${songs.length} parça güncellendi...`);
  }

  console.log(`[Bitti] ${count} parçanın tümü Rock/Pop/Arabesk/Türk Sanat olarak ayrıştırıldı!`);
}

fixAllMetadata();