// src/utils/pianoDiagrams.ts

export interface PianoKey {
  note: string;
  isBlack: boolean;
  midi: number;
  active?: boolean;
}

// 2 Oktavlık Piyano Tuş Dizilimi (C3 - B4)
export const PIANO_KEYS_2_OCTAVES: PianoKey[] = [
  // 1. Oktav
  { note: 'C', isBlack: false, midi: 60 },
  { note: 'C#', isBlack: true, midi: 61 },
  { note: 'D', isBlack: false, midi: 62 },
  { note: 'D#', isBlack: true, midi: 63 },
  { note: 'E', isBlack: false, midi: 64 },
  { note: 'F', isBlack: false, midi: 65 },
  { note: 'F#', isBlack: true, midi: 66 },
  { note: 'G', isBlack: false, midi: 67 },
  { note: 'G#', isBlack: true, midi: 68 },
  { note: 'A', isBlack: false, midi: 69 },
  { note: 'A#', isBlack: true, midi: 70 },
  { note: 'B', isBlack: false, midi: 71 },
  // 2. Oktav
  { note: 'C', isBlack: false, midi: 72 },
  { note: 'C#', isBlack: true, midi: 73 },
  { note: 'D', isBlack: false, midi: 74 },
  { note: 'D#', isBlack: true, midi: 75 },
  { note: 'E', isBlack: false, midi: 76 },
  { note: 'F', isBlack: false, midi: 77 },
  { note: 'F#', isBlack: true, midi: 78 },
  { note: 'G', isBlack: false, midi: 79 },
  { note: 'G#', isBlack: true, midi: 80 },
  { note: 'A', isBlack: false, midi: 81 },
  { note: 'A#', isBlack: true, midi: 82 },
  { note: 'B', isBlack: false, midi: 83 },
];

const NOTE_TO_INDEX: { [key: string]: number } = {
  'C': 0, 'C#': 1, 'Db': 1,
  'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4,
  'F': 5, 'F#': 6, 'Gb': 6,
  'G': 7, 'G#': 8, 'Ab': 8,
  'A': 9, 'A#': 10, 'Bb': 10,
  'B': 11
};

// Akor Formülleri (Yarım Ton Aralıkları)
const CHORD_INTERVALS: { [key: string]: number[] } = {
  '': [0, 4, 7],         // Majör
  'M': [0, 4, 7],
  'm': [0, 3, 7],        // Minör
  'min': [0, 3, 7],
  '7': [0, 4, 7, 10],    // Dominant 7
  'm7': [0, 3, 7, 10],   // Minör 7
  'maj7': [0, 4, 7, 11], // Majör 7
  'dim': [0, 3, 6],      // Diminished
  'aug': [0, 4, 8],      // Augmented
  'sus4': [0, 5, 7],     // Sus4
  'sus2': [0, 2, 7]      // Sus2
};

export function getPianoKeysForChord(chordName: string): number[] {
  if (!chordName) return [];

  // Akor Kökü ve Tipini Ayır (Örn: C#m7 -> root: C#, type: m7)
  const match = chordName.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return [];

  const root = match[1];
  const type = match[2] || '';

  const rootIndex = NOTE_TO_INDEX[root];
  if (rootIndex === undefined) return [];

  const intervals = CHORD_INTERVALS[type] || CHORD_INTERVALS[''];

  // Notanın yarım ton indekslerini döndür (0 - 11 arası)
  return intervals.map(interval => (rootIndex + interval) % 12);
}