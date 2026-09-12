// src/utils/chordDiagrams.ts

export interface ChordVoicing {
  baseFret: number;
  frets: number[]; // [6. Tel (Kalın E), 5. Tel (A), 4. Tel (D), 3. Tel (G), 2. Tel (B), 1. Tel (İnce e)]
                   // -1: Çalınmaz (X), 0: Boş Tel (O), 1..n: Perde Numarası
  label?: string;
}

export const GUITAR_CHORDS_DB: Record<string, ChordVoicing[]> = {
  // ================= A GRUBU =================
  'A': [
    { baseFret: 1, frets: [-1, 0, 2, 2, 2, 0], label: 'Açık Pozisyon' },
    { baseFret: 5, frets: [5, 7, 7, 6, 5, 5], label: 'Bareli (5. Perde)' },
  ],
  'Am': [
    { baseFret: 1, frets: [-1, 0, 2, 2, 1, 0], label: 'Açık Pozisyon' },
    { baseFret: 5, frets: [5, 7, 7, 5, 5, 5], label: 'Bareli (5. Perde)' },
  ],
  'A7': [
    { baseFret: 1, frets: [-1, 0, 2, 0, 2, 0], label: 'Açık 7li' },
    { baseFret: 5, frets: [5, 7, 5, 6, 5, 5], label: 'Bareli 7li' },
  ],
  'Am7': [
    { baseFret: 1, frets: [-1, 0, 2, 0, 1, 0], label: 'Açık m7' },
    { baseFret: 5, frets: [5, 7, 5, 5, 5, 5], label: 'Bareli m7' },
  ],
  'Amaj7': [
    { baseFret: 1, frets: [-1, 0, 2, 1, 2, 0], label: 'Açık Maj7' },
    { baseFret: 5, frets: [5, -1, 6, 6, 5, -1], label: 'Caz Drop-2' },
  ],
  'Am7(b5)': [
    { baseFret: 1, frets: [-1, 0, 1, 2, 1, -1], label: 'Açık Yarı Eksilmiş' },
    { baseFret: 5, frets: [5, -1, 5, 5, 4, -1], label: 'Kök 6. Tel m7b5' },
  ],
  'Am7b5': [
    { baseFret: 1, frets: [-1, 0, 1, 2, 1, -1], label: 'Açık Yarı Eksilmiş' },
    { baseFret: 5, frets: [5, -1, 5, 5, 4, -1], label: 'Kök 6. Tel m7b5' },
  ],
  'Asus4': [{ baseFret: 1, frets: [-1, 0, 2, 2, 3, 0], label: 'Açık Sus4' }],
  'Asus2': [{ baseFret: 1, frets: [-1, 0, 2, 2, 0, 0], label: 'Açık Sus2' }],
  'Aadd9': [{ baseFret: 1, frets: [-1, 0, 2, 4, 2, 0], label: 'Açık Add9' }],
  'Adim': [{ baseFret: 1, frets: [-1, 0, 1, 2, 1, -1], label: 'Eksilmiş' }],

  // ================= B / Bb GRUBU =================
  'B': [
    { baseFret: 2, frets: [-1, 2, 4, 4, 4, 2], label: 'Bareli (2. Perde)' },
    { baseFret: 7, frets: [7, 9, 9, 8, 7, 7], label: 'Bareli (7. Perde)' },
  ],
  'Bm': [
    { baseFret: 2, frets: [-1, 2, 4, 4, 3, 2], label: 'Bareli (2. Perde)' },
    { baseFret: 7, frets: [7, 9, 9, 7, 7, 7], label: 'Bareli (7. Perde)' },
  ],
  'B7': [
    { baseFret: 1, frets: [-1, 2, 1, 2, 0, 2], label: 'Açık 7li' },
    { baseFret: 2, frets: [-1, 2, 4, 2, 4, 2], label: 'Bareli 7li' },
  ],
  'Bm7': [
    { baseFret: 2, frets: [-1, 2, 4, 2, 3, 2], label: 'Bareli m7 (2. Perde)' },
    { baseFret: 7, frets: [7, 9, 7, 7, 7, 7], label: 'Bareli m7 (7. Perde)' },
    { baseFret: 1, frets: [-1, 2, 0, 2, 0, 2], label: 'Açık m7' },
  ],
  'Bmaj7': [
    { baseFret: 2, frets: [-1, 2, 4, 3, 4, 2], label: 'Bareli Maj7' },
    { baseFret: 7, frets: [7, -1, 8, 8, 7, -1], label: 'Caz Drop-2' },
  ],
  'Bm7(b5)': [
    { baseFret: 1, frets: [-1, 2, 3, 2, 3, -1], label: 'Kök 5. Tel m7b5' },
    { baseFret: 7, frets: [7, -1, 7, 7, 6, -1], label: 'Kök 6. Tel m7b5' },
  ],
  'Bm7b5': [
    { baseFret: 1, frets: [-1, 2, 3, 2, 3, -1], label: 'Kök 5. Tel m7b5' },
  ],
  'Bb': [
    { baseFret: 1, frets: [-1, 1, 3, 3, 3, 1], label: 'Bareli (1. Perde)' },
    { baseFret: 6, frets: [6, 8, 8, 7, 6, 6], label: 'Bareli (6. Perde)' },
  ],
  'Bbm': [
    { baseFret: 1, frets: [-1, 1, 3, 3, 2, 1], label: 'Bareli (1. Perde)' },
    { baseFret: 6, frets: [6, 8, 8, 6, 6, 6], label: 'Bareli (6. Perde)' },
  ],
  'Bb7': [
    { baseFret: 1, frets: [-1, 1, 3, 1, 3, 1], label: 'Bareli 7li' },
    { baseFret: 6, frets: [6, 8, 6, 7, 6, 6], label: 'Bareli 7li' },
  ],
  'Bbm7': [
    { baseFret: 1, frets: [-1, 1, 3, 1, 2, 1], label: 'Bareli m7' },
  ],
  'Bbmaj7': [
    { baseFret: 1, frets: [-1, 1, 3, 2, 3, 1], label: 'Kök 5. Tel Maj7' },
    { baseFret: 6, frets: [6, -1, 7, 7, 6, -1], label: 'Caz Drop-2' },
  ],

  // ================= C / C# GRUBU =================
  'C': [
    { baseFret: 1, frets: [-1, 3, 2, 0, 1, 0], label: 'Açık Pozisyon' },
    { baseFret: 3, frets: [-1, 3, 5, 5, 5, 3], label: 'Bareli (3. Perde)' },
    { baseFret: 8, frets: [8, 10, 10, 9, 8, 8], label: 'Bareli (8. Perde)' },
  ],
  'Cm': [
    { baseFret: 3, frets: [-1, 3, 5, 5, 4, 3], label: 'Bareli (3. Perde)' },
    { baseFret: 8, frets: [8, 10, 10, 8, 8, 8], label: 'Bareli (8. Perde)' },
  ],
  'C7': [
    { baseFret: 1, frets: [-1, 3, 2, 3, 1, 0], label: 'Açık 7li' },
    { baseFret: 3, frets: [-1, 3, 5, 3, 5, 3], label: 'Bareli 7li' },
  ],
  'Cm7': [
    { baseFret: 3, frets: [-1, 3, 5, 3, 4, 3], label: 'Bareli m7' },
    { baseFret: 8, frets: [8, 10, 8, 8, 8, 8], label: 'Bareli m7' },
  ],
  'Cmaj7': [
    { baseFret: 1, frets: [-1, 3, 2, 0, 0, 0], label: 'Açık Maj7' },
    { baseFret: 3, frets: [-1, 3, 5, 4, 5, 3], label: 'Bareli Maj7' },
  ],
  'Cadd9': [{ baseFret: 1, frets: [-1, 3, 2, 0, 3, 0], label: 'Açık Add9' }],
  'Csus4': [{ baseFret: 1, frets: [-1, 3, 3, 0, 1, 0], label: 'Açık Sus4' }],
  'C/B': [
    { baseFret: 1, frets: [-1, 2, 2, 0, 1, 0], label: 'Bas B Yürüyüşü' },
    { baseFret: 1, frets: [-1, 2, 0, 0, 1, 0], label: 'Cadd9/B' },
  ],
  'C#': [{ baseFret: 4, frets: [-1, 4, 6, 6, 6, 4], label: 'Bareli (4. Perde)' }],
  'C#m': [{ baseFret: 4, frets: [-1, 4, 6, 6, 5, 4], label: 'Bareli (4. Perde)' }],
  'C#7': [{ baseFret: 4, frets: [-1, 4, 6, 4, 6, 4], label: 'Bareli 7li' }],
  'C#m7': [{ baseFret: 4, frets: [-1, 4, 6, 4, 5, 4], label: 'Bareli m7' }],

  // ================= D / D# / Eb GRUBU =================
  'D': [
    { baseFret: 1, frets: [-1, -1, 0, 2, 3, 2], label: 'Açık Pozisyon' },
    { baseFret: 5, frets: [-1, 5, 7, 7, 7, 5], label: 'Bareli (5. Perde)' },
  ],
  'Dm': [
    { baseFret: 1, frets: [-1, -1, 0, 2, 3, 1], label: 'Açık Pozisyon' },
    { baseFret: 5, frets: [-1, 5, 7, 7, 6, 5], label: 'Bareli (5. Perde)' },
  ],
  'D7': [
    { baseFret: 1, frets: [-1, -1, 0, 2, 1, 2], label: 'Açık 7li' },
    { baseFret: 5, frets: [-1, 5, 7, 5, 7, 5], label: 'Bareli 7li' },
  ],
  'Dm7': [
    { baseFret: 1, frets: [-1, -1, 0, 2, 1, 1], label: 'Açık m7' },
    { baseFret: 5, frets: [-1, 5, 7, 5, 6, 5], label: 'Bareli m7' },
  ],
  'Dmaj7': [{ baseFret: 1, frets: [-1, -1, 0, 2, 2, 2], label: 'Açık Maj7' }],
  'Dsus4': [{ baseFret: 1, frets: [-1, -1, 0, 2, 3, 3], label: 'Açık Sus4' }],
  'Dsus2': [{ baseFret: 1, frets: [-1, -1, 0, 2, 3, 0], label: 'Açık Sus2' }],
  'Eb': [{ baseFret: 6, frets: [-1, 6, 8, 8, 8, 6], label: 'Bareli (6. Perde)' }],
  'Ebm': [{ baseFret: 6, frets: [-1, 6, 8, 8, 7, 6], label: 'Bareli (6. Perde)' }],
  'Eb7': [{ baseFret: 6, frets: [-1, 6, 8, 6, 8, 6], label: 'Bareli 7li' }],
  'Ebmaj7': [{ baseFret: 6, frets: [-1, 6, 8, 7, 8, 6], label: 'Bareli Maj7' }],

  // ================= E GRUBU =================
  'E': [
    { baseFret: 1, frets: [0, 2, 2, 1, 0, 0], label: 'Açık Pozisyon' },
    { baseFret: 7, frets: [-1, 7, 9, 9, 9, 7], label: 'Bareli (7. Perde)' },
  ],
  'Em': [
    { baseFret: 1, frets: [0, 2, 2, 0, 0, 0], label: 'Açık Pozisyon' },
    { baseFret: 7, frets: [-1, 7, 9, 9, 8, 7], label: 'Bareli (7. Perde)' },
  ],
  'E7': [
    { baseFret: 1, frets: [0, 2, 0, 1, 0, 0], label: 'Açık 7li' },
    { baseFret: 7, frets: [-1, 7, 9, 7, 9, 7], label: 'Bareli 7li' },
  ],
  'Em7': [
    { baseFret: 1, frets: [0, 2, 0, 0, 0, 0], label: 'Açık m7' },
    { baseFret: 1, frets: [0, 2, 2, 0, 3, 0], label: 'Rock m7' },
    { baseFret: 7, frets: [-1, 7, 9, 7, 8, 7], label: 'Bareli m7' },
  ],
  'Emaj7': [{ baseFret: 1, frets: [0, 2, 1, 1, 0, 0], label: 'Açık Maj7' }],
  'E7(b9)': [
    { baseFret: 1, frets: [0, 2, 0, 1, 0, 1], label: 'Flamenko Açık Pozisyon' },
    { baseFret: 6, frets: [-1, 7, 6, 7, 6, -1], label: 'Kök 5. Tel Altered' },
  ],
  'E7b9': [
    { baseFret: 1, frets: [0, 2, 0, 1, 0, 1], label: 'Flamenko Açık Pozisyon' },
  ],
  'Esus4': [{ baseFret: 1, frets: [0, 2, 2, 2, 0, 0], label: 'Açık Sus4' }],

  // ================= F / F# GRUBU =================
  'F': [
    { baseFret: 1, frets: [1, 3, 3, 2, 1, 1], label: 'Tam Bareli' },
    { baseFret: 1, frets: [-1, -1, 3, 2, 1, 1], label: 'Küçük Bare' },
    { baseFret: 8, frets: [-1, 8, 10, 10, 10, 8], label: 'Bareli (8. Perde)' },
  ],
  'Fm': [
    { baseFret: 1, frets: [1, 3, 3, 1, 1, 1], label: 'Tam Bareli' },
    { baseFret: 8, frets: [-1, 8, 10, 10, 9, 8], label: 'Bareli (8. Perde)' },
  ],
  'F7': [
    { baseFret: 1, frets: [1, 3, 1, 2, 1, 1], label: 'Bareli 7li' },
    { baseFret: 8, frets: [-1, 8, 10, 8, 10, 8], label: 'Bareli 7li' },
  ],
  'Fm7': [
    { baseFret: 1, frets: [1, 3, 1, 1, 1, 1], label: 'Bareli m7' },
    { baseFret: 8, frets: [-1, 8, 10, 8, 9, 8], label: 'Bareli m7' },
  ],
  'Fmaj7': [
    { baseFret: 1, frets: [1, -1, 2, 2, 1, 0], label: 'Bossa & Akustik' },
    { baseFret: 1, frets: [-1, -1, 3, 2, 1, 0], label: 'Açık 4 Tel' },
  ],
  'Fmaj7(#11)': [
    { baseFret: 1, frets: [1, 3, 3, 2, 0, 0], label: 'Frigyen Açık Tel (#11)' },
  ],
  'F#': [
    { baseFret: 2, frets: [2, 4, 4, 3, 2, 2], label: 'Bareli (2. Perde)' },
    { baseFret: 9, frets: [-1, 9, 11, 11, 11, 9], label: 'Bareli (9. Perde)' },
  ],
  'F#m': [
    { baseFret: 2, frets: [2, 4, 4, 2, 2, 2], label: 'Bareli (2. Perde)' },
    { baseFret: 9, frets: [-1, 9, 11, 11, 10, 9], label: 'Bareli (9. Perde)' },
  ],
  'F#7': [
    { baseFret: 2, frets: [2, 4, 2, 3, 2, 2], label: 'Bareli 7li (2. Perde)' },
    { baseFret: 1, frets: [-1, -1, 4, 3, 2, 0], label: 'Açık Tını' },
    { baseFret: 9, frets: [-1, 9, 11, 9, 11, 9], label: 'Bareli 7li (9. Perde)' },
  ],
  'F#m7': [
    { baseFret: 2, frets: [2, 4, 2, 2, 2, 2], label: 'Bareli m7 (2. Perde)' },
    { baseFret: 9, frets: [-1, 9, 11, 9, 10, 9], label: 'Bareli m7 (9. Perde)' },
  ],
  'F#7(b9)': [
    { baseFret: 2, frets: [2, 4, 2, 3, 2, 3], label: 'Flamenko 7(b9) (2. Perde)' },
    { baseFret: 7, frets: [-1, 9, 8, 9, 8, -1], label: 'Caz Altered Voicing' },
  ],
  'F#7b9': [
    { baseFret: 2, frets: [2, 4, 2, 3, 2, 3], label: 'Flamenko 7(b9)' },
  ],

  // ================= G / G# / Ab GRUBU =================
  'G': [
    { baseFret: 1, frets: [3, 2, 0, 0, 0, 3], label: 'Açık Pozisyon' },
    { baseFret: 1, frets: [3, 2, 0, 0, 3, 3], label: 'Modern Rock G' },
    { baseFret: 3, frets: [3, 5, 5, 4, 3, 3], label: 'Bareli (3. Perde)' },
  ],
  'Gm': [
    { baseFret: 3, frets: [3, 5, 5, 3, 3, 3], label: 'Bareli (3. Perde)' },
    { baseFret: 10, frets: [-1, 10, 12, 12, 11, 10], label: 'Bareli (10. Perde)' },
  ],
  'G7': [
    { baseFret: 1, frets: [3, 2, 0, 0, 0, 1], label: 'Açık 7li' },
    { baseFret: 3, frets: [3, 5, 3, 4, 3, 3], label: 'Bareli 7li' },
  ],
  'Gm7': [
    { baseFret: 3, frets: [3, 5, 3, 3, 3, 3], label: 'Bareli m7 (3. Perde)' },
    { baseFret: 3, frets: [3, -1, 3, 3, 3, -1], label: 'Caz Drop-2' },
    { baseFret: 10, frets: [-1, 10, 12, 10, 11, 10], label: 'Bareli m7 (10. Perde)' },
  ],
  'Gmaj7': [
    { baseFret: 1, frets: [3, 2, 0, 0, 0, 2], label: 'Açık Maj7' },
    { baseFret: 3, frets: [3, -1, 4, 4, 3, -1], label: 'Caz Drop-2' },
  ],
  'Gsus4': [{ baseFret: 1, frets: [3, 3, 0, 0, 1, 3], label: 'Açık Sus4' }],
  'G#': [{ baseFret: 4, frets: [4, 6, 6, 5, 4, 4], label: 'Bareli (4. Perde)' }],
  'G#m': [{ baseFret: 4, frets: [4, 6, 6, 4, 4, 4], label: 'Bareli (4. Perde)' }],
  'G#7': [{ baseFret: 4, frets: [4, 6, 4, 5, 4, 4], label: 'Bareli 7li' }],
  'G#m7': [{ baseFret: 4, frets: [4, 6, 4, 4, 4, 4], label: 'Bareli m7' }],
  'Ab': [{ baseFret: 4, frets: [4, 6, 6, 5, 4, 4], label: 'Bareli (4. Perde)' }],
  'Abm': [{ baseFret: 4, frets: [4, 6, 6, 4, 4, 4], label: 'Bareli (4. Perde)' }],
  'Ab7': [{ baseFret: 4, frets: [4, 6, 4, 5, 4, 4], label: 'Bareli 7li' }],
  'Abmaj7': [{ baseFret: 4, frets: [4, -1, 5, 5, 4, -1], label: 'Caz Maj7' }],
};

