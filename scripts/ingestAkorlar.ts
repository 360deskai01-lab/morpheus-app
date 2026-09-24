import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { convertRawChordsToMorpheus } from './formatConverter';
import { sanitizeSongContent } from '../src/utils/chordEngine';
import { extractChordNames } from '../src/utils/chordTokens';
import { bassFretsFor, guitarFretsFor } from '../src/utils/chordDiagrams';
import { getPianoKeysForChord } from '../src/utils/pianoDiagrams';

const TARGET_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xraapsysarhfgcqckvhs.supabase.co';
const TARGET_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYWFwc3lzYXJoZmdjcWNrdmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMTc5OTIsImV4cCI6MjEwMzU5Mzk5Mn0.TM3IOx9xgpnGCD3Wra2yUMpxLISJ_83QStoDi8DXbFE';

const supabase = createClient(TARGET_URL, TARGET_KEY);
const LIMIT = Number(process.env.AKORLAR_LIMIT || 40);
const DELAY_MS = Number(process.env.AKORLAR_DELAY_MS || 1200);
const MASTER_EMAIL = 'master@360bct.com';

const LIST_PAGES = [
  { url: 'https://www.akorlar.com/', origin: 'DOMESTIC' as const },
  { url: 'https://www.akorlar.com/en-cok-arananlar', origin: 'DOMESTIC' as const },
  { url: 'https://www.akorlar.com/populer-akorlar', origin: 'DOMESTIC' as const },
  { url: 'https://www.akorlar.com/turkce-sarkilar', origin: 'DOMESTIC' as const },
  { url: 'https://www.akorlar.com/yabanci-sarkilar', origin: 'FOREIGN' as const },
  { url: 'https://www.akorlar.com/yabanci', origin: 'FOREIGN' as const },
];

const FALLBACK_SONGS: Array<{ url: string; origin: 'DOMESTIC' | 'FOREIGN' }> = [
  { url: 'https://www.akorlar.com/duman-kopru-alti', origin: 'DOMESTIC' },
  { url: 'https://www.akorlar.com/sezen-aksu-sarki-sozu', origin: 'DOMESTIC' },
  { url: 'https://www.akorlar.com/sezen-aksu-vazgectim', origin: 'DOMESTIC' },
  { url: 'https://www.akorlar.com/mor-ve-otesi-bir-derdim-var', origin: 'DOMESTIC' },
  { url: 'https://www.akorlar.com/teoman-istanbulda-sonbahar', origin: 'DOMESTIC' },
  { url: 'https://www.akorlar.com/manga-cevapsiz-sorular', origin: 'DOMESTIC' },
  { url: 'https://www.akorlar.com/duman-haberin-yok-oluyorum', origin: 'DOMESTIC' },
  { url: 'https://www.akorlar.com/tarkan-kuzu-kuzu', origin: 'DOMESTIC' },
  { url: 'https://www.akorlar.com/baris-manco-gul-pembe', origin: 'DOMESTIC' },
  { url: 'https://www.akorlar.com/queen-bohemian-rhapsody', origin: 'FOREIGN' },
  { url: 'https://www.akorlar.com/the-beatles-let-it-be', origin: 'FOREIGN' },
  { url: 'https://www.akorlar.com/nirvana-smells-like-teen-spirit', origin: 'FOREIGN' },
  { url: 'https://www.akorlar.com/coldplay-yellow', origin: 'FOREIGN' },
  { url: 'https://www.akorlar.com/ed-sheeran-perfect', origin: 'FOREIGN' },
];

const SKIP_PATH = /(giris|kayit|iletisim|hakkimizda|gizlilik|reklam|kategori|sanatci|blog|rss|sitemap|login)/i;

