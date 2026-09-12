// src/utils/bassDiagrams.ts

export interface BassTone {
  stringIdx: number; // 0: E, 1: A, 2: D, 3: G
  fret: number;      // 0..12
  interval: string;  // 'R' (Root), '3', 'b3', '5', 'b5', '7', 'b7', 'b9'
  isRoot: boolean;
}

export interface BassVoicing {
  baseFret: number;
  chordTones: BassTone[];
  label?: string;
}

export const BASS_CHORDS_DB: Record<string, BassVoicing[]> = {
  // ================= A GRUBU =================
  'A': [
    {
      baseFret: 1,
      chordTones: [
        { stringIdx: 1, fret: 0, interval: 'R', isRoot: true },
        { stringIdx: 2, fret: 2, interval: '5', isRoot: false },
        { stringIdx: 3, fret: 2, interval: '3', isRoot: false },
      ],
      label: 'Açık Pozisyon',
    },
    {
      baseFret: 5,
      chordTones: [
        { stringIdx: 0, fret: 5, interval: 'R', isRoot: true },
        { stringIdx: 1, fret: 4, interval: '3', isRoot: false },
        { stringIdx: 2, fret: 7, interval: '5', isRoot: false },
      ],
      label: '5. Perde Kök',
    },
  ],
  'Am': [
    {
      baseFret: 1,
      chordTones: [
        { stringIdx: 1, fret: 0, interval: 'R', isRoot: true },
        { stringIdx: 2, fret: 2, interval: '5', isRoot: false },
        { stringIdx: 3, fret: 2, interval: 'b3', isRoot: false },
      ],
      label: 'Açık Minör',
    },
    {
      baseFret: 5,
      chordTones: [
        { stringIdx: 0, fret: 5, interval: 'R', isRoot: true },
        { stringIdx: 1, fret: 3, interval: 'b3', isRoot: false },
        { stringIdx: 2, fret: 7, interval: '5', isRoot: false },
      ],
      label: '5. Perde Minör',
    },
  ],
  'Am7': [
    {
      baseFret: 5,
      chordTones: [
        { stringIdx: 0, fret: 5, interval: 'R', isRoot: true },
        { stringIdx: 1, fret: 3, interval: 'b3', isRoot: false },
        { stringIdx: 2, fret: 5, interval: 'b7', isRoot: false },
      ],
      label: 'm7 Pozisyonu',
    },
  ],
  'Am7(b5)': [
    {
      baseFret: 5,
      chordTones: [
        { stringIdx: 0, fret: 5, interval: 'R', isRoot: true },
        { stringIdx: 1, fret: 6, interval: 'b5', isRoot: false },
        { stringIdx: 2, fret: 5, interval: 'b7', isRoot: false },
      ],
      label: 'Yarı Eksilmiş Bas',
    },
  ],
  'Am7b5': [
    {
      baseFret: 5,
      chordTones: [
        { stringIdx: 0, fret: 5, interval: 'R', isRoot: true },
        { stringIdx: 1, fret: 6, interval: 'b5', isRoot: false },
        { stringIdx: 2, fret: 5, interval: 'b7', isRoot: false },
      ],
      label: 'Yarı Eksilmiş Bas',
    },
  ],

  // ================= B / Bb GRUBU =================
  'B': [
    {
      baseFret: 2,
      chordTones: [
        { stringIdx: 1, fret: 2, interval: 'R', isRoot: true },
        { stringIdx: 2, fret: 4, interval: '5', isRoot: false },
        { stringIdx: 3, fret: 4, interval: '3', isRoot: false },
      ],
      label: '2. Perde Majör',
    },
  ],
  'Bm': [
    {
      baseFret: 2,
      chordTones: [
        { stringIdx: 1, fret: 2, interval: 'R', isRoot: true },
        { stringIdx: 2, fret: 4, interval: '5', isRoot: false },
        { stringIdx: 3, fret: 4, interval: 'b3', isRoot: false },
      ],
      label: '2. Perde Minör',
    },
    {
      baseFret: 7,
      chordTones: [
        { stringIdx: 0, fret: 7, interval: 'R', isRoot: true },
        { stringIdx: 1, fret: 5, interval: 'b3', isRoot: false },
        { stringIdx: 2, fret: 9, interval: '5', isRoot: false },
      ],
      label: '7. Perde Kök',
    },
  ],
  'Bm7': [
    {
      baseFret: 2,
      chordTones: [
        { stringIdx: 1, fret: 2, interval: 'R', isRoot: true },
        { stringIdx: 2, fret: 0, interval: 'b7', isRoot: false },
        { stringIdx: 3, fret: 4, interval: 'b3', isRoot: false },
      ],
      label: '2. Perde m7',
    },
    {
      baseFret: 7,
      chordTones: [
        { stringIdx: 0, fret: 7, interval: 'R', isRoot: true },
        { stringIdx: 1, fret: 5, interval: 'b3', isRoot: false },
        { stringIdx: 2, fret: 7, interval: 'b7', isRoot: false },
      ],
      label: '7. Perde m7',
    },
  ],
  'Bm7(b5)': [
    {
      baseFret: 2,
      chordTones: [
        { stringIdx: 1, fret: 2, interval: 'R', isRoot: true },
        { stringIdx: 2, fret: 3, interval: 'b5', isRoot: false },
        { stringIdx: 3, fret: 2, interval: 'b7', isRoot: false },
      ],
      label: 'Bm7b5 Bas',
    },
  ],
  'Bb': [
    {
      baseFret: 1,
      chordTones: [
        { stringIdx: 1, fret: 1, interval: 'R', isRoot: true },
        { stringIdx: 2, fret: 3, interval: '5', isRoot: false },
      ],
      label: '1. Perde',
    },
  ],
  'Bbm': [
    {
      baseFret: 1,
      chordTones: [
        { stringIdx: 1, fret: 1, interval: 'R', isRoot: true },
        { stringIdx: 2, fret: 3, interval: '5', isRoot: false },
        { stringIdx: 3, fret: 3, interval: 'b3', isRoot: false },
      ],
      label: '1. Perde Minör',
    },
  ],

  // ================= C GRUBU =================
  'C': [
    {
      baseFret: 1,
      chordTones: [
        { stringIdx: 1, fret: 3, interval: 'R', isRoot: true },
        { stringIdx: 2, fret: 2, interval: '3', isRoot: false },
        { stringIdx: 3, fret: 0, interval: '5', isRoot: false },
      ],
      label: 'Açık / 3. Perde',
    },
  ],
  'C/B': [
    {
      baseFret: 1,
      chordTones: [
        { stringIdx: 1, fret: 2, interval: 'R', isRoot: true }, // Bas B notasında
        { stringIdx: 2, fret: 2, interval: '3', isRoot: false },
        { stringIdx: 3, fret: 0, interval: '5', isRoot: false },
      ],
      label: 'B Bas Yürüyüşü',
    },
  ],
  'Cm': [
    {
      baseFret: 3,
      chordTones: [
        { stringIdx: 1, fret: 3, interval: 'R', isRoot: true },
        { stringIdx: 2, fret: 1, interval: 'b3', isRoot: false },
        { stringIdx: 3, fret: 5, interval: '5', isRoot: false },
      ],
      label: '3. Perde Minör',
    },
  ],
  'C7': [
    {
      baseFret: 3,
      chordTones: [
        { stringIdx: 1, fret: 3, interval: 'R', isRoot: true },
        { stringIdx: 2, fret: 2, interval: '3', isRoot: false },
        { stringIdx: 3, fret: 3, interval: 'b7', isRoot: false },
      ],
      label: 'Dominant 7',
    },
  ],

  // ================= D GRUBU =================
  'D': [
    {
      baseFret: 1,
      chordTones: [
        { stringIdx: 2, fret: 0, interval: 'R', isRoot: true },
        { stringIdx: 3, fret: 2, interval: '5', isRoot: false },
      ],
      label: 'Açık D',
    },
    {
      baseFret: 5,
      chordTones: [
        { stringIdx: 1, fret: 5, interval: 'R', isRoot: true },
        { stringIdx: 2, fret: 4, interval: '3', isRoot: false },
        { stringIdx: 3, fret: 7, interval: '5', isRoot: false },
      ],
      label: '5. Perde Kök',
    },
  ],
  'Dm': [
    {
      baseFret: 1,
      chordTones: [
        { stringIdx: 2, fret: 0, interval: 'R', isRoot: true },
        { stringIdx: 3, fret: 2, interval: '5', isRoot: false },
      ],
      label: 'Açık Dm',
    },
    {
      baseFret: 5,
      chordTones: [
        { stringIdx: 1, fret: 5, interval: 'R', isRoot: true },
        { stringIdx: 2, fret: 3, interval: 'b3', isRoot: false },
        { stringIdx: 3, fret: 7, interval: '5', isRoot: false },
      ],
      label: '5. Perde Dm',
    },
  ],

  // ================= E GRUBU =================
  'E': [
    {
      baseFret: 1,
      chordTones: [
        { stringIdx: 0, fret: 0, interval: 'R', isRoot: true },
        { stringIdx: 1, fret: 2, interval: '5', isRoot: false },
        { stringIdx: 2, fret: 2, interval: 'R', isRoot: false },
      ],
      label: 'Açık Tel',
    },
  ],
  'Em': [
    {
      baseFret: 1,
      chordTones: [
        { stringIdx: 0, fret: 0, interval: 'R', isRoot: true },
        { stringIdx: 1, fret: 2, interval: '5', isRoot: false },
      ],
      label: 'Açık Minör',
    },
  ],
  'E7': [
    {
      baseFret: 1,
      chordTones: [
        { stringIdx: 0, fret: 0, interval: 'R', isRoot: true },
        { stringIdx: 2, fret: 0, interval: 'b7', isRoot: false },
        { stringIdx: 3, fret: 1, interval: '3', isRoot: false },
      ],
      label: 'Açık 7li',
    },
  ],

  // ================= F / F# GRUBU =================
  'F': [
    {
      baseFret: 1,
      chordTones: [
        { stringIdx: 0, fret: 1, interval: 'R', isRoot: true },
        { stringIdx: 1, fret: 3, interval: '5', isRoot: false },
      ],
      label: '1. Perde',
    },
  ],
  'F#': [
    {
      baseFret: 2,
      chordTones: [
        { stringIdx: 0, fret: 2, interval: 'R', isRoot: true },
        { stringIdx: 1, fret: 4, interval: '5', isRoot: false },
      ],
      label: '2. Perde',
    },
  ],
  'F#m': [
    {
      baseFret: 2,
      chordTones: [
        { stringIdx: 0, fret: 2, interval: 'R', isRoot: true },
        { stringIdx: 1, fret: 0, interval: 'b3', isRoot: false },
        { stringIdx: 2, fret: 4, interval: '5', isRoot: false },
      ],
      label: '2. Perde Minör',
    },
  ],
  'F#7': [
    {
      baseFret: 2,
      chordTones: [
        { stringIdx: 0, fret: 2, interval: 'R', isRoot: true },
        { stringIdx: 1, fret: 1, interval: '3', isRoot: false },
        { stringIdx: 2, fret: 2, interval: 'b7', isRoot: false },
      ],
      label: '2. Perde 7li',
    },
  ],
  'F#7(b9)': [
    {
      baseFret: 2,
      chordTones: [
        { stringIdx: 0, fret: 2, interval: 'R', isRoot: true },
        { stringIdx: 1, fret: 1, interval: '3', isRoot: false },
        { stringIdx: 2, fret: 2, interval: 'b7', isRoot: false },
        { stringIdx: 3, fret: 0, interval: 'b9', isRoot: false },
      ],
      label: 'Flamenko Altered Bas',
    },
  ],
  'F#7b9': [
    {
      baseFret: 2,
      chordTones: [
        { stringIdx: 0, fret: 2, interval: 'R', isRoot: true },
        { stringIdx: 1, fret: 1, interval: '3', isRoot: false },
        { stringIdx: 2, fret: 2, interval: 'b7', isRoot: false },
      ],
      label: '7b9 Bas',
    },
  ],

  // ================= G GRUBU =================
  'G': [
    {
      baseFret: 1,
      chordTones: [
        { stringIdx: 0, fret: 3, interval: 'R', isRoot: true },
        { stringIdx: 1, fret: 2, interval: '3', isRoot: false },
        { stringIdx: 2, fret: 0, interval: '5', isRoot: false },
      ],
      label: '3. Perde G',
    },
  ],
  'G7': [
    {
      baseFret: 1,
      chordTones: [
        { stringIdx: 0, fret: 3, interval: 'R', isRoot: true },
        { stringIdx: 1, fret: 2, interval: '3', isRoot: false },
        { stringIdx: 2, fret: 3, interval: 'b7', isRoot: false },
      ],
      label: 'Açık 7li G',
    },
  ],
  'Gm': [
    {
      baseFret: 3,
      chordTones: [
        { stringIdx: 0, fret: 3, interval: 'R', isRoot: true },
        { stringIdx: 1, fret: 1, interval: 'b3', isRoot: false },
        { stringIdx: 2, fret: 5, interval: '5', isRoot: false },
      ],
      label: '3. Perde Minör',
    },
  ],
};

