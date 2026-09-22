export const SITE_ORIGIN = 'https://stagemorpheus.com';

export const INFO_PAGE_IDS = [
  'hakkimizda',
  'iletisim',
  'kunye',
  'sponsorluk',
  'kullanim-kosullari',
  'gizlilik',
  'kvkk',
  'telif',
  'akor-kilavuzu',
  'yardim',
] as const;

export type InfoPageId = (typeof INFO_PAGE_IDS)[number];

export type PortalRoute =
  | { kind: 'home' }
  | { kind: 'song'; slug: string }
  | { kind: 'page'; page: InfoPageId };

export interface SongLike {
  id: string | number;
  title?: string | null;
  artist?: string | null;
}

const TR_MAP: Record<string, string> = {
  ç: 'c',
  ğ: 'g',
  ı: 'i',
  ö: 'o',
  ş: 's',
  ü: 'u',
  â: 'a',
  î: 'i',
  û: 'u',
};

export function slugifyPart(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşüâîû]/g, (ch) => TR_MAP[ch] || ch)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function songIdToken(id: string | number): string {
  return String(id).replace(/-/g, '').slice(0, 8).toLowerCase();
}

export function songSlug(song: SongLike): string {
  const base = [song.artist, song.title]
    .filter(Boolean)
    .map((part) => slugifyPart(String(part)))
    .filter(Boolean)
    .join('-');
  return `${base || 'sarki'}-${songIdToken(song.id)}`;
}

export function songPath(song: SongLike): string {
  return `/sarki/${songSlug(song)}`;
}

export function songCanonicalUrl(song: SongLike): string {
  return `${SITE_ORIGIN}${songPath(song)}`;
}

export function infoPath(page: InfoPageId): string {
  return `/${page}`;
}

export function isInfoPageId(value: string): value is InfoPageId {
  return (INFO_PAGE_IDS as readonly string[]).includes(value);
}

export function parsePathname(pathname: string): PortalRoute {
  const path = (pathname || '/').replace(/\/+$/, '') || '/';
  if (path === '/') return { kind: 'home' };

  const songMatch = path.match(/^\/sarki\/([^/]+)$/i);
  if (songMatch) return { kind: 'song', slug: decodeURIComponent(songMatch[1]) };

  const pageKey = path.replace(/^\//, '');
  if (isInfoPageId(pageKey)) return { kind: 'page', page: pageKey };

  return { kind: 'home' };
}

export function findSongBySlug(songs: SongLike[], slug: string): SongLike | undefined {
  const clean = slug.toLowerCase();
  const exact = songs.find((song) => songSlug(song) === clean);
  if (exact) return exact;

  const token = clean.split('-').pop() || '';
  if (token.length >= 6) {
    const byToken = songs.find((song) => songIdToken(song.id) === token);
    if (byToken) return byToken;
  }

  return songs.find((song) => String(song.id) === slug);
}

export function canUseHistory(): boolean {
  return typeof window !== 'undefined' && typeof window.history?.pushState === 'function';
}

export function replacePortalUrl(path: string) {
  if (!canUseHistory()) return;
  if (window.location.pathname === path) return;
  window.history.replaceState({ path }, '', path);
}

export function pushPortalUrl(path: string) {
  if (!canUseHistory()) return;
  if (window.location.pathname === path) return;
  window.history.pushState({ path }, '', path);
}
