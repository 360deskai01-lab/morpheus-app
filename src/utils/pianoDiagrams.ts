// src/utils/pianoDiagrams.ts

export interface PianoKeyInfo {
    semitone: number; // 0..23 (2 oktav)
    note: string;
    isBlack: boolean;
  }
  
  export const PIANO_KEYS_2_OCTAVES: PianoKeyInfo[] = [
    { semitone: 0, note: 'C', isBlack: false },
    { semitone: 1, note: 'C#', isBlack: true },
    { semitone: 2, note: 'D', isBlack: false },
    { semitone: 3, note: 'D#', isBlack: true },
    { semitone: 4, note: 'E', isBlack: false },
    { semitone: 5, note: 'F', isBlack: false },
    { semitone: 6, note: 'F#', isBlack: true },
    { semitone: 7, note: 'G', isBlack: false },
    { semitone: 8, note: 'G#', isBlack: true },
    { semitone: 9, note: 'A', isBlack: false },
    { semitone: 10, note: 'A#', isBlack: true },
    { semitone: 11, note: 'B', isBlack: false },
    { semitone: 12, note: 'C', isBlack: false },
    { semitone: 13, note: 'C#', isBlack: true },
    { semitone: 14, note: 'D', isBlack: false },
    { semitone: 15, note: 'D#', isBlack: true },
    { semitone: 16, note: 'E', isBlack: false },
    { semitone: 17, note: 'F', isBlack: false },
    { semitone: 18, note: 'F#', isBlack: true },
    { semitone: 19, note: 'G', isBlack: false },
    { semitone: 20, note: 'G#', isBlack: true },
    { semitone: 21, note: 'A', isBlack: false },
    { semitone: 22, note: 'A#', isBlack: true },
    { semitone: 23, note: 'B', isBlack: false },
  ];
  
  const ROOT_SEMITONES: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1,
    'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6,
    'G': 7, 'G#': 8, 'Ab': 8,
    'A': 9, 'A#': 10, 'Bb': 10,
    'B': 11,
  };
  
  export function getPianoKeysForChord(chordName: string): {
    activeSemitones: number[];
    activeNoteNames: string[];
  } {
    if (!chordName) return { activeSemitones: [], activeNoteNames: [] };
    const clean = chordName.replace(/[\[\]]/g, '').trim().split('/')[0];
  
    const match = clean.match(/^([A-G][#b]?)(.*)$/);
    if (!match) return { activeSemitones: [], activeNoteNames: [] };
  
    const root = match[1];
    const quality = match[2];
    const rootOffset = ROOT_SEMITONES[root] ?? 0;
  
    let intervals = [0, 4, 7]; // Varsayılan Majör
  
    if (quality.startsWith('m') && !quality.startsWith('maj')) {
      intervals = [0, 3, 7]; // Minör
    } else if (quality.includes('7') && !quality.includes('maj7')) {
      intervals = quality.startsWith('m') ? [0, 3, 7, 10] : [0, 4, 7, 10]; // Dominant 7 / m7
    } else if (quality.includes('maj7')) {
      intervals = [0, 4, 7, 11]; // Maj7
    } else if (quality.includes('dim')) {
      intervals = [0, 3, 6]; // Diminished
    } else if (quality.includes('sus4')) {
      intervals = [0, 5, 7]; // Sus4
    } else if (quality.includes('sus2')) {
      intervals = [0, 2, 7]; // Sus2
    }
  
    const activeSemitones = intervals.map((iv) => (rootOffset + iv) % 12);
    const activeNoteNames = intervals.map((iv) => {
      const key = PIANO_KEYS_2_OCTAVES[(rootOffset + iv) % 12];
      return key ? key.note : '';
    });
  
    return { activeSemitones, activeNoteNames };
  }