/**
 * Akor adını analiz ederek bas gitar şemasını getiren akıllı arama motoru
 */
export function getBassVoicings(rawChord: string): BassVoicing[] {
  if (!rawChord) return [];

  const clean = rawChord.replace(/[\[\]]/g, '').trim();

  // 1. Doğrudan Eşleşme
  if (BASS_CHORDS_DB[clean]) {
    return BASS_CHORDS_DB[clean];
  }

  // 2. Bas Yürüyüşü (Örn: C/B -> C/B var mı? Yoksa B bas notasına veya C akoruna bak)
  if (clean.includes('/')) {
    const [chordPart, bassPart] = clean.split('/');
    if (BASS_CHORDS_DB[clean]) return BASS_CHORDS_DB[clean];
    if (BASS_CHORDS_DB[bassPart]) return BASS_CHORDS_DB[bassPart];
    if (BASS_CHORDS_DB[chordPart]) return BASS_CHORDS_DB[chordPart];
  }

  // 3. Parantezleri Temizle: F#7(b9) -> F#7b9
  const noParens = clean.replace(/\((.*?)\)/g, '$1');
  if (BASS_CHORDS_DB[noParens]) {
    return BASS_CHORDS_DB[noParens];
  }

  // 4. Alterasyonları Atıp 7'li Gövdeye Dön: F#7(b9) -> F#7
  const baseSeven = clean.replace(/\([b#]?[0-9]+\)/g, '');
  if (BASS_CHORDS_DB[baseSeven]) {
    return BASS_CHORDS_DB[baseSeven];
  }

  // 5. Temel Kök Akora Fallback: Bm7 -> Bm, Am7(b5) -> Am
  const rootMatch = clean.match(/^([A-G][b#]?)(m|maj|dim|aug)?/);
  if (rootMatch && BASS_CHORDS_DB[rootMatch[0]]) {
    return BASS_CHORDS_DB[rootMatch[0]];
  }

  // 6. Saf Notaya Fallback: F#7 -> F#
  const pureRoot = clean.match(/^([A-G][b#]?)/);
  if (pureRoot && BASS_CHORDS_DB[pureRoot[0]]) {
    return BASS_CHORDS_DB[pureRoot[0]];
  }

  return [];
}