// src/utils/chordEngine.ts

export const CHROMATIC_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const CHROMATIC_FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const ALL_TONES = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dbm', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gbm', 'Gm', 'G#m', 'Abm', 'Am', 'A#m', 'Bbm', 'Bm'
];

export const ROOT_MAP: Record<string, number> = {
  'C': 0, 'B#': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11,
};

export const CHORD_REGEX_STR = '[A-G][b#]?(?:maj|min|m|M|sus|add|dim|aug|[0-9]+)*(?:/[A-G][b#]?)?';
export const BRACKETED_CHORD_REGEX = /\[([A-G][b#]?[^\]]*)\]/g;
export const INLINE_CHORD_REGEX = new RegExp(`\\b(${CHORD_REGEX_STR})\\b`, 'g');

/**
 * Tek bir kök notayı verilen semiton adımı kadar transpoze eder.
 */
export function transposeNote(note: string, semitones: number, preferFlats = false): string {
  const index = ROOT_MAP[note];
  if (index === undefined) return note;

  const shiftedIndex = (index + semitones + 1200) % 12;
  const scale = preferFlats ? CHROMATIC_FLATS : CHROMATIC_SHARPS;
  return scale[shiftedIndex];
}

/**
 * Bütün bir akor adını transpoze eder (Örn: C#m7/G# -> +2 -> D#m7/A#).
 */
export function transposeChord(chord: string, semitones: number, preferFlats = false): string {
  if (!chord || semitones === 0) return chord;

  const isBracketed = chord.startsWith('[') && chord.endsWith(']');
  const clean = chord.replace(/[\[\]]/g, '').trim();

  const slashParts = clean.split('/');
  const mainChord = slashParts[0];
  const bassNote = slashParts[1] || null;

  const match = mainChord.match(/^([A-G][b#]?)(.*)$/);
  if (!match) return chord;

  const root = match[1];
  const extension = match[2];

  const transposedRoot = transposeNote(root, semitones, preferFlats);
  let result = `${transposedRoot}${extension}`;

  if (bassNote) {
    const bassMatch = bassNote.match(/^([A-G][b#]?)$/);
    if (bassMatch) {
      const transposedBass = transposeNote(bassMatch[1], semitones, preferFlats);
      result += `/${transposedBass}`;
    } else {
      result += `/${bassNote}`;
    }
  }

  return isBracketed ? `[${result}]` : result;
}

/**
 * Bir metin satırının sadece akorlardan oluşup oluşmadığını doğrular.
 */
export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  const tokens = trimmed.split(/\s+/);
  if (tokens.length === 0) return false;

  const chordTokenPattern = new RegExp(`^${CHORD_REGEX_STR}$`);
  let chordMatchCount = 0;

  for (const token of tokens) {
    if (chordTokenPattern.test(token)) {
      chordMatchCount++;
    }
  }

  return chordMatchCount / tokens.length >= 0.5;
}

/**
 * Metin içeriğindeki tüm akorları (hem [Am] hem düz satır akorlarını) transpoze eder.
 */
export function transposeContent(content: string, semitones: number, preferFlats = false): string {
  if (!content || semitones === 0) return content;

  if (BRACKETED_CHORD_REGEX.test(content)) {
    return content.replace(BRACKETED_CHORD_REGEX, (_, chord) => {
      return `[${transposeChord(chord, semitones, preferFlats)}]`;
    });
  }

  const lines = content.split('\n');
  return lines
    .map((line) => {
      if (isChordLine(line)) {
        return line.replace(new RegExp(CHORD_REGEX_STR, 'g'), (match) => {
          return transposeChord(match, semitones, preferFlats);
        });
      }
      return line;
    })
    .join('\n');
}

/**
 * Metindeki köşeli parantezli akorları temizleyip yalnızca şarkı sözlerini döndürür.
 */
export function stripChords(content: string): string {
  return content.replace(BRACKETED_CHORD_REGEX, '').replace(/^[ \t]+/gm, '');
}