const http = axios.create({
  timeout: 15000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8',
  },
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function absUrl(href: string) {
  try {
    return new URL(href, 'https://www.akorlar.com/').toString();
  } catch {
    return '';
  }
}

function looksLikeSongPath(href: string) {
  const url = absUrl(href);
  if (!url.includes('akorlar.com')) return false;
  const path = new URL(url).pathname.replace(/\/+$/, '');
  if (!path || path === '/') return false;
  if (SKIP_PATH.test(path)) return false;
  if (path.split('/').filter(Boolean).length > 3) return false;
  return /[a-z0-9-]+/i.test(path);
}

function titleFromHeading($: cheerio.CheerioAPI, fallbackPath: string) {
  const heading = $('h1').first().text().replace(/akor(ları|lari)?/gi, '').trim();
  if (heading.includes(' - ')) {
    const [artist, title] = heading.split(' - ').map((s) => s.trim());
    if (artist && title) return { artist, title };
  }
  const parts = fallbackPath.replace(/^\//, '').split('-');
  return {
    artist: parts.slice(0, 2).join(' ') || 'Bilinmeyen',
    title: parts.slice(2).join(' ') || heading || fallbackPath,
  };
}

function extractRawContent($: cheerio.CheerioAPI) {
  const selectors = [
    'pre',
    '#akor',
    '.akor',
    '.akor-icerik',
    '.song-content',
    '.sarki-sozu',
    'article pre',
    '.content pre',
    'font[face="Courier New"]',
    '.entry-content',
  ];
  for (const sel of selectors) {
    const text = $(sel).first().text();
    if (text && text.trim().length > 80) return text;
  }
  return '';
}

function detectKey(content: string) {
  const match = content.match(/\b([A-G][b#]?(?:m|maj|min)?)\b/);
  return match?.[1] || 'Am';
}

function isChallengePage(html: string) {
  return /just a moment|cf-mitigated|challenge-platform|cloudflare/i.test(html) && html.length < 20000;
}

async function fetchWithPuppeteer(url: string) {
  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const html = await page.content();
    if (isChallengePage(html)) {
      throw new Error('Cloudflare doğrulaması aşılamadı');
    }
    return cheerio.load(html);
  } finally {
    await browser.close();
  }
}

async function fetchHtml(url: string) {
  try {
    const { data } = await http.get(url);
    const html = typeof data === 'string' ? data : String(data);
    if (isChallengePage(html)) throw new Error('Cloudflare challenge');
    return cheerio.load(html);
  } catch (err: any) {
    if (process.env.AKORLAR_PUPPETEER === '0') throw err;
    console.warn(`[Puppeteer] ${url}: ${err.message}`);
    return fetchWithPuppeteer(url);
  }
}

async function collectSongLinks(): Promise<Array<{ url: string; origin: 'DOMESTIC' | 'FOREIGN' }>> {
  const seen = new Map<string, 'DOMESTIC' | 'FOREIGN'>();
  for (const page of LIST_PAGES) {
    try {
      const $ = await fetchHtml(page.url);
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href') || '';
        const url = absUrl(href).split('#')[0];
        if (!looksLikeSongPath(url)) return;
        if (!seen.has(url)) seen.set(url, page.origin);
      });
      console.log(`[Liste] ${page.url} → toplam aday ${seen.size}`);
    } catch (err: any) {
      console.warn(`[Liste atlandı] ${page.url}: ${err.message}`);
    }
    await sleep(400);
  }

  try {
    const { data } = await http.get('https://www.akorlar.com/sitemap.xml');
    const $ = cheerio.load(typeof data === 'string' ? data : String(data), { xmlMode: true });
    $('loc').each((_, el) => {
      const url = $(el).text().trim();
      if (looksLikeSongPath(url) && !seen.has(url)) seen.set(url, 'DOMESTIC');
    });
    console.log(`[Sitemap] toplam aday ${seen.size}`);
  } catch (err: any) {
    console.warn(`[Sitemap atlandı] ${err.message}`);
  }

  if (seen.size === 0) {
    for (const item of FALLBACK_SONGS) seen.set(item.url, item.origin);
    console.log('[Liste] Cloudflare/liste boş, popüler yedek URL listesi kullanılıyor');
  }
  return [...seen.entries()].slice(0, LIMIT).map(([url, origin]) => ({ url, origin }));
}

async function upsertSong(row: {
  title: string;
  artist: string;
  content: string;
  origin: 'DOMESTIC' | 'FOREIGN';
  original_key: string;
  user_id: string | null;
}) {
  const { data: existing } = await supabase
    .from('morfeus_songs')
    .select('id')
    .eq('title', row.title)
    .eq('artist', row.artist)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from('morfeus_songs').update({ content: row.content, original_key: row.original_key }).eq('id', existing.id);
    return existing.id as string;
  }

  const payload: Record<string, unknown> = {
    title: row.title,
    artist: row.artist,
    content: row.content,
    original_key: row.original_key,
    origin: row.origin,
    genre: row.origin === 'FOREIGN' ? 'Pop' : 'Rock',
    release_year: 2000,
    bpm: 100,
    capo: 'Yok',
    rating_avg: 5,
    rating_count: 1,
    view_count: 50,
    rating: 5,
    votes_count: 1,
    views: 50,
    user_id: row.user_id,
  };

  const first = await supabase.from('morfeus_songs').insert(payload).select('id').single();
  if (!first.error && first.data) return first.data.id as string;

  const { rating, votes_count, views, ...slim } = payload;
  const retry = await supabase.from('morfeus_songs').insert(slim).select('id').single();
  if (retry.error || !retry.data) throw new Error(first.error?.message || retry.error?.message || 'Şarkı eklenemedi');
  return retry.data.id as string;
}

async function upsertPublicChords(songId: string, content: string) {
  const names = extractChordNames(content);
  for (const chord of names) {
    const rows = [
      { song_id: songId, chord_name: chord, instrument: 'guitar', frets: guitarFretsFor(chord), pitches: null, source: 'akorlar' },
      { song_id: songId, chord_name: chord, instrument: 'bass', frets: bassFretsFor(chord), pitches: null, source: 'akorlar' },
      { song_id: songId, chord_name: chord, instrument: 'piano', frets: null, pitches: getPianoKeysForChord(chord), source: 'akorlar' },
    ];
    for (const row of rows) {
      const { error } = await supabase.from('morfeus_public_chords').upsert(row, {
        onConflict: 'song_id,chord_name,instrument',
      });
      if (error) console.warn(`[Akor şema] ${chord}/${row.instrument}: ${error.message}`);
    }
  }
  return names.length;
}

async function ingestOne(url: string, origin: 'DOMESTIC' | 'FOREIGN', userId: string | null) {
  const $ = await fetchHtml(url);
  const path = new URL(url).pathname;
  const meta = titleFromHeading($, path);
  const raw = extractRawContent($);
  if (!raw) {
    console.warn(`[Atlandı] içerik yok: ${url}`);
    return { imported: false };
  }
  const content = sanitizeSongContent(convertRawChordsToMorpheus(raw));
  if (content.trim().length < 40) {
    console.warn(`[Atlandı] kısa içerik: ${meta.artist} - ${meta.title}`);
    return { imported: false };
  }
  const songId = await upsertSong({
    title: meta.title.replace(/\s+/g, ' ').trim(),
    artist: meta.artist.replace(/\s+/g, ' ').trim(),
    content,
    origin,
    original_key: detectKey(content),
    user_id: userId,
  });
  const chordCount = await upsertPublicChords(songId, content);
  console.log(`[Eklendi] ${meta.artist} - ${meta.title} (${chordCount} akor)`);
  return { imported: true };
}

async function backfillExisting() {
  if (process.env.AKORLAR_BACKFILL !== '1') return;
  const { data: songs, error } = await supabase
    .from('morfeus_songs')
    .select('id, content')
    .limit(Number(process.env.AKORLAR_BACKFILL_LIMIT || 800));
  if (error) {
    console.warn(`[Backfill] ${error.message}`);
    return;
  }
  let count = 0;
  for (const song of songs || []) {
    count += await upsertPublicChords(song.id, song.content || '');
  }
  console.log(`[Backfill] ${songs?.length || 0} parça, ${count} akor adı işlendi`);
}

async function main() {
  const { data: admin } = await supabase
    .from('morfeus_profiles')
    .select('id')
    .eq('email', MASTER_EMAIL)
    .maybeSingle();

  await backfillExisting();

  console.log(`[Akorlar.com] limit=${LIMIT}`);
  const links = await collectSongLinks();
  console.log(`İşlenecek parça: ${links.length}`);

  let imported = 0;
  let failed = 0;
  for (const item of links) {
    try {
      const result = await ingestOne(item.url, item.origin, admin?.id || null);
      if (result.imported) imported += 1;
    } catch (err: any) {
      failed += 1;
      console.warn(`[Hata] ${item.url}: ${err.message}`);
    }
    await sleep(DELAY_MS);
  }
  console.log(JSON.stringify({ imported, failed, scanned: links.length }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
