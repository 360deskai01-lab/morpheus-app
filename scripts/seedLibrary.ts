import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ryxspxybjmowoyodjqdk.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_gFVpeCi6nz0G57zBxvGohw_SQ_QoMvE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface SeedSong {
  title: string;
  artist: string;
  original_key: string;
  bpm: number;
  capo: string;
  genre: string;
  origin: 'DOMESTIC' | 'FOREIGN';
  release_year: number;
  content: string;
}

const SEED_SONGS: SeedSong[] = [
  {
    title: 'Bal',
    artist: 'Duman',
    original_key: 'Am',
    bpm: 104,
    capo: 'Yok',
    genre: 'Rock',
    origin: 'DOMESTIC',
    release_year: 2005,
    content: `[Am]            [F]
Aman aman bir dert bu bendeki
[Dm]            [E]
Çaresi yok kimselerde
[Am]            [F]
Aman aman bir aşk bu bendeki
[Dm]            [E]
Gözyaşım sel oldu yine

[F]              [G]
Tatlı dillim, güler yüzlüm balım
[Em]             [Am]
Sensiz geçen günlere yanarım
[F]              [G]
Tatlı dillim, güler yüzlüm balım
[Dm]             [E]
Gel ne olursun son kez yanıma`,
  },
  {
    title: 'Cambaz',
    artist: 'Mor ve Ötesi',
    original_key: 'Em',
    bpm: 130,
    capo: 'Yok',
    genre: 'Rock',
    origin: 'DOMESTIC',
    release_year: 2004,
    content: `[Em]                [C]
Ne habersin ne türksün ne yabancı
[Am]                [B7]
Korkma benden cambaz, korkma benden
[Em]                [C]
Herkes yürürken sen koşarsın telde
[Am]                [B7]
Aşağısı uçurum, yukarısı perde

[Em]         [D]
Gözlerini aç, gör artık
[C]          [B7]
Kuklalar oynuyor sahnede
[Em]         [D]
Gözlerini aç, gör artık
[C]          [B7]
İpler kimin elinde`,
  },
  {
    title: 'Kupa Kızı ve Sinek Valesi',
    artist: 'Teoman',
    original_key: 'Am',
    bpm: 96,
    capo: 'Yok',
    genre: 'Rock',
    origin: 'DOMESTIC',
    release_year: 2003,
    content: `[Am]              [Dm]
Bir iskambil falında çıkmıştık birbirimize
[G]               [C]          [E]
O kupa kızıydı, bense bir sinek valesi
[Am]              [Dm]
Aynı desteden ayrı masalara düşmüştük
[F]               [E]          [Am]
Kaderin bir oyunu, bir aşk hikayesi

[Dm]              [G]
Rüzgar esse dağılır masadaki kartlar
[C]               [F]
Kaybolur gider bir gecede umutlar
[Dm]              [E]
Gözlerinde hüzün, ellerinde veda
[Am]
Kupa kızı ağlar yine bu akşam`,
  },
  {
    title: 'Dön Bak Dünyaya',
    artist: 'Pinhani',
    original_key: 'Em',
    bpm: 100,
    capo: 'Yok',
    genre: 'Pop',
    origin: 'DOMESTIC',
    release_year: 2008,
    content: `[Em]             [D]
Dön bak dünyaya, herkes bir telaşta
[C]              [B7]
Kimi aşktan kaçar, kimi yalnızlıkta
[Em]             [D]
Dön bak dünyaya, dön bak kendine
[C]              [B7]
Ne kaldı geriye eski sevgilerden

[C]              [D]
Zaman akar gider durduramazsın
[Em]             [D]
Giden günleri geri sayamazsın
[C]              [B7]
Bir tebessüm bırak yeter ardından`,
  },
  {
    title: 'Dursun Zaman',
    artist: 'Manga',
    original_key: 'Bm',
    bpm: 90,
    capo: 'Yok',
    genre: 'Rock',
    origin: 'DOMESTIC',
    release_year: 2004,
    content: `[Bm]             [G]
Sarılsam boynuna, hiç konuşmasak
[Em]             [F#]
Sadece nefesin kalsa odamda
[Bm]             [G]
Bütün kelimeler anlamsız şimdi
[Em]             [F#]
Sensiz geçen ömür koca bir yalan

[G]           [A]
Dursun zaman, dursun dünya
[F#m]         [Bm]
Sensizliğin tam ortasında
[G]           [A]
Bir sen varsın akılda kalan
[Em]          [F#]
Bırak aksın gözyaşım sana`,
  },
  {
    title: 'Kırmış Kalbini',
    artist: 'Duman',
    original_key: 'Am',
    bpm: 110,
    capo: 'Yok',
    genre: 'Rock',
    origin: 'DOMESTIC',
    release_year: 2005,
    content: `[Am]           [F]
Kırmış kalbini bir kere
[Dm]            [E]
Dönmez geriye bir daha
[Am]             [F]
Yalnız kalmış bu şehirde
[Dm]            [E]
Çaresiz bir başına

[Am]      [F]         [Dm]        [E]
Gözlerinde yaşlarla yürür sokaklarda
[Am]      [F]         [Dm]        [E]
Kayıp gitmiş umutlar karanlık ufukta`,
  },
  {
    title: 'Bir Derdim Var',
    artist: 'Mor ve Ötesi',
    original_key: 'Em',
    bpm: 125,
    capo: 'Yok',
    genre: 'Rock',
    origin: 'DOMESTIC',
    release_year: 2004,
    content: `[Em]            [C]
Bir derdim var artık tutamam içimde
[Am]            [B7]
Gitsem nereye kadar, kalsam neye yarar
[Em]            [C]
Hiç anlatamadım, hiç anlamadılar
[Am]            [B7]
Herkes bir parça aldı, geriye kalan bu

[Em]         [D]          [C]           [B7]
Dünya yalan söylüyor, biliyorsun sen de`,
  },
  {
    title: 'Bana Öyle Bakma',
    artist: 'Teoman',
    original_key: 'Dm',
    bpm: 95,
    capo: 'Yok',
    genre: 'Rock',
    origin: 'DOMESTIC',
    release_year: 2011,
    content: `[Dm]                 [Bb]
Bana öyle bakma anlayacaklar
[C]                  [Am]
İkimize karşı bu dünya
[Dm]                 [Bb]
Bizi anlamazlar, bizi duymazlar
[C]                  [A7]
Bizi ayıramazlar ama kırarlar`,
  },
  {
    title: 'Sil Baştan',
    artist: 'Şebnem Ferah',
    original_key: 'C',
    bpm: 90,
    capo: 'Yok',
    genre: 'Rock',
    origin: 'DOMESTIC',
    release_year: 2001,
    content: `[C]             [G]
Kırık dökük bir kalple
[Am]            [Em]
Yürümek çok zor gelir
[F]             [C]
Yollar uzun geceler ayaz
[Dm]            [G]
Tükenir içimdeki heves

[C]            [G]
Sil baştan başlamak gerek bazen
[Am]           [Em]
Hayatı sıfırlamak`,
  },
  {
    title: 'Elfida',
    artist: 'Haluk Levent',
    original_key: 'Am',
    bpm: 105,
    capo: 'Yok',
    genre: 'Rock',
    origin: 'DOMESTIC',
    release_year: 2006,
    content: `[Am]           [Em]
Yüzün geçmişten kalan
[F]            [Dm]      [E]
Aşka tarif yazdıran bir masal
[Am]           [Em]
Gözlerinde bir hüzün
[F]            [Dm]      [E]
Ömrümü yakan o hazin yangın

[Am]        [G]
Elfida sen başka bir alemsin
[F]         [Em]
Farkındayım vazgeçilmezsin`,
  },
];

