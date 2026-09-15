import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';

// Supabase Yapılandırması
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://tbbrysfqfipmkvshkffo.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiYnJ5c2ZxZmlwbWt2c2hrZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MTM0ODMsImV4cCI6MjA4ODk4OTQ4M30.4i4n4zZ7X1rQh33j4S0m7oK2B3Q4Z1j1n3W_vX8r0kE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- FORMAT DÖNÜŞTÜRÜCÜ ---
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
    title: 'Kırmış Kalbini',
    url: 'https://www.akorlar.com/duman/kirmis-kalbini-akor',
    genre: 'Rock',
    key: 'Am',
    year: 2005,
  },
  {
    artist: 'Mor ve Ötesi',
    title: 'Bir Derdim Var',
    url: 'https://www.akorlar.com/mor-ve-otesi/bir-derdim-var-akor',
    genre: 'Rock',
    key: 'Em',
    year: 2004,
  },
  {
    artist: 'Teoman',
    title: 'Bana Öyle Bakma',
    url: 'https://www.akorlar.com/teoman/bana-oyle-bakma-akor',
    genre: 'Rock',
    key: 'Dm',
    year: 2011,
  },
  {
    artist: 'Şebnem Ferah',
    title: 'Sil Baştan',
    url: 'https://www.akorlar.com/sebnem-ferah/sil-bastan-akor',
    genre: 'Rock',
    key: 'C',
    year: 2001,
  },
  {
    artist: 'Haluk Levent',
    title: 'Elfida',
    url: 'https://www.akorlar.com/haluk-levent/elfida-akor',
    genre: 'Rock',
    key: 'Am',
    year: 2006,
  },
];

async function runBrowserCrawler() {
  console.log('Gerçek tarayıcı motoru başlatılıyor...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  );

  for (const item of TARGET_SONGS) {
    try {
      console.log(`[Taranıyor] ${item.artist} - ${item.title}...`);
      await page.goto(item.url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Sayfa içindeki akor metnini al
      const rawContent = await page.evaluate(() => {
        const pre = document.querySelector('pre');
        if (pre) return pre.innerText;
        const chordBox = document.querySelector('.chord-content') || document.querySelector('.entry-content');
        return chordBox ? (chordBox as HTMLElement).innerText : '';
      });

      if (!rawContent || rawContent.trim().length === 0) {
        console.warn(`[Uyarı] İçerik bulunamadı: ${item.title}`);
        continue;
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
          view_count: 1,
          source_type: 'WEB_IMPORT',
        },
      ]);

      if (error) {
        console.error(`[Veritabanı Hatası] ${item.title}:`, error.message);
      } else {
        console.log(`[Eklendi] ${item.artist} - ${item.title} başarıyla kaydedildi!`);
      }

      await new Promise((r) => setTimeout(r, 2000));
    } catch (err: any) {
      console.error(`[Hata] ${item.title}:`, err.message);
    }
  }

  await browser.close();
  console.log('İşlem tamamlandı.');
}

runBrowserCrawler();