/**
 * Akor ismini analiz edip tam veya en yakın gitar pozisyonlarını getiren akıllı arama motoru
 */
export function getChordVoicings(rawChord: string): ChordVoicing[] {
  if (!rawChord) return [];

  // 1. Temizle
  const clean = rawChord.replace(/[\[\]]/g, '').trim();

  // 2. Doğrudan Birebir Eşleşme (Örn: Bm7, F#7, F#7(b9))
  if (GUITAR_CHORDS_DB[clean]) {
    return GUITAR_CHORDS_DB[clean];
  }

  // 3. Bas Yürüyüşlü Akorlar (Örn: C/B -> C/B var mı? Yoksa C'ye bak)
  if (clean.includes('/')) {
    const [chordPart, bassNote] = clean.split('/');
    if (GUITAR_CHORDS_DB[clean]) {
      return GUITAR_CHORDS_DB[clean];
    }
    // Eğer C/B veritabanında yoksa ana akora bak (C)
    if (GUITAR_CHORDS_DB[chordPart]) {
      return GUITAR_CHORDS_DB[chordPart];
    }
  }

  // 4. Parantezli Gerilim/Altered Temizleme: F#7(b9) -> F#7, Am7(b5) -> Am7b5 veya Am7
  const noParens = clean.replace(/\((.*?)\)/g, '$1');
  if (GUITAR_CHORDS_DB[noParens]) {
    return GUITAR_CHORDS_DB[noParens];
  }

  // 5. Alterasyonu Atıp 7'li Çatıya İndirme: F#7(b9) -> F#7
  const baseSeven = clean.replace(/\([b#]?[0-9]+\)/g, '');
  if (GUITAR_CHORDS_DB[baseSeven]) {
    return GUITAR_CHORDS_DB[baseSeven];
  }

  // 6. Enharmonic Eşdeğerlik (Örn: C# -> Db, A#m -> Bbm)
  const enharmonicMap: Record<string, string> = {
    'A#': 'Bb', 'A#m': 'Bbm', 'A#7': 'Bb7', 'A#maj7': 'Bbmaj7',
    'C#': 'Db', 'C#m': 'Dbm', 'D#': 'Eb', 'D#m': 'Ebm',
    'F#': 'Gb', 'G#': 'Ab', 'G#m': 'Abm',
  };
  const alias = enharmonicMap[clean];
  if (alias && GUITAR_CHORDS_DB[alias]) {
    return GUITAR_CHORDS_DB[alias];
  }

  // 7. En Temel Kök Akora Fallback: Am7(b5) -> Am, Bm7 -> Bm
  const rootMatch = clean.match(/^([A-G][b#]?)(m|maj|dim|aug)?/);
  if (rootMatch && GUITAR_CHORDS_DB[rootMatch[0]]) {
    return GUITAR_CHORDS_DB[rootMatch[0]];
  }

  // 8. Saf Notaya Fallback: F#7 -> F#
  const pureRoot = clean.match(/^([A-G][b#]?)/);
  if (pureRoot && GUITAR_CHORDS_DB[pureRoot[0]]) {
    return GUITAR_CHORDS_DB[pureRoot[0]];
  }

  return [];
}