export function isChordLine(line: string): boolean {
    const trimmed = line.trim();
    if (!trimmed) return false;
    
    // Basit akor kökleri ve uzantıları kontrolü
    const chordPattern = /^[A-G][b#]?(m|maj|min|dim|aug|sus|add)?[0-9]?(\/[A-G][b#]?)?(\s+[A-G][b#]?(m|maj|min|dim|aug|sus|add)?[0-9]?(\/[A-G][b#]?)?)*$/;
    return chordPattern.test(trimmed);
  }
  
  export function mergeChordsAndLyrics(chordLine: string, lyricLine: string): string {
    if (!chordLine.trim()) return lyricLine;
    if (!lyricLine.trim()) {
      // Sadece akor satırı varsa köşeli parantezle boşluk bırak
      return chordLine.trim().split(/\s+/).map((c) => `[${c}]`).join(' ');
    }
  
    const chords: { chord: string; index: number }[] = [];
    const regex = /\S+/g;
    let match: RegExpExecArray | null;
  
    while ((match = regex.exec(chordLine)) !== null) {
      chords.push({ chord: match[0], index: match.index });
    }
  
    let result = '';
    let lastIdx = 0;
  
    for (let i = 0; i < chords.length; i++) {
      const { chord, index } = chords[i];
      if (index < lyricLine.length) {
        result += lyricLine.substring(lastIdx, index) + `[${chord}]`;
        lastIdx = index;
      } else {
        // Akor sözlerden daha sağdaysa araya boşluk koyup ekle
        if (lastIdx < lyricLine.length) {
          result += lyricLine.substring(lastIdx);
          lastIdx = lyricLine.length;
        }
        result += ` [${chord}]`;
      }
    }
  
    if (lastIdx < lyricLine.length) {
      result += lyricLine.substring(lastIdx);
    }
  
    return result;
  }
  
  export function convertRawChordsToMorpheus(rawText: string): string {
    const lines = rawText.replace(/\r\n/g, '\n').split('\n');
    const outputLines: string[] = [];
  
    for (let i = 0; i < lines.length; i++) {
      const current = lines[i];
      const next = i + 1 < lines.length ? lines[i + 1] : null;
  
      if (isChordLine(current)) {
        if (next !== null && !isChordLine(next) && next.trim().length > 0) {
          // Üst satır akor, alt satır söz -> birleştir
          outputLines.push(mergeChordsAndLyrics(current, next));
          i++; // Söz satırını atla
        } else {
          // Altında söz yoksa tek başına akor satırıdır
          outputLines.push(mergeChordsAndLyrics(current, ''));
        }
      } else {
        outputLines.push(current);
      }
    }
  
    return outputLines.join('\n');
  }