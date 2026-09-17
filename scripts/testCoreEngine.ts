import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xraapsysarhfgcqckvhs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYWFwc3lzYXJoZmdjcWNrdmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMTc5OTIsImV4cCI6MjEwMzU5Mzk5Mn0.TM3IOx9xgpnGCD3Wra2yUMpxLISJ_83QStoDi8DXbFE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Basit Transpoze Mantığı Doğrulama Fonksiyonu
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function transposeChord(chord: string, semitones: number): string {
  const rootMatch = chord.match(/^[A-G][#b]?/);
  if (!rootMatch) return chord;
  let root = rootMatch[0];
  if (root.endsWith('b')) {
    const flatToSharp: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
    root = flatToSharp[root] || root;
  }
  const idx = NOTES.indexOf(root);
  if (idx === -1) return chord;
  const newIdx = (idx + semitones + 12) % 12;
  return chord.replace(rootMatch[0], NOTES[newIdx]);
}

async function runAutomatedTests() {
  console.log('--- MORPHEUS CORE ENGINE TEST BAŞLIYOR ---\n');
  let errors = 0;

  // TEST 1: Veritabanı Erişim ve Veri Bütünlüğü
  console.log('[Test 1] Supabase bağlantısı ve metadata kontrolü...');
  const { data: songs, error } = await supabase
    .from('morfeus_songs')
    .select('id, title, artist, original_key, content, genre, release_year')
    .limit(10);

  if (error || !songs || songs.length === 0) {
    console.error('❌ Test 1 Başarısız: Veritabanı sorgusu hata verdi:', error?.message);
    errors++;
  } else {
    console.log(`✅ Test 1 Başarılı: ${songs.length} örnek parça çekildi.`);
    
    // Alt Kontrol: Boş veya tanımsız kritik alan var mı?
    const missingData = songs.filter(s => !s.content || !s.artist || !s.genre);
    if (missingData.length > 0) {
      console.warn(`⚠️ Uyarı: ${missingData.length} parçada eksik metin/tür tespit edildi.`);
    } else {
      console.log('✅ Veri Bütünlüğü: Çekilen parçaların söz, sanatçı ve tür bilgileri eksiksiz.');
    }
  }

  // TEST 2: Transpoze Motoru Hesaplama Testi
  console.log('\n[Test 2] Transpoze hesaplama algoritması testi...');
  const testCases = [
    { chord: 'Am', shift: 2, expected: 'Bm' },
    { chord: 'C', shift: 1, expected: 'C#' },
    { chord: 'Bb', shift: 2, expected: 'C' },
    { chord: 'F#m', shift: -2, expected: 'Em' }
  ];

  let transposeSuccess = true;
  for (const tc of testCases) {
    const result = transposeChord(tc.chord, tc.shift);
    if (result !== tc.expected) {
      console.error(`❌ Transpoze Hatası: ${tc.chord} + (${tc.shift}) -> Beklenen: ${tc.expected}, Alınan: ${result}`);
      transposeSuccess = false;
      errors++;
    }
  }
  if (transposeSuccess) {
    console.log('✅ Test 2 Başarılı: Transpoze algoritması tüm temel aralıklarda doğru çalışıyor.');
  }

  // TEST 3: Akor/Söz Blok Formatı Testi
  console.log('\n[Test 3] İçerik formatı kontrolü...');
  if (songs && songs[0]) {
    const sample = songs[0];
    const hasLineBreaks = sample.content && sample.content.includes('\n');
    if (hasLineBreaks) {
      console.log(`✅ Test 3 Başarılı: Söz ve akor satırları düzgün satır sonu (line break) içeriyor (${sample.title}).`);
    } else {
      console.warn(`⚠️ Test 3 Uyarısı: ${sample.title} içeriğinde satır sonu formatı eksik görünüyor.`);
    }
  }

  console.log('\n------------------------------------------');
  if (errors === 0) {
    console.log('🎉 TÜM OTOMATİK TESTLER BAŞARIYLA TAMAMLANDI!');
  } else {
    console.log(`❌ Toplam ${errors} hata ile testler tamamlandı.`);
  }
}

runAutomatedTests();