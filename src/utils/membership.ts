export type CenterPane =
  | 'song'
  | 'profile'
  | 'playlists'
  | 'add_to_list'
  | 'add_song'
  | 'inbox'
  | 'my_corrections'
  | 'admin'
  | 'ai'
  | 'suggest'
  | 'forum'
  | 'events'
  | 'courses'
  | 'store'
  | 'help';

export const HUB_PANES: CenterPane[] = ['forum', 'events', 'courses', 'store', 'help'];

export function isHubPane(pane: CenterPane): boolean {
  return HUB_PANES.includes(pane);
}

export type MobileShelf = 'library' | 'stage' | 'account';

export function normalizeTier(tier?: string | null): string {
  return (tier || 'basic').toLowerCase();
}

export function isUpperMembership(tier?: string | null, isAdmin?: boolean): boolean {
  if (isAdmin) return true;
  const t = normalizeTier(tier);
  return t !== 'basic' && t !== 'free';
}

export function displayTier(tier?: string | null, isAdmin?: boolean): string {
  if (isAdmin) return 'ADMIN';
  return (tier || 'BASIC').toUpperCase();
}

export const STAGE_BADGES = [
  { id: 'default', label: 'Klasik', color: '#38BDF8' },
  { id: 'gold', label: 'Sahne Altın', color: '#F59E0B' },
  { id: 'violet', label: 'Violet Pro', color: '#8B5CF6' },
  { id: 'emerald', label: 'Emerald Band', color: '#10B981' },
] as const;

export const CHORD_PALETTES = {
  classic: { id: 'classic', label: 'Klasik Sahne', chord: '#FFC107', lyric: '#CBD5E1', bg: '#05080E' },
  jazz: { id: 'jazz', label: 'Jazz Gece', chord: '#C084FC', lyric: '#F8FAFC', bg: '#12081A' },
  night: { id: 'night', label: 'Amber Night', chord: '#FBBF24', lyric: '#E2E8F0', bg: '#0A0A0A' },
  stage: { id: 'stage', label: 'Sahne Yeşili', chord: '#34D399', lyric: '#F1F5F9', bg: '#052E1C' },
} as const;

export type ChordPaletteId = keyof typeof CHORD_PALETTES;

export function resolvePalette(id?: string | null) {
  if (id && id in CHORD_PALETTES) return CHORD_PALETTES[id as ChordPaletteId];
  return CHORD_PALETTES.classic;
}

export function resolveBadge(id?: string | null) {
  return STAGE_BADGES.find((b) => b.id === id) || STAGE_BADGES[0];
}
