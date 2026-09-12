// src/utils/pianoDiagrams.ts

export interface PianoKey {
  note: string;
  isBlack: boolean;
  semitone: number; // 0 (C) .. 23 (B2)
}

export const PIANO_OCTAVE_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const PIANO_KEYS_2_OCTAVES: PianoKey[] = [
  // 1. Oktav (0-11)
  { note: 'C', isBlack: false, semitone: 0 },
  { note: 'C#', isBlack: true, semitone: 1 },
  { note: 'D', isBlack: false, semitone: 2 },
  { note: 'D#', isBlack: true, semitone: 3 },
  { note: 'E', isBlack: false, semitone: 4 },
  { note: 'F', isBlack: false, semitone: 5 },
  { note: 'F#', isBlack: true, semitone: 6 },
  { note: 'G', isBlack: false, semitone: 7 },
  { note: 'G#', isBlack: true, semitone: 8 },
  { note: 'A', isBlack: false, semitone: 9 },
  { note: 'A#', isBlack: true, semitone: 10 },
  { note: 'B', isBlack: false, semitone: 11 },

  // 2. Oktav (12-23)
  { note: 'C', isBlack: false, semitone: 12 },
  { note: 'C#', isBlack: true, semitone: 13 },
  { note: 'D', isBlack: false, semitone: 14 },
  { note: 'D#', isBlack: true, semitone: 15 },
  { note: 'E', isBlack: false, semitone: 16 },
  { note: 'F', isBlack: false, semitone: 17 },
  { note: 'F#', isBlack: true, semitone: 18 },
  { note: 'G', isBlack: false, semitone: 19 },
  { note: 'G#', isBlack: true, semitone: 20 },
  { note: 'A', isBlack: false, semitone: 21 },
  { note: 'A#', isBlack: true, semitone: 22 },
  { note: 'B', isBlack: false, semitone: 23 },
];

const NOTE_SEMITONES: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1,
  'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4,
  'F': 5, 'F#': 6, 'Gb': 6,
  'G': 7, 'G#': 8, 'Ab': 8,
  'A': 9, 'A#': 10, 'Bb': 10,
  'B': 11,
};

// Akor aralıkları (yarı ton farkları)
const CHORD_INTERVALS: Record<string, number[]> = {
  // Standart
  '': [0, 4, 7],                     // Majör
  'm': [0, 3, 7],                    // Minör
  '7': [0, 4, 7, 10],                // Dom 7
  'm7': [0, 3, 7, 10],               // Min 7
  'maj7': [0, 4, 7, 11],             // Maj 7
  
  // Altere / 7li Varyasyonları
  '7(b9)': [0, 4, 7, 10, 13],        // 7b9 (Flamenko / Caz)
  '7b9': [0, 4, 7, 10, 13],
  '7(#9)': [0, 4, 7, 10, 15],        // Hendrix chord
  '7#9': [0, 4, 7, 10, 15],
  '7(b5)': [0, 4, 6, 10],            // 7b5
  '7b5': [0, 4, 6, 10],
  
  // Eksilmiş / Yarı Eksilmiş
  'm7(b5)': [0, 3, 6, 10],           // Yarı eksilmiş (Half-Dim)
  'm7b5': [0, 3, 6, 10],
  'dim': [0, 3, 6],
  'dim7': [0, 3, 6, 9],
  
  // Genişletilmiş & Asılı
  '9': [0, 4, 7, 10, 14],            // Dom 9
  'm9': [0, 3, 7, 10, 14],           // Min 9
  'maj9': [0, 4, 7, 11, 14],         // Maj 9
  'add9': [0, 4, 7, 14],
  'madd9': [0, 3, 7, 14],
  '11': [0, 4, 7, 10, 14, 17],
  'm11': [0, 3, 7, 10, 14, 17],
  '13': [0, 4, 7, 10, 14, 21],
  '6/9': [0, 4, 7, 9, 14],
  'm6/9': [0, 3, 7, 9, 14],
  'sus4': [0, 5, 7],
  'sus2': [0, 2, 7],
  '7sus4': [0, 5, 7, 10],
};

export function getPianoKeysForChord(chordName: string): { activeSemitones: number[]; activeNoteNames: string[] } {
  if (!chordName) {
    return { activeSemitones: [0, 4, 7], activeNoteNames: ['C', 'E', 'G'] };
  }

  let clean = chordName.replace(/[\[\]]/g, '').trim();
  let slashBassNote: string | null = null;

  // 1. Slash/Bas Yürüyüşü Ayrıştırma (Örn: C/B -> Akor: C, Bas: B)
  if (clean.includes('/')) {
    const parts = clean.split('/');
    clean = parts[0];
    slashBassNote = parts[1];
  }

  // 2. Kök Nota ve Uzantıyı Çıkar
  const match = clean.match(/^([A-G][b#]?)(.*)$/);
  if (!match) {
    return { activeSemitones: [0, 4, 7], activeNoteNames: ['C', 'E', 'G'] };
  }

  const rootNote = match[1];
  let extension = match[2] || '';

  const rootSemitone = NOTE_SEMITONES[rootNote] ?? 0;

  // 3. Aralıkları Bul (Doğrudan veya Akıllı Eşleşme)
  let intervals = CHORD_INTERVALS[extension];

  if (!intervals) {
    // Parantezsiz dene: 7(b9) -> 7b9
    const noParens = extension.replace(/[\(\)]/g, '');
    if (CHORD_INTERVALS[noParens]) {
      intervals = CHORD_INTERVALS[noParens];
    } else if (extension.includes('m7b5') || extension.includes('m7(b5)')) {
      intervals = CHORD_INTERVALS['m7b5'];
    } else if (extension.startsWith('m') && !extension.startsWith('maj')) {
      intervals = extension.includes('7') ? CHORD_INTERVALS['m7'] : CHORD_INTERVALS['m'];
    } else if (extension.includes('maj7')) {
      intervals = CHORD_INTERVALS['maj7'];
    } else if (extension.includes('7')) {
      intervals = CHORD_INTERVALS['7'];
    } else {
      intervals = CHORD_INTERVALS[''];
    }
  }

  const activeSemitones: number[] = [];
  const activeNoteNames: string[] = [];

  // 4. Eğer Bas Yürüyüşü Varsa (Örn: C/B'deki B) 1. Oktav Pes Alana Ekle
  if (slashBassNote && NOTE_SEMITONES[slashBassNote] !== undefined) {
    const bassSemi = NOTE_SEMITONES[slashBassNote];
    activeSemitones.push(bassSemi);
    activeNoteNames.push(slashBassNote);
  }

  // 5. Akor Notalarını 2 Oktavlık Klavyeye Dağıt
  for (const interval of intervals) {
    // Kök ses slash basla aynıysa ve zaten eklendiyse atla
    const rawVal = rootSemitone + interval;
    const boundedVal = rawVal >= 24 ? rawVal % 24 : rawVal;
    const noteName = PIANO_OCTAVE_NOTES[boundedVal % 12];

    if (!activeSemitones.includes(boundedVal)) {
      activeSemitones.push(boundedVal);
      activeNoteNames.push(noteName);
    }
  }

  return { activeSemitones, activeNoteNames };
}