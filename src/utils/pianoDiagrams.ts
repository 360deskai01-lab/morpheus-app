// src/utils/pianoDiagrams.ts

export interface PianoKey {
  note: string;
  isBlack: boolean;
  midi: number;
  active?: boolean;
}

export const PIANO_KEYS_2_OCTAVES: PianoKey[] = [
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
  C: 0, 'B#': 0,
  'C#': 1, Db: 1,
  D: 2,
  'D#': 3, Eb: 3,
  E: 4, Fb: 4,
  F: 5, 'E#': 5,
  'F#': 6, Gb: 6,
  G: 7,
  'G#': 8, Ab: 8,
  A: 9,
  'A#': 10, Bb: 10,
  B: 11, Cb: 11,
};

const CHORD_INTERVALS: { [key: string]: number[] } = {
  '': [0, 4, 7],
  M: [0, 4, 7],
  maj: [0, 4, 7],
  m: [0, 3, 7],
  min: [0, 3, 7],
  mi: [0, 3, 7],
  '5': [0, 7],
  '6': [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  '7': [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  min7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
  M7: [0, 4, 7, 11],
  mmaj7: [0, 3, 7, 11],
  mMaj7: [0, 3, 7, 11],
  dim: [0, 3, 6],
  dim7: [0, 3, 6, 9],
  o: [0, 3, 6],
  o7: [0, 3, 6, 9],
  aug: [0, 4, 8],
  '+': [0, 4, 8],
  aug7: [0, 4, 8, 10],
  sus: [0, 5, 7],
  sus4: [0, 5, 7],
  sus2: [0, 2, 7],
  add9: [0, 4, 7, 2],
  add2: [0, 4, 7, 2],
  '9': [0, 4, 7, 10, 2],
  m9: [0, 3, 7, 10, 2],
  maj9: [0, 4, 7, 11, 2],
  '11': [0, 4, 7, 10, 5],
  '13': [0, 4, 7, 10, 9],
  m7b5: [0, 3, 6, 10],
  'm7(b5)': [0, 3, 6, 10],
  ø: [0, 3, 6, 10],
  '2': [0, 2, 4, 7],
};

function normalizeQuality(raw: string): string {
  const q = raw.replace(/[()]/g, '').trim();
  if (!q) return '';
  if (CHORD_INTERVALS[q]) return q;
  const lower = q.toLowerCase();
  if (lower === 'maj') return 'maj';
  if (lower === 'min' || lower === 'mi') return 'm';
  if (CHORD_INTERVALS[lower]) return lower;
  return q;
}

export function getPianoKeysForChord(chordName: string): number[] {
  if (!chordName) return [];

  const token = chordName.split('/')[0].trim();
  const match = token.match(/^([A-G][b#]?)(.*)$/);
  if (!match) return [];

  const rootIndex = NOTE_TO_INDEX[match[1]];
  if (rootIndex === undefined) return [];

  const intervals = CHORD_INTERVALS[normalizeQuality(match[2])] || CHORD_INTERVALS[''];
  return Array.from(new Set(intervals.map((interval) => (rootIndex + interval) % 12)));
}
