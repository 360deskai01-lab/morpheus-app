import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  ActivityIndicator,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Globe,
  Smartphone,
  Download,
  X,
  Music,
  Plus,
  Minus,
  Mic,
} from 'lucide-react-native';
import MorpheusWebPortal from './src/components/MorpheusWebPortal';
import TunerModal from './src/components/TunerModal';
import { fetchSharedSongByCode } from './src/services/shareService';
import { transposeContent, transposeChord, isChordLine } from './src/utils/chordEngine';
import { supabase } from './src/lib/supabase';

const MONO_FONT = Platform.select({
  web: 'Consolas, Monaco, "Courier New", monospace',
  default: 'monospace',
});

export default function App() {
  const [activeMode, setActiveMode] = useState<'PORTAL' | 'STAGE'>('PORTAL');

  // Sahne Repertuvar & Çalma Durumları
  const [stageSongs, setStageSongs] = useState<any[]>([]);
  const [activeSong, setActiveSong] = useState<any | null>(null);
  const [transposeVal, setTransposeVal] = useState(0);
  const [fontSize, setFontSize] = useState(18);
  const [isTunerOpen, setIsTunerOpen] = useState(false);

  // Buluttan Kod ile İçe Aktarma Durumları
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [shareInputCode, setShareInputCode] = useState('');
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    loadStageSongs();
  }, []);

  const loadStageSongs = async () => {
    try {
      const { data } = await supabase.from('morfeus_songs').select('*').limit(20);
      if (data && data.length > 0) {
        setStageSongs(data);
        if (!activeSong) {
          setActiveSong(data[0]);
        }
      }
    } catch (e) {
      console.warn('Sahne şarkıları yüklenemedi:', e);
    }
  };

  const handleSendToStage = (song: any) => {
    setActiveSong(song);
    setTransposeVal(0);
    setStageSongs((prev) => {
      if (!prev.find((s) => s.id === song.id)) {
        return [song, ...prev];
      }
      return prev;
    });
    setActiveMode('STAGE');
  };

  const handleImportSharedSong = async () => {
    if (!shareInputCode.trim()) {
      alert('Lütfen geçerli bir paylaşım kodu girin (Örn: MORF-AB12CD)');
      return;
    }

    try {
      setImportLoading(true);
      const songData = await fetchSharedSongByCode(shareInputCode);

      if (songData) {
        handleSendToStage(songData);
        setIsImportModalOpen(false);
        setShareInputCode('');
        alert(`"${songData.title}" parçası sahneye başarıyla yüklendi!`);
      }
    } catch (err: any) {
      alert(err.message || 'Kod çözülemedi veya geçersiz.');
    } finally {
      setImportLoading(false);
    }
  };

  // Akor ve Sözleri Hece Hece Hizalayan Parser Motoru
  const renderStageContent = (content: string) => {
    const lines = content.split('\n');

    return lines.map((line, lIdx) => {
      if (isChordLine(line)) {
        return (
          <View key={lIdx} style={styles.lineBox}>
            <Text style={[styles.chordOnlyText, { fontSize, fontFamily: MONO_FONT }]}>
              {line}
            </Text>
          </View>
        );
      }

      if (line.includes('[')) {
        const parts = line.split(/(\[[^\]]+\])/g);
        const pairs: { chord: string; lyric: string }[] = [];
        let currentChord = '';

        for (let i = 0; i < parts.length; i++) {
          const p = parts[i];
          if (p.startsWith('[') && p.endsWith(']')) {
            currentChord = p.slice(1, -1);
          } else {
            pairs.push({ chord: currentChord, lyric: p });
            currentChord = '';
          }
        }
        if (currentChord) pairs.push({ chord: currentChord, lyric: '' });

        return (
          <View key={lIdx} style={styles.chordLyricRow}>
            {pairs.map((pair, pIdx) => (
              <View key={pIdx} style={styles.heceColumn}>
                <Text
                  style={[
                    styles.aboveChord,
                    { fontSize: Math.max(12, fontSize - 3), opacity: pair.chord ? 1 : 0 },
                  ]}
                >
                  {pair.chord || '-'}
                </Text>
                <Text style={[styles.lyricText, { fontSize, fontFamily: MONO_FONT }]}>
                  {pair.lyric || (pair.chord ? ' ' : '')}
                </Text>
              </View>
            ))}
          </View>
        );
      }

      return (
        <View key={lIdx} style={styles.lineBox}>
          <Text style={[styles.lyricText, { fontSize, fontFamily: MONO_FONT }]}>
            {line || ' '}
          </Text>
        </View>
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070B13" />

      {/* ÜST GEÇİŞ ÇUBUĞU */}
      <View style={styles.topGlobalBar}>
        <View style={styles.globalLeft}>
          <Text style={styles.brandTitle}>MORPHEUS</Text>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>v3.6 ULTRA</Text>
          </View>
        </View>

        <View style={styles.globalCenterSwitcher}>
          <TouchableOpacity
            style={[styles.switcherBtn, activeMode === 'PORTAL' && styles.switcherBtnActive]}
            onPress={() => setActiveMode('PORTAL')}
          >
            <Globe color={activeMode === 'PORTAL' ? '#38BDF8' : '#94A3B8'} size={14} />
            <Text style={[styles.switcherText, activeMode === 'PORTAL' && styles.switcherTextActive]}>
              Web Portalı
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.switcherBtn, activeMode === 'STAGE' && styles.switcherBtnActive]}
            onPress={() => setActiveMode('STAGE')}
          >
            <Smartphone color={activeMode === 'STAGE' ? '#38BDF8' : '#94A3B8'} size={14} />
            <Text style={[styles.switcherText, activeMode === 'STAGE' && styles.switcherTextActive]}>
              Sahne İstasyonu (App)
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.globalRight}>
          <TouchableOpacity
            style={styles.importTriggerBtn}
            onPress={() => setIsImportModalOpen(true)}
          >
            <Download color="#38BDF8" size={13} />
            <Text style={styles.importTriggerBtnText}>Kod ile İçe Aktar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* GÖVDE PANELİ */}
      <View style={{ flex: 1 }}>
        {activeMode === 'PORTAL' ? (
          <MorpheusWebPortal onSendToStage={handleSendToStage} />
        ) : (
          <View style={styles.stageWrap}>
            {/* SOL: REPERTUAR LİSTESİ */}
            <View style={styles.stageSidebar}>
              <View style={styles.stageSidebarHeader}>
                <Text style={styles.sidebarTitle}>Canlı Repertuvar</Text>
                <Text style={styles.songCountTag}>{stageSongs.length} Parça</Text>
              </View>

              <ScrollView style={{ flex: 1, padding: 8 }}>
                {stageSongs.map((s) => {
                  const isCurrent = activeSong?.id === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.stageSongCard, isCurrent && styles.stageSongCardActive]}
                      onPress={() => {
                        setActiveSong(s);
                        setTransposeVal(0);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.stageSongTitle, isCurrent && { color: '#38BDF8' }]} numberOfLines={1}>
                          {s.title}
                        </Text>
                        <Text style={styles.stageSongArtist} numberOfLines={1}>{s.artist}</Text>
                      </View>
                      <View style={styles.stageKeyBadge}>
                        <Text style={styles.stageKeyText}>{s.original_key}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* ORTA & SAĞ: CANLI PERFORMANS OKUYUCU */}
            <View style={styles.stageMain}>
              {activeSong ? (
                <>
                  <View style={styles.stageControlsBar}>
                    <View>
                      <Text style={styles.activeTitle}>{activeSong.title}</Text>
                      <Text style={styles.activeArtist}>
                        {activeSong.artist} • Ton: {transposeChord(activeSong.original_key, transposeVal)} {activeSong.bpm ? `• BPM: ${activeSong.bpm}` : ''}
                      </Text>
                    </View>

                    <View style={styles.stageActionRow}>
                      <View style={styles.transBox}>
                        <TouchableOpacity
                          style={styles.circleBtn}
                          onPress={() => setTransposeVal((v) => v - 1)}
                        >
                          <Minus color="#FFFFFF" size={14} />
                        </TouchableOpacity>
                        <Text style={styles.transValue}>
                          {transposeVal > 0 ? `+${transposeVal}` : transposeVal}
                        </Text>
                        <TouchableOpacity
                          style={styles.circleBtn}
                          onPress={() => setTransposeVal((v) => v + 1)}
                        >
                          <Plus color="#FFFFFF" size={14} />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.fontBox}>
                        <TouchableOpacity
                          style={styles.fontBtn}
                          onPress={() => setFontSize((f) => Math.max(12, f - 2))}
                        >
                          <Text style={styles.fontBtnText}>A-</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.fontBtn}
                          onPress={() => setFontSize((f) => Math.min(28, f + 2))}
                        >
                          <Text style={styles.fontBtnText}>A+</Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.tunerTriggerBtn}
                        onPress={() => setIsTunerOpen(true)}
                      >
                        <Mic color="#F59E0B" size={14} />
                        <Text style={styles.tunerTriggerText}>Tuner</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <ScrollView style={styles.stageScroll} contentContainerStyle={{ padding: 24, paddingBottom: 80 }}>
                    {renderStageContent(transposeContent(activeSong.content, transposeVal))}
                  </ScrollView>
                </>
              ) : (
                <View style={styles.emptyCenter}>
                  <Music color="#64748B" size={32} />
                  <Text style={styles.emptyText}>Repertuvardan bir parça seçin</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* TUNER MODALI */}
      <TunerModal visible={isTunerOpen} onClose={() => setIsTunerOpen(false)} />

      {/* BULUTTAN KODLA İÇE AKTARMA MODALI */}
      <Modal
        visible={isImportModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsImportModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsImportModalOpen(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.importModalBox}>
                <View style={styles.importHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Download color="#38BDF8" size={18} />
                    <Text style={styles.importTitle}>Buluttan Şarkı İçe Aktar</Text>
                  </View>
                  <TouchableOpacity onPress={() => setIsImportModalOpen(false)}>
                    <X color="#94A3B8" size={18} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.importDesc}>
                  Web portalında üretilen 6 haneli <Text style={{ color: '#38BDF8', fontWeight: 'bold' }}>MORF-XXXX</Text> kodunu girerek parçayı doğrudan Sahne Moduna aktarın:
                </Text>

                <TextInput
                  style={styles.codeInput}
                  placeholder="Örn: MORF-K8A9Z1"
                  placeholderTextColor="#64748B"
                  value={shareInputCode}
                  onChangeText={(text) => setShareInputCode(text.toUpperCase())}
                  autoCapitalize="characters"
                />

                <TouchableOpacity
                  style={[styles.confirmImportBtn, importLoading && { opacity: 0.6 }]}
                  disabled={importLoading}
                  onPress={handleImportSharedSong}
                >
                  {importLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Music color="#FFFFFF" size={15} />
                      <Text style={styles.confirmImportBtnText}>Sahneye Aktar & Çal</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070B13' },

  topGlobalBar: {
    height: 44,
    backgroundColor: '#070B13',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 99,
  },
  globalLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandTitle: { color: '#F8FAFC', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  brandBadge: { backgroundColor: '#1E293B', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 },
  brandBadgeText: { color: '#38BDF8', fontSize: 9, fontWeight: 'bold' },

  globalCenterSwitcher: { flexDirection: 'row', backgroundColor: '#0F172A', borderRadius: 6, padding: 2, gap: 4 },
  switcherBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 4 },
  switcherBtnActive: { backgroundColor: '#1E293B' },
  switcherText: { color: '#64748B', fontSize: 11, fontWeight: 'bold' },
  switcherTextActive: { color: '#38BDF8' },

  globalRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  importTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0C4A6E',
    borderWidth: 1,
    borderColor: '#0284C7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  importTriggerBtnText: { color: '#38BDF8', fontSize: 11, fontWeight: 'bold' },

  stageWrap: { flex: 1, flexDirection: 'row', backgroundColor: '#070B13' },
  stageSidebar: { width: 300, backgroundColor: '#090E1A', borderRightWidth: 1, borderRightColor: '#1E293B' },
  stageSidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  sidebarTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: 'bold' },
  songCountTag: { color: '#64748B', fontSize: 11, fontWeight: 'bold' },
  stageSongCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, backgroundColor: '#0F172A', borderRadius: 6, marginBottom: 5, borderWidth: 1, borderColor: '#1E293B' },
  stageSongCardActive: { borderColor: '#38BDF8', backgroundColor: '#161F30' },
  stageSongTitle: { color: '#F8FAFC', fontSize: 12, fontWeight: 'bold' },
  stageSongArtist: { color: '#64748B', fontSize: 10, marginTop: 2 },
  stageKeyBadge: { backgroundColor: '#1E293B', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  stageKeyText: { color: '#38BDF8', fontSize: 9, fontWeight: 'bold' },

  stageMain: { flex: 1, backgroundColor: '#05080F' },
  stageControlsBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#0B1120', borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  activeTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: 'bold' },
  activeArtist: { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  stageActionRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  transBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#161F30', padding: 3, borderRadius: 6 },
  circleBtn: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#0284C7', justifyContent: 'center', alignItems: 'center' },
  transValue: { color: '#F8FAFC', fontSize: 11, fontWeight: 'bold', minWidth: 20, textAlign: 'center' },
  fontBox: { flexDirection: 'row', gap: 4 },
  fontBtn: { backgroundColor: '#161F30', paddingVertical: 3, paddingHorizontal: 6, borderRadius: 4, borderWidth: 1, borderColor: '#334155' },
  fontBtnText: { color: '#94A3B8', fontSize: 10, fontWeight: 'bold' },
  tunerTriggerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#271E05', borderWidth: 1, borderColor: '#F59E0B', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 },
  tunerTriggerText: { color: '#F59E0B', fontSize: 11, fontWeight: 'bold' },

  stageScroll: { flex: 1 },
  lineBox: { marginBottom: 6 },
  chordOnlyText: { color: '#F87171', fontWeight: 'bold', lineHeight: 24 },
  chordLyricRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 10 },
  heceColumn: { flexDirection: 'column', alignItems: 'flex-start', marginRight: 1 },
  aboveChord: { color: '#F87171', fontWeight: '900', marginBottom: 2, letterSpacing: 0.5 },
  lyricText: { color: '#E2E8F0', lineHeight: 24 },

  emptyCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyText: { color: '#64748B', fontSize: 13 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  importModalBox: { width: '100%', maxWidth: 390, backgroundColor: '#0F172A', borderRadius: 12, padding: 18, borderWidth: 1, borderColor: '#1E293B' },
  importHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  importTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: 'bold' },
  importDesc: { color: '#94A3B8', fontSize: 11, lineHeight: 16, marginBottom: 14 },
  codeInput: {
    backgroundColor: '#161F30',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 12,
    outlineStyle: 'none',
  } as any,
  confirmImportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 6,
  },
  confirmImportBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
});