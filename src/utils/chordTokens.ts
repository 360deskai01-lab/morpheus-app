import { CHORD_REGEX_STR, INLINE_CHORD_REGEX } from './chordEngine';

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
  const bare = content.match(new RegExp(INLINE_CHORD_REGEX.source, 'g')) || [];
  for (const name of bare) {
    const clean = name.replace(/[\[\]]/g, '').trim();
    if (looksLikeChord(clean)) found.add(clean);
  }
  return Array.from(found);
}

export function splitChordAwareLine(line: string): Array<{ text: string; chord?: string }> {
  const parts: Array<{ text: string; chord?: string }> = [];
  const chunks = line.split(/(\[[^\]]+\]|\s+)/);
  for (const chunk of chunks) {
    if (!chunk) continue;
    const bracket = chunk.match(/^\[([^\]]+)\]$/);
    if (bracket && looksLikeChord(bracket[1])) {
      parts.push({ text: chunk, chord: bracket[1] });
      continue;
    }
    if (looksLikeChord(chunk)) {
      parts.push({ text: chunk, chord: chunk });
      continue;
    }
    parts.push({ text: chunk });
  }
  return parts;
}
