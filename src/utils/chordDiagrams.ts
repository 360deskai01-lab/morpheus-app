// src/utils/chordDiagrams.ts

export interface ChordVoicing {
    frets: number[]; // 6 tel: [E, A, D, G, B, e], -1: çalınmaz, 0: boş tel
    baseFret: number;
    barres?: number[];
    label?: string;
  }
  
  export const GUITAR_CHORD_DATABASE: Record<string, ChordVoicing[]> = {
    // Temel Majör ve Minör Akorlar
    'Am': [
      { frets: [-1, 0, 2, 2, 1, 0], baseFret: 1, label: 'Açık Pozisyon' },
      { frets: [5, 7, 7, 5, 5, 5], baseFret: 5, barres: [5], label: '5. Perde Bareli' },
    ],
    'A': [
      { frets: [-1, 0, 2, 2, 2, 0], baseFret: 1, label: 'Açık Pozisyon' },
      { frets: [5, 7, 7, 6, 5, 5], baseFret: 5, barres: [5], label: '5. Perde Bareli' },
    ],
    'A7': [
      { frets: [-1, 0, 2, 0, 2, 0], baseFret: 1, label: 'Açık Pozisyon' },
      { frets: [5, 7, 5, 6, 5, 5], baseFret: 5, barres: [5], label: '5. Perde Bareli' },
    ],
    'C': [
      { frets: [-1, 3, 2, 0, 1, 0], baseFret: 1, label: 'Açık Pozisyon' },
      { frets: [8, 10, 10, 9, 8, 8], baseFret: 8, barres: [8], label: '8. Perde Bareli' },
    ],
    'C7': [
      { frets: [-1, 3, 2, 3, 1, 0], baseFret: 1, label: 'Açık Pozisyon' },
    ],
    'Dm': [
      { frets: [-1, -1, 0, 2, 3, 1], baseFret: 1, label: 'Açık Pozisyon' },
      { frets: [10, 12, 12, 10, 10, 10], baseFret: 10, barres: [10], label: '10. Perde Bareli' },
    ],
    'D': [
      { frets: [-1, -1, 0, 2, 3, 2], baseFret: 1, label: 'Açık Pozisyon' },
      { frets: [10, 12, 12, 11, 10, 10], baseFret: 10, barres: [10], label: '10. Perde Bareli' },
    ],
    'D7': [
      { frets: [-1, -1, 0, 2, 1, 2], baseFret: 1, label: 'Açık Pozisyon' },
    ],
    'Em': [
      { frets: [0, 2, 2, 0, 0, 0], baseFret: 1, label: 'Açık Pozisyon' },
      { frets: [7, 9, 9, 8, 7, 7], baseFret: 7, barres: [7], label: '7. Perde Bareli' },
    ],
    'E': [
      { frets: [0, 2, 2, 1, 0, 0], baseFret: 1, label: 'Açık Pozisyon' },
      { frets: [7, 9, 9, 9, 7, 7], baseFret: 7, barres: [7], label: '7. Perde Bareli' },
    ],
    'E7': [
      { frets: [0, 2, 0, 1, 0, 0], baseFret: 1, label: 'Açık Pozisyon' },
    ],
    'F': [
      { frets: [1, 3, 3, 2, 1, 1], baseFret: 1, barres: [1], label: '1. Perde Bareli' },
      { frets: [-1, 8, 10, 10, 10, 8], baseFret: 8, barres: [8], label: '8. Perde Bareli' },
    ],
    'Fm': [
      { frets: [1, 3, 3, 1, 1, 1], baseFret: 1, barres: [1], label: '1. Perde Bareli' },
    ],
    'F#m': [
      { frets: [2, 4, 4, 2, 2, 2], baseFret: 2, barres: [2], label: '2. Perde Bareli' },
    ],
    'F#': [
      { frets: [2, 4, 4, 3, 2, 2], baseFret: 2, barres: [2], label: '2. Perde Bareli' },
    ],
    'G': [
      { frets: [3, 2, 0, 0, 0, 3], baseFret: 1, label: 'Açık Pozisyon' },
      { frets: [3, 5, 5, 4, 3, 3], baseFret: 3, barres: [3], label: '3. Perde Bareli' },
    ],
    'Gm': [
      { frets: [3, 5, 5, 3, 3, 3], baseFret: 3, barres: [3], label: '3. Perde Bareli' },
    ],
    'G7': [
      { frets: [3, 2, 0, 0, 0, 1], baseFret: 1, label: 'Açık Pozisyon' },
    ],
    'Bm': [
      { frets: [-1, 2, 4, 4, 3, 2], baseFret: 2, barres: [2], label: '2. Perde Bareli' },
      { frets: [7, 9, 9, 7, 7, 7], baseFret: 7, barres: [7], label: '7. Perde Bareli' },
    ],
    'B': [
      { frets: [-1, 2, 4, 4, 4, 2], baseFret: 2, barres: [2], label: '2. Perde Bareli' },
      { frets: [7, 9, 9, 8, 7, 7], baseFret: 7, barres: [7], label: '7. Perde Bareli' },
    ],
    'B7': [
      { frets: [-1, 2, 1, 2, 0, 2], baseFret: 1, label: 'Açık Pozisyon' },
    ],
    'Bb': [
      { frets: [-1, 1, 3, 3, 3, 1], baseFret: 1, barres: [1], label: '1. Perde Bareli' },
    ],
    'Bbm': [
      { frets: [-1, 1, 3, 3, 2, 1], baseFret: 1, barres: [1], label: '1. Perde Bareli' },
    ],
  };
  
  export function getChordVoicings(chordName: string): ChordVoicing[] {
    if (!chordName) return [];
    const clean = chordName.replace(/[\[\]]/g, '').trim();
  
    if (GUITAR_CHORD_DATABASE[clean]) {
      return GUITAR_CHORD_DATABASE[clean];
    }
  
    // Slash akorlar için kök sesi dene (Örn: Am/G -> Am)
    const rootOnly = clean.split('/')[0];
    if (GUITAR_CHORD_DATABASE[rootOnly]) {
      return GUITAR_CHORD_DATABASE[rootOnly];
    }
  
    return [];
  }