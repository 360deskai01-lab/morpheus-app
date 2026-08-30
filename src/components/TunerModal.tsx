// src/components/TunerModal.tsx
import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { X, Volume2, VolumeX } from 'lucide-react-native';

interface TunerModalProps {
  visible: boolean;
  onClose: () => void;
}

interface StringFrequency {
  note: string;
  stringNumber: number;
  freq: number;
  octave: string;
}

const GUITAR_STRINGS: StringFrequency[] = [
  { note: 'E', stringNumber: 1, freq: 329.63, octave: 'e4' },
  { note: 'B', stringNumber: 2, freq: 246.94, octave: 'B3' },
  { note: 'G', stringNumber: 3, freq: 196.0, octave: 'G3' },
  { note: 'D', stringNumber: 4, freq: 146.83, octave: 'D3' },
  { note: 'A', stringNumber: 5, freq: 110.0, octave: 'A2' },
  { note: 'E', stringNumber: 6, freq: 82.41, octave: 'E2' },
];

export default function TunerModal({ visible, onClose }: TunerModalProps) {
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const audioContextRef = useRef<any>(null);
  const oscillatorRef = useRef<any>(null);

  const stopOscillator = () => {
    try {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
    } catch (e) {
      // osilatör zaten durmuşsa yok say
    }
    setActiveNote(null);
  };

  const playReferenceTone = (str: StringFrequency) => {
    if (activeNote === str.octave) {
      stopOscillator();
      return;
    }

    stopOscillator();

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioCtx();
        }
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }

        const osc = audioContextRef.current.createOscillator();
        const gain = audioContextRef.current.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(str.freq, audioContextRef.current.currentTime);

        gain.gain.setValueAtTime(0.2, audioContextRef.current.currentTime);
        osc.connect(gain);
        gain.connect(audioContextRef.current.destination);

        osc.start();
        oscillatorRef.current = osc;
        setActiveNote(str.octave);
      } catch (err) {
        console.warn('Web ses hatası:', err);
      }
    } else {
      setActiveNote(str.octave);
    }
  };

  const handleClose = () => {
    stopOscillator();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Volume2 color="#10B981" size={20} />
              <Text style={styles.title}>Referans Frekans Akort Aleti</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X color="#94A3B8" size={20} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Mikrofon paraziti olmadan, referans teli seçerek kulağınızla veya pedalınızla eşleyin:
          </Text>

          <View style={styles.stringsGrid}>
            {GUITAR_STRINGS.map((item) => {
              const isPlaying = activeNote === item.octave;
              return (
                <TouchableOpacity
                  key={item.octave}
                  style={[styles.stringItem, isPlaying && styles.stringItemActive]}
                  onPress={() => playReferenceTone(item)}
                >
                  <View style={styles.stringMeta}>
                    <Text style={[styles.stringNumber, isPlaying && styles.stringTextActive]}>
                      {item.stringNumber}. Tel
                    </Text>
                    <Text style={[styles.noteName, isPlaying && styles.stringTextActive]}>
                      {item.note}
                    </Text>
                    <Text style={styles.freqText}>{item.freq} Hz</Text>
                  </View>
                  {isPlaying ? (
                    <VolumeX color="#000000" size={18} />
                  ) : (
                    <Volume2 color="#64748B" size={18} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {activeNote && (
            <TouchableOpacity style={styles.stopAllBtn} onPress={stopOscillator}>
              <Text style={styles.stopAllBtnText}>Sesi Sustur</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 17,
  },
  stringsGrid: {
    gap: 8,
  },
  stringItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#161F30',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  stringItemActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stringMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stringNumber: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: 'bold',
    width: 44,
  },
  noteName: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
    width: 24,
  },
  freqText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  stringTextActive: {
    color: '#000000',
  },
  stopAllBtn: {
    marginTop: 14,
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  stopAllBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
});