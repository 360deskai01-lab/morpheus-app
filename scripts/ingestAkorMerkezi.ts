import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';

// Supabase Yapılandırması
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://tbbrysfqfipmkvshkffo.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiYnJ5c2ZxZmlwbWt2c2hrZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MTM0ODMsImV4cCI6MjA4ODk4OTQ4M30.4i4n4zZ7X1rQh33j4S0m7oK2B3Q4Z1j1n3W_vX8r0kE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Süresi dolmuş SSL sertifikalarını bypass eden ajan
const insecureAgent = new https.Agent({
  rejectUnauthorized: false,
});

// --- AKOR FORMATLAYICI MOTORU ---
function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  const chordPattern = /^[A-G][b#]?(m|maj|min|dim|aug|sus[24]?|add)?[0-9]?(\/[A-G][b#]?)?(\s+[A-G][b#]?(m|maj|min|dim|aug|sus[24]?|add)?[0-9]?(\/[A-G][b#]?)?)*$/;
  return chordPattern.test(trimmed);
}

function mergeChordsAndLyrics(chordLine: string, lyricLine: string): string {
  if (!chordLine.trim()) return lyricLine;
  if (!lyricLine.trim()) {
    return chordLine.trim().split(/\s+/).map((c) => `[${c}]`).join(' ');
  }

  const chords: { chord: string; index: number }[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(chordLine)) !== null) {
    chords.push({ chord: match[0], index: match.index });
  }

  let result = '';
  let lastIdx = 0;

  for (let i = 0; i < chords.length; i++) {
    const { chord, index } = chords[i];
    if (index < lyricLine.length) {
      result += lyricLine.substring(lastIdx, index) + `[${chord}]`;
      lastIdx = index;
    } else {
      if (lastIdx < lyricLine.length) {
        result += lyricLine.substring(lastIdx);
        lastIdx = lyricLine.length;
      }
      result += ` [${chord}]`;
    }
  }

  if (lastIdx < lyricLine.length) {
    result += lyricLine.substring(lastIdx);
  }

  return result;
}

function convertRawChordsToMorpheus(rawText: string): string {
  const lines = rawText.replace(/\r\n/g, '\n').split('\n');
  const outputLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const current = lines[i];
    const next = i + 1 < lines.length ? lines[i + 1] : null;

    if (isChordLine(current)) {
      if (next !== null && !isChordLine(next) && next.trim().length > 0) {
        outputLines.push(mergeChordsAndLyrics(current, next));
        i++;
      } else {
        outputLines.push(mergeChordsAndLyrics(current, ''));
      }
    } else {
      outputLines.push(current);
    }
  }

  return outputLines.join('\n');
}

// --- HEDEF LİSTE ---
interface TargetSong {
  artist: string;
  title: string;
  url: string;
  genre: string;
  key?: string;
  year?: number;
}

const TARGET_SONGS: TargetSong[] = [
  {
    artist: 'Duman',
    title: 'Bal',
    url: 'https://www.akormerkezi.com/duman-bal-akor-tab-sarkisi.html',
    genre: 'Rock',
    key: 'Am',
    year: 2005,
  },
  {
    artist: 'Mor ve Ötesi',
    title: 'Cambaz',
    url: 'https://www.akormerkezi.com/mor-ve-otesi-cambaz-akor-tab-sarkisi.html',
    genre: 'Rock',
    key: 'Em',
    year: 2004,
  },
  {
    artist: 'Teoman',
    title: 'Kupa Kızı ve Sinek Valesi',
    url: 'https://www.akormerkezi.com/teoman-kupa-kizi-ve-sinek-valesi-akor-tab-sarkisi.html',
    genre: 'Rock',
    key: 'Am',
    year: 2003,
  },
  {
    artist: 'Pinhani',
    title: 'Dön Bak Dünyaya',
    url: 'https://www.akormerkezi.com/pinhani-don-bak-dunyaya-akor-tab-sarkisi.html',
    genre: 'Pop',
    key: 'Em',
    year: 2008,
  },
  {
    artist: 'Manga',
    title: 'Dursun Zaman',
    url: 'https://www.akormerkezi.com/manga-dursun-zaman-akor-tab-sarkisi.html',
    genre: 'Rock',
    key: 'Bm',
    year: 2004,
  },
];

// --- ÇEKME VE DB AKTARIMI ---
async function fetchAndIngestAkorMerkezi(item: TargetSong) {
  try {
    console.log(`[İndiriliyor] ${item.artist} - ${item.title}...`);

    const response = await axios.get(item.url, {
      httpsAgent: insecureAgent, // SSL sertifika hatasını yok say
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    let rawContent =
      $('#akor_icerik').text() ||
      $('pre').text() ||
      $('.akor_alani').text() ||
      $('font[face="Courier New"]').text();

    if (!rawContent || rawContent.trim().length === 0) {
      console.warn(`[Uyarı] Akor metni ayrıştırılamadı: ${item.title}`);
      return;
    }

    const formattedContent = convertRawChordsToMorpheus(rawContent.trim());

    const { error } = await supabase.from('morfeus_songs').insert([
      {
        title: item.title,
        artist: item.artist,
        original_key: item.key || 'Am',
        bpm: 100,
        capo: 'Yok',
        genre: item.genre,
        origin: 'DOMESTIC',
        release_year: item.year || 2000,
        content: formattedContent,
        rating_avg: 5.0,
        rating_count: 1,
        view_count: Math.floor(Math.random() * 200) + 50,
        source_type: 'AKORMERKEZI_IMPORT',
      },
    ]);

    if (error) {
      console.error(`[Veritabanı Hatası] ${item.title}:`, error.message);
    } else {
      console.log(`[Eklendi] ${item.artist} - ${item.title} Morpheus formatında başarıyla kaydedildi!`);
    }
  } catch (err: any) {
    console.error(`[İstek Hatası] ${item.title}:`, err.message);
  }
}

async function runAkorMerkeziIngestion() {
  console.log(`[Başlatıldı] AkorMerkezi'nden ${TARGET_SONGS.length} parça çekiliyor...`);

  for (let i = 0; i < TARGET_SONGS.length; i++) {
    await fetchAndIngestAkorMerkezi(TARGET_SONGS[i]);
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  console.log('[Tamamlandı] AkorMerkezi aktarımı sonlandı!');
}

runAkorMerkeziIngestion();