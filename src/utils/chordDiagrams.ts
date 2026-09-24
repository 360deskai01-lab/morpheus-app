export type FretDiagram = { frets: number[]; baseFret: number };

const ENHARMONIC: Record<string, string> = {
  'B#': 'C',
  Cb: 'B',
  'E#': 'F',
  Fb: 'E',
  Db: 'C#',
  'D#': 'Eb',
  Gb: 'F#',
  'G#': 'Ab',
  'A#': 'Bb',
};

const QUALITY_ALIAS: Record<string, string> = {
  '': 'maj',
  M: 'maj',
  maj: 'maj',
  major: 'maj',
  m: 'min',
  min: 'min',
  mi: 'min',
  '-': 'min',
  '7': '7',
  dom7: '7',
  m7: 'm7',
  min7: 'm7',
  mi7: 'm7',
  maj7: 'maj7',
  M7: 'maj7',
  Δ: 'maj7',
  '7M': 'maj7',
  Δ7: 'maj7',
  sus: 'sus4',
  sus4: 'sus4',
  sus2: 'sus2',
  dim: 'dim',
  o: 'dim',
  dim7: 'dim7',
  o7: 'dim7',
  aug: 'aug',
  '+': 'aug',
  '5': '5',
  '6': '6',
  m6: 'm6',
  add9: 'add9',
  add2: 'add9',
  '9': '9',
  m9: 'm9',
  maj9: 'maj9',
  m7b5: 'm7b5',
  'm7(b5)': 'm7b5',
  ø: 'm7b5',
  mmaj7: 'mmaj7',
};

function canonRoot(root: string): string {
  return ENHARMONIC[root] || root;
}

