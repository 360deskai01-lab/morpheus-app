// src/utils/bassDiagrams.ts

export interface BassTone {
    stringIdx: number; // 0: E, 1: A, 2: D, 3: G
    fret: number;
    interval: string;  // 'R' (Root), '3', 'b3', '5', 'b7', '7'
    isRoot: boolean;
  }
  
  export interface BassVoicing {
    frets: number[]; // 4 tel: [E, A, D, G]
    baseFret: number;
    label: string;
    chordTones: BassTone[];
  }
  
  export const BASS_CHORD_DATABASE: Record<string, BassVoicing[]> = {
    'Am': [
      {
        frets: [5, 7, 7, 5],
        baseFret: 5,
        label: '5. Perde Kök Pozisyonu',
        chordTones: [
          { stringIdx: 0, fret: 5, interval: 'R', isRoot: true },
          { stringIdx: 1, fret: 7, interval: '5', isRoot: false },
          { stringIdx: 2, fret: 7, interval: 'R', isRoot: true },
          { stringIdx: 3, fret: 5, interval: 'b3', isRoot: false },
        ],
      },
    ],
    'A': [
      {
        frets: [5, 7, 7, 6],
        baseFret: 5,
        label: '5. Perde Majör Arpej',
        chordTones: [
          { stringIdx: 0, fret: 5, interval: 'R', isRoot: true },
          { stringIdx: 1, fret: 7, interval: '5', isRoot: false },
          { stringIdx: 2, fret: 7, interval: 'R', isRoot: true },
          { stringIdx: 3, fret: 6, interval: '3', isRoot: false },
        ],
      },
    ],
    'C': [
      {
        frets: [-1, 3, 2, 5],
        baseFret: 2,
        label: '3. Perde A-Teli Kökü',
        chordTones: [
          { stringIdx: 1, fret: 3, interval: 'R', isRoot: true },
          { stringIdx: 2, fret: 2, interval: '3', isRoot: false },
          { stringIdx: 3, fret: 5, interval: '5', isRoot: false },
        ],
      },
    ],
    'Dm': [
      {
        frets: [-1, 5, 7, 7],
        baseFret: 5,
        label: '5. Perde Minör Kökü',
        chordTones: [
          { stringIdx: 1, fret: 5, interval: 'R', isRoot: true },
          { stringIdx: 2, fret: 7, interval: '5', isRoot: false },
          { stringIdx: 3, fret: 7, interval: 'R', isRoot: true },
        ],
      },
    ],
    'Em': [
      {
        frets: [0, 2, 2, 0],
        baseFret: 1,
        label: 'Açık Pozisyon',
        chordTones: [
          { stringIdx: 0, fret: 0, interval: 'R', isRoot: true },
          { stringIdx: 1, fret: 2, interval: '5', isRoot: false },
          { stringIdx: 2, fret: 2, interval: 'R', isRoot: true },
          { stringIdx: 3, fret: 0, interval: 'b3', isRoot: false },
        ],
      },
    ],
    'E': [
      {
        frets: [0, 2, 2, 1],
        baseFret: 1,
        label: 'Açık Majör',
        chordTones: [
          { stringIdx: 0, fret: 0, interval: 'R', isRoot: true },
          { stringIdx: 1, fret: 2, interval: '5', isRoot: false },
          { stringIdx: 2, fret: 2, interval: 'R', isRoot: true },
          { stringIdx: 3, fret: 1, interval: '3', isRoot: false },
        ],
      },
    ],
    'F': [
      {
        frets: [1, 3, 3, 2],
        baseFret: 1,
        label: '1. Perde Majör',
        chordTones: [
          { stringIdx: 0, fret: 1, interval: 'R', isRoot: true },
          { stringIdx: 1, fret: 3, interval: '5', isRoot: false },
          { stringIdx: 2, fret: 3, interval: 'R', isRoot: true },
          { stringIdx: 3, fret: 2, interval: '3', isRoot: false },
        ],
      },
    ],
    'G': [
      {
        frets: [3, 5, 5, 4],
        baseFret: 3,
        label: '3. Perde Majör',
        chordTones: [
          { stringIdx: 0, fret: 3, interval: 'R', isRoot: true },
          { stringIdx: 1, fret: 5, interval: '5', isRoot: false },
          { stringIdx: 2, fret: 5, interval: 'R', isRoot: true },
          { stringIdx: 3, fret: 4, interval: '3', isRoot: false },
        ],
      },
    ],
    'Bm': [
      {
        frets: [-1, 2, 4, 4],
        baseFret: 2,
        label: '2. Perde Minör',
        chordTones: [
          { stringIdx: 1, fret: 2, interval: 'R', isRoot: true },
          { stringIdx: 2, fret: 4, interval: '5', isRoot: false },
          { stringIdx: 3, fret: 4, interval: 'R', isRoot: true },
        ],
      },
    ],
  };
  
  export function getBassVoicings(chordName: string): BassVoicing[] {
    if (!chordName) return [];
    const clean = chordName.replace(/[\[\]]/g, '').trim();
  
    if (BASS_CHORD_DATABASE[clean]) {
      return BASS_CHORD_DATABASE[clean];
    }
  
    const rootOnly = clean.split('/')[0];
    if (BASS_CHORD_DATABASE[rootOnly]) {
      return BASS_CHORD_DATABASE[rootOnly];
    }
  
    return [];
  }