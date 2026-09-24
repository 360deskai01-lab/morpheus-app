export type SongSortKey = 'none' | 'title' | 'artist' | 'views' | 'rating';

export function foldSearchText(value: string | null | undefined): string {
  return String(value || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('tr-TR');
}

export function songSearchHaystack(song: { title?: string | null; artist?: string | null }): string {
  return `${foldSearchText(song.title)} ${foldSearchText(song.artist)}`.trim();
}

export function matchesSongQuery(
  song: { title?: string | null; artist?: string | null },
  query: string
): boolean {
  const tokens = foldSearchText(query).split(' ').filter(Boolean);
  if (!tokens.length) return true;
  const title = foldSearchText(song.title);
  const artist = foldSearchText(song.artist);
  const combined = `${title} ${artist}`;
  return tokens.every((token) => title.includes(token) || artist.includes(token) || combined.includes(token));
}

export function matchesSongLetter(
  song: { title?: string | null; artist?: string | null },
  letter: string
): boolean {
  if (!letter || letter === 'Tümü') return true;
  const needle = foldSearchText(letter);
  return foldSearchText(song.title).startsWith(needle) || foldSearchText(song.artist).startsWith(needle);
}

export function compareLocale(a?: string | null, b?: string | null): number {
  return foldSearchText(a).localeCompare(foldSearchText(b), 'tr-TR', { sensitivity: 'base', numeric: true });
}

export function compareSongsByTitle(a: { title?: string | null; artist?: string | null }, b: { title?: string | null; artist?: string | null }): number {
  return compareLocale(a.title, b.title) || compareLocale(a.artist, b.artist);
}

export function compareSongsByArtist(a: { title?: string | null; artist?: string | null }, b: { title?: string | null; artist?: string | null }): number {
  return compareLocale(a.artist, b.artist) || compareLocale(a.title, b.title);
}

export function sortSongs<T extends { title?: string | null; artist?: string | null; views?: number | null }>(
  a: T,
  b: T,
  key: SongSortKey,
  ratingOf: (song: T) => number
): number {
  if (key === 'views') return (Number(b.views) || 0) - (Number(a.views) || 0) || compareSongsByTitle(a, b);
  if (key === 'rating') return ratingOf(b) - ratingOf(a) || compareSongsByTitle(a, b);
  if (key === 'artist') return compareSongsByArtist(a, b);
  return compareSongsByTitle(a, b);
}
