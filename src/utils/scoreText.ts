import { Platform, TextStyle } from 'react-native';
import { sanitizeSongContent } from './chordEngine';

export const SCORE_PRE_STYLE: TextStyle = {
  fontFamily: Platform.OS === 'web' ? "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace" : 'monospace',
  ...({
    whiteSpace: 'pre',
    wordBreak: 'normal',
    overflowWrap: 'normal',
  } as object),
};

export function sanitizeScore(content: string | null | undefined): string {
  return sanitizeSongContent(content || '');
}

export function scoreTextStyle(...styles: Array<TextStyle | object | false | null | undefined>) {
  return [SCORE_PRE_STYLE, ...styles];
}