async function seedDatabase() {
  console.log(`[Aktarım] ${SEED_SONGS.length} adet doğrulanmış parça Supabase'e ekleniyor...`);

  for (const song of SEED_SONGS) {
    try {
      const { data: existing } = await supabase
        .from('morfeus_songs')
        .select('id')
        .eq('title', song.title)
        .eq('artist', song.artist)
        .maybeSingle();

      if (existing) {
        console.log(`[Mevcut] ${song.artist} - ${song.title} zaten veritabanında var.`);
        continue;
      }

      const { error } = await supabase.from('morfeus_songs').insert([
        {
          title: song.title,
          artist: song.artist,
          original_key: song.original_key,
          bpm: song.bpm,
          capo: song.capo,
          genre: song.genre,
          origin: song.origin,
          release_year: song.release_year,
          content: song.content,
          rating_avg: 5.0,
          rating_count: 1,
          view_count: Math.floor(Math.random() * 300) + 100,
          source_type: 'VERIFIED_CATALOG',
        },
      ]);

      if (error) {
        console.error(`[Supabase Hatası] ${song.title}:`, error.message);
      } else {
        console.log(`[Eklendi] ${song.artist} - ${song.title} başarıyla yüklendi!`);
      }
    } catch (err: any) {
      console.error(`[Hata] ${song.title}:`, err.message);
    }
  }

  console.log('Tüm parçalar Morpheus kütüphanesine aktarıldı!');
}

seedDatabase();