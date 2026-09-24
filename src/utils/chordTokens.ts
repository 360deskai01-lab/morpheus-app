import { CHORD_REGEX_STR, isChordLine } from './chordEngine';

const TOKEN = new RegExp(`^${CHORD_REGEX_STR}$`);

export function looksLikeChord(token: string): boolean {
  return TOKEN.test(token.trim());
}

export function extractChordNames(content: string): string[] {
  const found = new Set<string>();
  const bracketed = content.match(/\[([^\]]+)\]/g) || [];
  for (const item of bracketed) {
    const name = item.slice(1, -1).trim();
    if (looksLikeChord(name)) found.add(name);
  }
  for (const line of content.split('\n')) {
    if (!isChordLine(line)) continue;
    for (const token of line.split(/\s+/)) {
      const clean = token.replace(/[\[\]]/g, '').trim();
      if (looksLikeChord(clean)) found.add(clean);
    }
  }
  return Array.from(found);
}

export function splitChordAwareLine(line: string): Array<{ text: string; chord?: string }> {
  const parts: Array<{ text: string; chord?: string }> = [];
  const chordLine = isChordLine(line);
  const chunks = line.split(/(\[[^\]]+\]|\s+)/);
  for (const chunk of chunks) {
    if (!chunk) continue;
    const bracket = chunk.match(/^\[([^\]]+)\]$/);
    if (bracket && looksLikeChord(bracket[1])) {
      parts.push({ text: chunk, chord: bracket[1] });
      continue;
    }
    if (chordLine && looksLikeChord(chunk)) {
      parts.push({ text: chunk, chord: chunk });
      continue;
    }
    parts.push({ text: chunk });
  }
  return parts;
}