export function parseChordToken(raw: string): { root: string; quality: string } | null {
  const token = String(raw || '')
    .replace(/[()]/g, '')
    .split('/')[0]
    .trim();
  const match = token.match(/^([A-G][b#]?)(.*)$/);
  if (!match) return null;
  const root = canonRoot(match[1]);
  let quality = (match[2] || '').replace(/\s+/g, '');
  quality = QUALITY_ALIAS[quality] || QUALITY_ALIAS[quality.toLowerCase()] || quality || 'maj';
  if (quality === 'maj' && match[2] === '') quality = 'maj';
  return { root, quality };
}

function shiftFrets(shape: number[], delta: number): number[] {
  return shape.map((fret) => (fret < 0 ? fret : fret + delta));
}

/** E biçimi (6. tel kök) — Justin Guitar / UG açık E ailesi */
const E_SHAPES: Record<string, number[]> = {
  maj: [0, 2, 2, 1, 0, 0],
  min: [0, 2, 2, 0, 0, 0],
  '7': [0, 2, 0, 1, 0, 0],
  m7: [0, 2, 0, 0, 0, 0],
  maj7: [0, 2, 1, 1, 0, 0],
  sus4: [0, 2, 2, 2, 0, 0],
  sus2: [0, 2, 2, 0, 0, 2],
  '5': [0, 2, 2, -1, -1, -1],
  '6': [0, 2, 2, 1, 2, 0],
  m6: [0, 2, 2, 0, 2, 0],
  dim: [0, 1, 2, 0, -1, -1],
  dim7: [0, 1, 2, 0, 2, 0],
  aug: [0, 3, 2, 1, 1, 0],
  add9: [0, 2, 2, 1, 0, 2],
  '9': [0, 2, 0, 1, 0, 2],
  m9: [0, 2, 0, 0, 0, 2],
  maj9: [0, 2, 1, 1, 0, 2],
  m7b5: [0, 1, 2, 0, 3, 0],
  mmaj7: [0, 2, 1, 0, 0, 0],
};

/** A biçimi (5. tel kök) */
const A_SHAPES: Record<string, number[]> = {
  maj: [-1, 0, 2, 2, 2, 0],
  min: [-1, 0, 2, 2, 1, 0],
  '7': [-1, 0, 2, 0, 2, 0],
  m7: [-1, 0, 2, 0, 1, 0],
  maj7: [-1, 0, 2, 1, 2, 0],
  sus4: [-1, 0, 2, 2, 3, 0],
  sus2: [-1, 0, 2, 2, 0, 0],
  '5': [-1, 0, 2, 2, -1, -1],
  '6': [-1, 0, 2, 2, 2, 2],
  m6: [-1, 0, 2, 2, 1, 2],
  dim: [-1, 0, 1, 2, 1, -1],
  dim7: [-1, 0, 1, 2, 1, 2],
  aug: [-1, 0, 3, 2, 2, 1],
  add9: [-1, 0, 2, 2, 2, 2],
  '9': [-1, 0, 2, 0, 2, 2],
  m9: [-1, 0, 2, 0, 1, 2],
  maj9: [-1, 0, 2, 1, 2, 2],
  m7b5: [-1, 0, 1, 0, 1, -1],
  mmaj7: [-1, 0, 2, 1, 1, 0],
};

const E_ROOT_FRET: Record<string, number> = {
  E: 0, F: 1, 'F#': 2, G: 3, Ab: 4, A: 5, Bb: 6, B: 7, C: 8, 'C#': 9, D: 10, Eb: 11,
};
const A_ROOT_FRET: Record<string, number> = {
  A: 0, Bb: 1, B: 2, C: 3, 'C#': 4, D: 5, Eb: 6, E: 7, F: 8, 'F#': 9, G: 10, Ab: 11,
};

/** UG / Hal Leonard açık pozisyon tercihleri */
const GUITAR_OPEN: Record<string, number[]> = {
  C: [-1, 3, 2, 0, 1, 0],
  C7: [-1, 3, 2, 3, 1, 0],
  Cmaj7: [-1, 3, 2, 0, 0, 0],
  Cadd9: [-1, 3, 2, 0, 3, 0],
  Csus2: [-1, 3, 0, 0, 1, 3],
  Csus4: [-1, 3, 3, 0, 1, 1],
  D: [-1, -1, 0, 2, 3, 2],
  Dm: [-1, -1, 0, 2, 3, 1],
  D7: [-1, -1, 0, 2, 1, 2],
  Dm7: [-1, -1, 0, 2, 1, 1],
  Dmaj7: [-1, -1, 0, 2, 2, 2],
  Dsus2: [-1, -1, 0, 2, 3, 0],
  Dsus4: [-1, -1, 0, 2, 3, 3],
  E: [0, 2, 2, 1, 0, 0],
  Em: [0, 2, 2, 0, 0, 0],
  E7: [0, 2, 0, 1, 0, 0],
  Em7: [0, 2, 0, 0, 0, 0],
  Emaj7: [0, 2, 1, 1, 0, 0],
  Esus4: [0, 2, 2, 2, 0, 0],
  G: [3, 2, 0, 0, 0, 3],
  G7: [3, 2, 0, 0, 0, 1],
  Gmaj7: [3, 2, 0, 0, 0, 2],
  Gsus4: [3, 3, 0, 0, 1, 3],
  A: [-1, 0, 2, 2, 2, 0],
  Am: [-1, 0, 2, 2, 1, 0],
  A7: [-1, 0, 2, 0, 2, 0],
  Am7: [-1, 0, 2, 0, 1, 0],
  Amaj7: [-1, 0, 2, 1, 2, 0],
  Asus2: [-1, 0, 2, 2, 0, 0],
  Asus4: [-1, 0, 2, 2, 3, 0],
  B7: [-1, 2, 1, 2, 0, 2],
  Fmaj7: [-1, -1, 3, 2, 1, 0],
  Fadd9: [-1, -1, 3, 2, 1, 3],
};

function guitarFromShapes(root: string, quality: string): number[] | null {
  const key = `${root}${quality === 'maj' ? '' : quality === 'min' ? 'm' : quality}`;
  if (GUITAR_OPEN[key]) return GUITAR_OPEN[key];
  if (quality === 'maj' && GUITAR_OPEN[root]) return GUITAR_OPEN[root];
  if (quality === 'min' && GUITAR_OPEN[`${root}m`]) return GUITAR_OPEN[`${root}m`];

  const eFret = E_ROOT_FRET[root];
  const aFret = A_ROOT_FRET[root];
  const eShape = E_SHAPES[quality] || E_SHAPES.maj;
  const aShape = A_SHAPES[quality] || A_SHAPES.maj;

  if (eFret !== undefined && eFret > 0 && eFret <= 4) return shiftFrets(eShape, eFret);
  if (aFret !== undefined && aFret > 0 && aFret <= 5) return shiftFrets(aShape, aFret);
  if (eFret !== undefined && eFret > 0) return shiftFrets(eShape, eFret);
  if (aFret !== undefined && aFret > 0) return shiftFrets(aShape, aFret);
  if (eFret === 0) return eShape;
  if (aFret === 0) return aShape;
  return null;
}

export function toDisplayFrets(frets: number[]): FretDiagram {
  const pressed = frets.filter((fret) => fret > 0);
  if (!pressed.length) return { frets, baseFret: 1 };
  const max = Math.max(...pressed);
  if (max <= 4) return { frets, baseFret: 1 };
  const base = Math.min(...pressed);
  return {
    frets: frets.map((fret) => (fret <= 0 ? fret : fret - base + 1)),
    baseFret: base,
  };
}

export function guitarDiagramFor(chord: string): FretDiagram {
  const parsed = parseChordToken(chord);
  if (!parsed) return { frets: GUITAR_OPEN.Am, baseFret: 1 };
  const frets = guitarFromShapes(parsed.root, parsed.quality) || GUITAR_OPEN.Am;
  return toDisplayFrets(frets);
}

export function guitarFretsFor(chord: string): number[] {
  const parsed = parseChordToken(chord);
  if (!parsed) return GUITAR_OPEN.Am;
  return guitarFromShapes(parsed.root, parsed.quality) || GUITAR_OPEN.Am;
}

function bassPower(rootFretOnE: number | null, rootFretOnA: number | null, quality: string): number[] {
  const minor = quality === 'min' || quality === 'm7' || quality === 'm6' || quality === 'm9' || quality === 'dim' || quality === 'm7b5' || quality === 'mmaj7';
  const dominant = quality === '7' || quality === '9' || quality === '11' || quality === '13';
  if (rootFretOnE !== null && rootFretOnE <= 7) {
    const r = rootFretOnE;
    const fifth = r + 2;
    const third = r + (minor ? 0 : 1);
    if (dominant) return [r, fifth, r, third];
    return [r, fifth, fifth, third];
  }
  if (rootFretOnA !== null) {
    const r = rootFretOnA;
    if (minor) return [-1, r, r + 2, r];
    if (dominant) return [-1, r, r, r + 2];
    return [-1, r, r + 2, r + 2];
  }
  return [-1, 0, 2, 2];
}

const BASS_OPEN: Record<string, number[]> = {
  E: [0, 2, 2, 1],
  Em: [0, 2, 2, 0],
  E7: [0, 2, 0, 1],
  Em7: [0, 2, 0, 0],
  Emaj7: [0, 2, 1, 1],
  F: [1, 3, 3, 2],
  Fm: [1, 3, 3, 1],
  F7: [1, 3, 1, 2],
  'F#': [2, 4, 4, 3],
  'F#m': [2, 4, 4, 2],
  'F#7': [2, 4, 2, 3],
  G: [3, 5, 5, 4],
  Gm: [3, 5, 5, 3],
  G7: [3, 5, 3, 4],
  Gmaj7: [3, 5, 4, 4],
  Ab: [4, 6, 6, 5],
  Abm: [4, 6, 6, 4],
  A: [-1, 0, 2, 2],
  Am: [-1, 0, 2, 0],
  A7: [-1, 0, 2, 0],
  Am7: [-1, 0, 2, 0],
  Amaj7: [-1, 0, 2, 1],
  Bb: [-1, 1, 3, 3],
  Bbm: [-1, 1, 3, 1],
  Bb7: [-1, 1, 1, 3],
  B: [-1, 2, 4, 4],
  Bm: [-1, 2, 4, 2],
  B7: [-1, 2, 1, 2],
  C: [-1, 3, 5, 5],
  Cm: [-1, 3, 5, 3],
  C7: [-1, 3, 3, 3],
  Cmaj7: [-1, 3, 5, 4],
  'C#': [-1, 4, 6, 6],
  'C#m': [-1, 4, 6, 4],
  D: [-1, 5, 7, 7],
  Dm: [-1, 5, 7, 5],
  D7: [-1, 5, 5, 5],
  Dmaj7: [-1, 5, 7, 6],
  Eb: [-1, 6, 8, 8],
  Ebm: [-1, 6, 8, 6],
};

export function bassDiagramFor(chord: string): FretDiagram {
  const parsed = parseChordToken(chord);
  if (!parsed) return { frets: BASS_OPEN.Am, baseFret: 1 };
  const openKey = `${parsed.root}${parsed.quality === 'maj' ? '' : parsed.quality === 'min' ? 'm' : parsed.quality}`;
  const openAlt = parsed.quality === 'maj' ? parsed.root : parsed.quality === 'min' ? `${parsed.root}m` : '';
  const known = BASS_OPEN[openKey] || BASS_OPEN[openAlt];
  if (known) return toDisplayFrets(known);
  return toDisplayFrets(bassPower(E_ROOT_FRET[parsed.root] ?? null, A_ROOT_FRET[parsed.root] ?? null, parsed.quality));
}

export function bassFretsFor(chord: string): number[] {
  const parsed = parseChordToken(chord);
  if (!parsed) return BASS_OPEN.Am;
  const openKey = `${parsed.root}${parsed.quality === 'maj' ? '' : parsed.quality === 'min' ? 'm' : parsed.quality}`;
  const openAlt = parsed.quality === 'maj' ? parsed.root : parsed.quality === 'min' ? `${parsed.root}m` : '';
  return BASS_OPEN[openKey] || BASS_OPEN[openAlt] || bassPower(E_ROOT_FRET[parsed.root] ?? null, A_ROOT_FRET[parsed.root] ?? null, parsed.quality);
}

export const GUITAR_CHORD_FRETS: { [key: string]: number[] } = new Proxy(
  { ...GUITAR_OPEN },
  {
    get: (_target, prop: string) => guitarFretsFor(String(prop)),
  }
);

export const BASS_CHORD_FRETS: { [key: string]: number[] } = new Proxy(
  { ...BASS_OPEN },
  {
    get: (_target, prop: string) => bassFretsFor(String(prop)),
  }
);
