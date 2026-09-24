import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

// --- PİYANO BİLEŞENİ (10px tuş, 70px klavye — önceki genişliğin yarısı) ---
interface PianoViewProps {
  activePitches: number[]; // 0: C, 1: C#, 2: D ... 11: B
  chordName?: string;
}

export const PianoView: React.FC<PianoViewProps> = ({ activePitches = [], chordName }) => {
  const whiteKeys = [
    { pitch: 0, label: 'C' },
    { pitch: 2, label: 'D' },
    { pitch: 4, label: 'E' },
    { pitch: 5, label: 'F' },
    { pitch: 7, label: 'G' },
    { pitch: 9, label: 'A' },
    { pitch: 11, label: 'B' },
  ];

  const blackKeys = [
    { pitch: 1, left: 7 },
    { pitch: 3, left: 17 },
    { pitch: 6, left: 37 },
    { pitch: 8, left: 47 },
    { pitch: 10, left: 57 },
  ];

  return (
    <View style={styles.pianoContainer}>
      {chordName ? <Text style={styles.chordTitle}>{chordName}</Text> : null}
      <View style={styles.pianoKeyboard}>
        {whiteKeys.map((k) => {
          const isActive = activePitches.includes(k.pitch);
          return (
            <View
              key={`w-${k.pitch}`}
              style={[styles.whiteKey, isActive && styles.activeWhiteKey]}
            >
              {isActive && <View style={styles.whiteActiveDot} />}
            </View>
          );
        })}

        {blackKeys.map((k) => {
          const isActive = activePitches.includes(k.pitch);
          return (
            <View
              key={`b-${k.pitch}`}
              style={[
                styles.blackKey,
                { left: k.left },
                isActive && styles.activeBlackKey
              ]}
            >
              {isActive && <View style={styles.blackActiveDot} />}
            </View>
          );
        })}
      </View>
    </View>
  );
};

// --- GİTAR & BASS FRETBOARD DİYAGRAMI ---
interface FretboardProps {
  chordName: string;
  stringsCount: 4 | 6; // 6: Gitar, 4: Bass
  frets: number[];     // Örn: [-1, 0, 2, 2, 1, 0] (-1: Sustur/X, 0: Boş/O, 1-4: Perde)
  baseFret?: number;
}

export const FretboardView: React.FC<FretboardProps> = ({
  chordName,
  stringsCount = 6,
  frets = [],
  baseFret = 1
}) => {
  const fretCount = 4; // Gösterilecek perde sayısı

  return (
    <View style={styles.fretContainer}>
      <Text style={styles.chordTitle}>{chordName}</Text>
      
      {/* Üst Sustur / Boş Tel Göstergeleri (X / O) */}
      <View style={[styles.nutMarkersRow, { width: stringsCount === 6 ? 90 : 60 }]}>
        {Array.from({ length: stringsCount }).map((_, sIdx) => {
          const fretVal = frets[sIdx];
          let mark = '';
          if (fretVal === -1) mark = '×';
          else if (fretVal === 0) mark = '○';

          return (
            <Text key={`nut-${sIdx}`} style={styles.nutMarkText}>
              {mark}
            </Text>
          );
        })}
      </View>

      {/* Perde Izgarası (Fretboard Grid) */}
      <View style={[styles.gridBox, { width: stringsCount === 6 ? 90 : 60 }]}>
        {/* Baş Eşik (Nut) Çizgisi */}
        <View style={[styles.fretNutLine, baseFret > 1 && styles.fretNutLineRegular]} />

        {/* Yatay Perde Çizgileri */}
        {Array.from({ length: fretCount }).map((_, fIdx) => (
          <View key={`fline-${fIdx}`} style={styles.fretLine} />
        ))}

        {/* Düşey Tel Çizgileri */}
        <View style={styles.stringsWrapper}>
          {Array.from({ length: stringsCount }).map((_, sIdx) => (
            <View key={`string-${sIdx}`} style={styles.stringLine} />
          ))}
        </View>

        {/* Perdelere Basılan Parmak Noktaları */}
        {frets.map((fretVal, sIdx) => {
          if (fretVal <= 0 || fretVal > fretCount) return null;
          const leftPos = (sIdx / (stringsCount - 1)) * (stringsCount === 6 ? 84 : 54) + 1;
          const topPos = (fretVal - 1) * 14 + 2;

          return (
            <View
              key={`dot-${sIdx}-${fretVal}`}
              style={[styles.fretDot, { left: leftPos, top: topPos }]}
            />
          );
        })}
      </View>

      {baseFret > 1 && (
        <Text style={styles.baseFretLabel}>{baseFret}fr</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Minimalist Piyano
  pianoContainer: {
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  chordTitle: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  pianoKeyboard: {
    flexDirection: 'row',
    position: 'relative',
    height: 42,
    width: 70,
    backgroundColor: '#090d16',
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  whiteKey: {
    width: 10,
    height: '100%',
    backgroundColor: '#f8fafc',
    borderRightWidth: 1,
    borderColor: '#cbd5e1',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 2,
  },
  activeWhiteKey: {
    backgroundColor: '#7dd3fc',
  },
  whiteActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0284c7',
  },
  blackKey: {
    position: 'absolute',
    top: 0,
    width: 7,
    height: 24,
    backgroundColor: '#0f172a',
    zIndex: 10,
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 1,
    borderWidth: 0.5,
    borderColor: '#000000',
  },
  activeBlackKey: {
    backgroundColor: '#0284c7',
  },
  blackActiveDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#ffffff',
  },

  // Fretboard (Gitar & Bass)
  fretContainer: {
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  nutMarkersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 14,
    paddingHorizontal: 1,
    marginBottom: 1,
  },
  nutMarkText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
    textAlign: 'center',
    width: 10,
  },
  gridBox: {
    height: 56, // 4 perde * 14px
    position: 'relative',
    borderWidth: 1,
    borderColor: '#475569',
    backgroundColor: '#0f172a',
    borderRadius: 2,
  },
  fretNutLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#e2e8f0',
    zIndex: 2,
  },
  fretNutLineRegular: {
    height: 1,
    backgroundColor: '#475569',
  },
  fretLine: {
    height: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  stringsWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  stringLine: {
    width: 1,
    height: '100%',
    backgroundColor: '#64748b',
  },
  fretDot: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#38bdf8',
    transform: [{ translateX: -4.5 }],
    zIndex: 5,
  },
  baseFretLabel: {
    position: 'absolute',
    right: -16,
    top: 20,
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '700',
  },
});