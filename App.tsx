import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Platform,
  Pressable,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from './src/lib/supabase';
import { ALL_TONES, transposeContent, transposeChord, isChordLine, CHORD_REGEX_STR } from './src/utils/chordEngine';
import { getChordVoicings, ChordVoicing } from './src/utils/chordDiagrams';
import { getPianoKeysForChord, PIANO_KEYS_2_OCTAVES } from './src/utils/pianoDiagrams';
import { getBassVoicings, BassVoicing } from './src/utils/bassDiagrams';
import TunerModal from './src/components/TunerModal';
import {
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowLeft,
  PlusCircle,
  X,
  Play,
  Pause,
  RotateCcw,
  Edit3,
  Trash2,
  ListMusic,
  ChevronRight,
  ChevronLeft,
  Volume2,
  Bookmark,
  Info,
  Share2,
  Download,
  Music,
  Layers,
  Sparkles,
  Layout,
} from 'lucide-react-native';

export type SourceType = 'MANUAL' | 'WEB' | 'PEER_SHARE' | 'AI_ARRANGED';

interface Song {
  id: string;
  title: string;
  artist: string;
  original_key: string;
  content: string;
  bpm?: number;
  capo?: string;
  rhythm?: string;
  notes?: string;
  source_type: SourceType;
  parent_id?: string | null;
  created_at?: string;
}

interface Setlist {
  id: string;
  name: string;
  song_ids: string[];
  created_at?: string;
}

type InstrumentType = 'guitar' | 'piano' | 'bass';
type FilterType = 'ALL' | 'MANUAL' | 'WEB' | 'PEER_SHARE' | 'AI_ARRANGED';

const MONO_FONT = Platform.select({
  web: 'monospace, "Courier New", Courier, monospace',
  default: 'monospace',
});

function MorpheusAppContent() {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  const isDesktop = screenWidth >= 1024;

  // Navigasyon & Filtre
  const [activeTab, setActiveTab] = useState<'songs' | 'setlists'>('songs');
  const [sourceFilter, setSourceFilter] = useState<FilterType>('ALL');

  // Veri Durumları
  const [songs, setSongs] = useState<Song[]>([]);
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [currentSetlist, setCurrentSetlist] = useState<Setlist | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sahne & Performans Motoru Durumları
  const [isNoteCardVisible, setIsNoteCardVisible] = useState(true);
  const [isTunerOpen, setIsTunerOpen] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>('guitar');
  const [transposeValue, setTransposeValue] = useState(0);
  const [selectedTone, setSelectedTone] = useState<string>('');
  const [isToneModalOpen, setIsToneModalOpen] = useState(false);
  const [fontSize, setFontSize] = useState(15);
  const [inspectedChord, setInspectedChord] = useState<string | null>(null);
  const [chordVoicingIndex, setChordVoicingIndex] = useState<number>(0);

  // Auto-Scroll Motoru
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2);
  const scrollRef = useRef<ScrollView>(null);
  const currentScrollY = useRef(0);
  const scrollIntervalRef = useRef<any>(null);

  // Metronom
  const [isBeatActive, setIsBeatActive] = useState(false);

  // Kod Paylaşım Modalları
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [generatedShareCode, setGeneratedShareCode] = useState('');
  const [inputShareCode, setInputShareCode] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Şarkı Ekleme / Düzenleme Formu
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formArtist, setFormArtist] = useState('');
  const [formOriginalKey, setFormOriginalKey] = useState('Am');
  const [formBpm, setFormBpm] = useState('100');
  const [formCapo, setFormCapo] = useState('Yok');
  const [formRhythm, setFormRhythm] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formContent, setFormContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Setlist Formu
  const [isSetlistModalOpen, setIsSetlistModalOpen] = useState(false);
  const [newSetlistName, setNewSetlistName] = useState('');
  const [selectedSongIdsForSetlist, setSelectedSongIdsForSetlist] = useState<string[]>([]);
  const [isSavingSetlist, setIsSavingSetlist] = useState(false);

  // Veritabanından Veri Çekme
  const loadRepertoire = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const [songsRes, setlistsRes] = await Promise.all([
        supabase.from('morfeus_songs').select('*').order('created_at', { ascending: false }),
        supabase.from('morfeus_setlists').select('*').order('created_at', { ascending: false }),
      ]);

      if (songsRes.error) throw songsRes.error;
      if (setlistsRes.error) throw setlistsRes.error;

      if (songsRes.data) setSongs(songsRes.data as Song[]);
      if (setlistsRes.data) setSetlists(setlistsRes.data as Setlist[]);
    } catch (err: any) {
      console.error('Kütüphane yüklenemedi:', err);
      setErrorMessage(err.message || 'Veritabanı bağlantı hatası.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepertoire();
  }, []);

  // Auto-Scroll Motoru
  useEffect(() => {
    if (isScrolling) {
      scrollIntervalRef.current = setInterval(() => {
        const step = scrollSpeed * 0.9;
        currentScrollY.current += step;
        scrollRef.current?.scrollTo({ y: currentScrollY.current, animated: false });
      }, 40);
    } else {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    }

    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, [isScrolling, scrollSpeed]);

  // Metronom Vuruşu
  useEffect(() => {
    if (!selectedSong?.bpm || selectedSong.bpm <= 0) return;
    const intervalMs = (60 / selectedSong.bpm) * 1000;
    const metronome = setInterval(() => {
      setIsBeatActive(true);
      setTimeout(() => setIsBeatActive(false), 120);
    }, intervalMs);

    return () => clearInterval(metronome);
  }, [selectedSong]);

  // Şarkı Seçimi
  const handleSelectSong = (song: Song, setlistContext: Setlist | null = null) => {
    setSelectedSong(song);
    setCurrentSetlist(setlistContext);
    setSelectedTone(song.original_key);
    setTransposeValue(0);
    setIsScrolling(false);
    setIsNoteCardVisible(true);
    currentScrollY.current = 0;
  };

  // Transpoze
  const handleTranspose = (step: number) => {
    setTransposeValue((prev) => prev + step);
    setSelectedTone((prev) => transposeChord(prev, step));
  };

  // Paylaşım Kodu Üretme (MORF-XXXXXX)
  const handleGenerateShareCode = async (song: Song) => {
    try {
      const code = 'MORF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const payload = {
        title: song.title,
        artist: song.artist,
        original_key: song.original_key,
        bpm: song.bpm || 100,
        capo: song.capo || 'Yok',
        rhythm: song.rhythm || '',
        notes: song.notes || '',
        content: song.content,
      };

      const { error } = await supabase.from('morfeus_shares').insert([
        {
          share_code: code,
          payload_type: 'SONG',
          payload: payload,
        },
      ]);

      if (error) throw error;
      setGeneratedShareCode(code);
      setIsShareModalOpen(true);
    } catch (err: any) {
      if (Platform.OS === 'web') {
        alert('Paylaşım kodu hatası: ' + err.message);
      } else {
        Alert.alert('Hata', 'Paylaşım kodu oluşturulamadı: ' + err.message);
      }
    }
  };

  // Kod İle Şarkı İçe Aktarma
  const handleImportSharedCode = async () => {
    if (!inputShareCode.trim()) {
      if (Platform.OS === 'web') alert('Lütfen geçerli bir kod girin.');
      else Alert.alert('Uyarı', 'Lütfen geçerli bir kod girin.');
      return;
    }

    try {
      setIsImporting(true);
      const cleanCode = inputShareCode.trim().toUpperCase();

      const { data, error } = await supabase
        .from('morfeus_shares')
        .select('*')
        .eq('share_code', cleanCode)
        .maybeSingle();

      if (error || !data) {
        if (Platform.OS === 'web') alert('Geçersiz veya süresi dolmuş kod.');
        else Alert.alert('Bulunamadı', 'Geçersiz veya süresi dolmuş kod.');
        return;
      }

      const incoming = data.payload;
      const newSongPayload = {
        title: incoming.title,
        artist: incoming.artist,
        original_key: incoming.original_key || 'Am',
        bpm: incoming.bpm || 100,
        capo: incoming.capo || 'Yok',
        rhythm: incoming.rhythm || '',
        notes: incoming.notes || '',
        content: incoming.content,
        source_type: 'PEER_SHARE' as SourceType,
      };

      const { data: insertedData, error: insertError } = await supabase
        .from('morfeus_songs')
        .insert([newSongPayload])
        .select();

      if (insertError) throw insertError;

      if (insertedData && insertedData.length > 0) {
        const saved = insertedData[0] as Song;
        setSongs((prev) => [saved, ...prev]);
        setIsImportModalOpen(false);
        setInputShareCode('');
        if (Platform.OS === 'web') alert(`"${saved.title}" sahne kütüphanenize eklendi.`);
        else Alert.alert('Başarılı', `"${saved.title}" sahne kütüphanenize eklendi.`);
        handleSelectSong(saved);
      }
    } catch (err: any) {
      if (Platform.OS === 'web') alert('İçe aktarma hatası: ' + err.message);
      else Alert.alert('Hata', err.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Şarkı Kaydet / Düzenle (Hata Korumalı)
  const handleSaveSong = async () => {
    if (!formTitle.trim() || !formArtist.trim() || !formContent.trim()) {
      if (Platform.OS === 'web') alert('Şarkı adı, sanatçı ve söz/akor alanları zorunludur.');
      else Alert.alert('Eksik Bilgi', 'Şarkı adı, sanatçı ve söz/akor alanları zorunludur.');
      return;
    }

    try {
      setIsSaving(true);
      const songPayload = {
        title: formTitle.trim(),
        artist: formArtist.trim(),
        original_key: formOriginalKey.trim() || 'Am',
        bpm: parseInt(formBpm, 10) || 100,
        capo: formCapo.trim(),
        rhythm: formRhythm.trim(),
        notes: formNotes.trim(),
        content: formContent,
        source_type: 'MANUAL' as SourceType,
      };

      if (editingSongId) {
        const { data, error } = await supabase
          .from('morfeus_songs')
          .update(songPayload)
          .eq('id', editingSongId)
          .select();

        if (error) throw error;
        if (data && data.length > 0) {
          const updated = data[0] as Song;
          setSongs((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          if (selectedSong?.id === updated.id) {
            setSelectedSong(updated);
            setSelectedTone(updated.original_key);
            setTransposeValue(0);
          }
        }
      } else {
        const { data, error } = await supabase
          .from('morfeus_songs')
          .insert([songPayload])
          .select();

        if (error) throw error;
        if (data && data.length > 0) {
          const created = data[0] as Song;
          setSongs((prev) => [created, ...prev]);
          handleSelectSong(created);
        }
      }

      setIsFormModalOpen(false);
    } catch (err: any) {
      console.error('Kayıt Hatası:', err);
      if (Platform.OS === 'web') {
        alert('Kayıt başarısız oldu: ' + (err.message || 'Veritabanı hatası'));
      } else {
        Alert.alert('Kayıt Hatası', err.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Şarkı Silme
  const handleDeleteSong = async (id: string) => {
    const confirmDelete = Platform.OS === 'web' 
      ? window.confirm('Bu şarkıyı sahne kütüphanenizden silmek istiyor musunuz?')
      : true;

    if (!confirmDelete) return;

    if (Platform.OS === 'web') {
      try {
        const { error } = await supabase.from('morfeus_songs').delete().eq('id', id);
        if (error) throw error;
        setSongs((prev) => prev.filter((s) => s.id !== id));
        if (selectedSong?.id === id) setSelectedSong(null);
      } catch (err: any) {
        alert('Silme hatası: ' + err.message);
      }
    } else {
      Alert.alert('Şarkıyı Sil', 'Bu şarkıyı sahne kütüphanenizden tamamen silmek istiyor musunuz?', [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('morfeus_songs').delete().eq('id', id);
              if (error) throw error;
              setSongs((prev) => prev.filter((s) => s.id !== id));
              if (selectedSong?.id === id) setSelectedSong(null);
            } catch (err: any) {
              Alert.alert('Hata', err.message);
            }
          },
        },
      ]);
    }
  };

  // 3 Enstrüman Diyagram Çizimi
  const renderGuitarDiagram = (chordName: string) => {
    const voicings: ChordVoicing[] = getChordVoicings(chordName);
    const strings = ['E', 'A', 'D', 'G', 'B', 'e'];
    const fretsCount = 4;

    if (!voicings || voicings.length === 0) {
      return (
        <View style={styles.diagramFallback}>
          <Text style={styles.fallbackTitle}>{chordName}</Text>
          <Text style={styles.fallbackDesc}>Bu akor için gitar diyagramı bulunamadı.</Text>
        </View>
      );
    }

    const currentVoicing = voicings[chordVoicingIndex] || voicings[0];
    const minFret = currentVoicing.baseFret;

    return (
      <View style={styles.diagramWrapper}>
        <Text style={styles.diagramTitle}>{chordName}</Text>
        <View style={styles.voicingNavBar}>
          <TouchableOpacity
            style={[styles.voicingNavBtn, chordVoicingIndex === 0 && { opacity: 0.3 }]}
            disabled={chordVoicingIndex === 0}
            onPress={() => setChordVoicingIndex((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft color="#06B6D4" size={18} />
          </TouchableOpacity>
          <Text style={styles.voicingCountText}>
            Gitar Pozisyonu {chordVoicingIndex + 1} / {voicings.length}
          </Text>
          <TouchableOpacity
            style={[styles.voicingNavBtn, chordVoicingIndex === voicings.length - 1 && { opacity: 0.3 }]}
            disabled={chordVoicingIndex === voicings.length - 1}
            onPress={() => setChordVoicingIndex((p) => Math.min(voicings.length - 1, p + 1))}
          >
            <ChevronRight color="#06B6D4" size={18} />
          </TouchableOpacity>
        </View>

        {minFret > 1 && <Text style={styles.fretIndicator}>{minFret}. Perde</Text>}

        <View style={styles.nutRow}>
          {currentVoicing.frets.map((fret, sIdx) => (
            <View key={sIdx} style={styles.nutIndicatorBox}>
              <Text
                style={[
                  styles.nutIndicatorText,
                  fret === -1 && { color: '#EF4444' },
                  fret === 0 && { color: '#10B981' },
                ]}
              >
                {fret === -1 ? '✕' : fret === 0 ? '○' : ''}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.fretboard}>
          {[...Array(fretsCount)].map((_, fIdx) => {
            const currentFretNum = minFret + fIdx;
            return (
              <View key={fIdx} style={styles.fretRow}>
                {[0, 1, 2, 3, 4, 5].map((sIdx) => {
                  const fingerFret = currentVoicing.frets[sIdx];
                  const hasDot = fingerFret === currentFretNum;
                  return (
                    <View key={sIdx} style={styles.fretStringCell}>
                      <View style={styles.verticalStringLine} />
                      {hasDot && <View style={styles.fingerDot} />}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>

        <View style={styles.stringNamesRow}>
          {strings.map((str, idx) => (
            <Text key={idx} style={styles.stringNameText}>
              {str}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  const renderBassDiagram = (chordName: string) => {
    const voicings: BassVoicing[] = getBassVoicings(chordName);
    const strings = ['E', 'A', 'D', 'G'];
    const fretsCount = 4;

    if (!voicings || voicings.length === 0) {
      return (
        <View style={styles.diagramFallback}>
          <Text style={styles.fallbackTitle}>{chordName}</Text>
          <Text style={styles.fallbackDesc}>Bu akor için bas diyagramı bulunamadı.</Text>
        </View>
      );
    }

    const currentVoicing = voicings[chordVoicingIndex] || voicings[0];
    const minFret = currentVoicing.baseFret;

    return (
      <View style={styles.diagramWrapper}>
        <Text style={styles.diagramTitle}>{chordName}</Text>
        <View style={styles.voicingNavBar}>
          <TouchableOpacity
            style={[styles.voicingNavBtn, chordVoicingIndex === 0 && { opacity: 0.3 }]}
            disabled={chordVoicingIndex === 0}
            onPress={() => setChordVoicingIndex((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft color="#06B6D4" size={18} />
          </TouchableOpacity>
          <Text style={styles.voicingCountText}>
            Bas Pozisyonu {chordVoicingIndex + 1} / {voicings.length}
          </Text>
          <TouchableOpacity
            style={[styles.voicingNavBtn, chordVoicingIndex === voicings.length - 1 && { opacity: 0.3 }]}
            disabled={chordVoicingIndex === voicings.length - 1}
            onPress={() => setChordVoicingIndex((p) => Math.min(voicings.length - 1, p + 1))}
          >
            <ChevronRight color="#06B6D4" size={18} />
          </TouchableOpacity>
        </View>

        {minFret > 1 && <Text style={styles.fretIndicator}>{minFret}. Perde</Text>}

        <View style={[styles.nutRow, { width: 140 }]}>
          {currentVoicing.frets.map((fret, sIdx) => (
            <View key={sIdx} style={styles.nutIndicatorBox}>
              <Text
                style={[
                  styles.nutIndicatorText,
                  fret === -1 && { color: '#EF4444' },
                  fret === 0 && { color: '#10B981' },
                ]}
              >
                {fret === -1 ? '✕' : fret === 0 ? '○' : ''}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.fretboard, { width: 140 }]}>
          {[...Array(fretsCount)].map((_, fIdx) => {
            const currentFretNum = minFret + fIdx;
            return (
              <View key={fIdx} style={styles.fretRow}>
                {[0, 1, 2, 3].map((sIdx) => {
                  const toneObj = currentVoicing.chordTones.find(
                    (t) => t.stringIdx === sIdx && t.fret === currentFretNum
                  );
                  return (
                    <View key={sIdx} style={styles.fretStringCell}>
                      <View
                        style={[
                          styles.verticalStringLine,
                          { width: sIdx === 0 ? 3.5 : sIdx === 1 ? 2.8 : sIdx === 2 ? 2.2 : 1.6 },
                        ]}
                      />
                      {toneObj && (
                        <View
                          style={[
                            styles.bassFingerDot,
                            toneObj.isRoot ? styles.bassRootDot : styles.bassToneDot,
                          ]}
                        >
                          <Text style={styles.bassToneText}>{toneObj.interval}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>

        <View style={[styles.stringNamesRow, { width: 140 }]}>
          {strings.map((str, idx) => (
            <Text key={idx} style={styles.stringNameText}>
              {str}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  const renderPianoDiagram = (chordName: string) => {
    const { activeSemitones, activeNoteNames } = getPianoKeysForChord(chordName);
    const whiteKeys = PIANO_KEYS_2_OCTAVES.filter((k) => !k.isBlack);

    return (
      <View style={styles.diagramWrapper}>
        <Text style={styles.diagramTitle}>{chordName}</Text>
        <View style={styles.pianoNotesList}>
          <Text style={styles.pianoNotesLabel}>Basılan Notalar: </Text>
          <Text style={styles.pianoNotesValue}>{activeNoteNames.join(' - ')}</Text>
        </View>

        <View style={styles.pianoKeyboardContainer}>
          <View style={styles.pianoWhiteKeysRow}>
            {whiteKeys.map((k) => {
              const isActive = activeSemitones.includes(k.semitone);
              return (
                <View
                  key={k.semitone}
                  style={[styles.pianoWhiteKey, isActive && styles.pianoWhiteKeyActive]}
                >
                  <Text style={[styles.pianoWhiteKeyLabel, isActive && styles.pianoKeyTextActive]}>
                    {k.note}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  // Filtrelenmiş Şarkı Listesi
  const filteredSongs = songs.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (sourceFilter === 'ALL') return true;
    return s.source_type === sourceFilter;
  });

  return (
    <SafeAreaView style={[styles.safeAreaContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="#080C15" />

      {/* REKLAM ALANI 1: Standart Yatay Leaderboard (728x90) */}
      <View style={styles.leaderboardAdBanner}>
        <View style={styles.adTagBadge}>
          <Text style={styles.adTagBadgeText}>REKLAM (728x90)</Text>
        </View>
        <Text style={styles.leaderboardText}>
          Morpheus Canlı Performans İstasyonu • Müzisyenler İçin Profesyonel Sahne Omurgası
        </Text>
      </View>

      <View style={styles.appRoot}>
        {selectedSong ? (
          /* ========================================================== */
          /* 1. SAHNE MODU (APP: KIRMIZI HAP KONSEPTİ)                  */
          /* ========================================================== */
          <View style={styles.stageContainer}>
            <View style={styles.stageHeader}>
              <TouchableOpacity
                style={styles.headerBackBtn}
                onPress={() => {
                  setSelectedSong(null);
                  setIsScrolling(false);
                }}
              >
                <ArrowLeft color="#F8FAFC" size={20} />
              </TouchableOpacity>

              <View style={styles.stageHeaderInfo}>
                <Text style={styles.stageSongTitle} numberOfLines={1}>
                  {selectedSong.title}
                </Text>
                <Text style={styles.stageSongArtist} numberOfLines={1}>
                  {selectedSong.artist} {currentSetlist ? `• [${currentSetlist.name}]` : ''}
                </Text>
              </View>

              <View style={styles.stageHeaderActions}>
                {selectedSong.bpm ? (
                  <View style={styles.bpmIndicatorBadge}>
                    <View style={[styles.bpmDot, isBeatActive && styles.bpmDotActive]} />
                    <Text style={styles.bpmText}>{selectedSong.bpm}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={styles.stageActionBtn}
                  onPress={() => handleGenerateShareCode(selectedSong)}
                >
                  <Share2 color="#06B6D4" size={17} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.stageActionBtn}
                  onPress={() => setIsTunerOpen(true)}
                >
                  <Volume2 color="#10B981" size={17} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.stageActionBtn}
                  onPress={() => handleDeleteSong(selectedSong.id)}
                >
                  <Trash2 color="#EF4444" size={17} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Ton, Enstrüman ve Transpoze Barı */}
            <View style={styles.stageSecondaryBar}>
              <View style={styles.toneSelectorBox}>
                <TouchableOpacity
                  style={styles.toneSelectorBtn}
                  onPress={() => setIsToneModalOpen(true)}
                >
                  <Text style={styles.toneSelectorLabel}>TON:</Text>
                  <Text style={styles.stageToneSelectorValue}>
                    {selectedTone || selectedSong.original_key}
                  </Text>
                  <ChevronDown color="#94A3B8" size={13} />
                </TouchableOpacity>

                <View style={styles.instrumentGroup}>
                  {(['guitar', 'piano', 'bass'] as InstrumentType[]).map((inst) => (
                    <TouchableOpacity
                      key={inst}
                      style={[styles.instTabBtn, selectedInstrument === inst && styles.instTabBtnActive]}
                      onPress={() => setSelectedInstrument(inst)}
                    >
                      <Text
                        style={[
                          styles.instTabText,
                          selectedInstrument === inst && styles.instTabTextActive,
                        ]}
                      >
                        {inst === 'guitar' ? 'Gitar' : inst === 'piano' ? 'Piyano' : 'Bas'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.stageFontTransposeGroup}>
                <TouchableOpacity
                  style={styles.fontAdjustBtn}
                  onPress={() => setFontSize((p) => Math.max(12, p - 1))}
                >
                  <Text style={styles.fontAdjustBtnText}>A-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.fontAdjustBtn}
                  onPress={() => setFontSize((p) => Math.min(26, p + 1))}
                >
                  <Text style={styles.fontAdjustBtnText}>A+</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.stageTransposeCircleBtn}
                  onPress={() => handleTranspose(-1)}
                >
                  <Minus color="#FFFFFF" size={14} />
                </TouchableOpacity>
                <Text style={styles.transposeStepBadge}>
                  {transposeValue > 0 ? `+${transposeValue}` : transposeValue}
                </Text>
                <TouchableOpacity
                  style={styles.stageTransposeCircleBtn}
                  onPress={() => handleTranspose(1)}
                >
                  <Plus color="#FFFFFF" size={14} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Şarkı İçeriği Scroll Alanı */}
            <ScrollView
              ref={scrollRef}
              style={styles.stageScrollArea}
              contentContainerStyle={[
                styles.stageScrollContent,
                { paddingBottom: insets.bottom + 140 },
              ]}
              onScroll={(e) => {
                if (!isScrolling) currentScrollY.current = e.nativeEvent.contentOffset.y;
              }}
              scrollEventThrottle={16}
            >
              {(selectedSong.capo || selectedSong.rhythm || selectedSong.notes) && (
                <View style={styles.stageInfoCard}>
                  <TouchableOpacity
                    style={styles.stageInfoHeader}
                    onPress={() => setIsNoteCardVisible(!isNoteCardVisible)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Bookmark color="#EF4444" size={15} />
                      <Text style={styles.stageInfoTitle}>Sahne Bilgisi</Text>
                    </View>
                    {isNoteCardVisible ? (
                      <ChevronUp color="#94A3B8" size={15} />
                    ) : (
                      <ChevronDown color="#94A3B8" size={15} />
                    )}
                  </TouchableOpacity>

                  {isNoteCardVisible && (
                    <View style={styles.stageInfoBody}>
                      <View style={styles.pillsRow}>
                        {selectedSong.capo ? (
                          <View style={styles.infoPill}>
                            <Text style={styles.infoPillLabel}>KAPO:</Text>
                            <Text style={styles.infoPillValue}>{selectedSong.capo}</Text>
                          </View>
                        ) : null}
                        {selectedSong.rhythm ? (
                          <View style={styles.infoPill}>
                            <Text style={styles.infoPillLabel}>RİTİM:</Text>
                            <Text style={styles.infoPillValue}>{selectedSong.rhythm}</Text>
                          </View>
                        ) : null}
                      </View>
                      {selectedSong.notes ? (
                        <View style={styles.notesBox}>
                          <Info color="#EF4444" size={13} style={{ marginTop: 2 }} />
                          <Text style={styles.notesBoxText}>{selectedSong.notes}</Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>
              )}

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.lyricsSheet}>
                  {transposeContent(selectedSong.content, transposeValue)
                    .split('\n')
                    .map((line, lIdx) => {
                      if (isChordLine(line)) {
                        return (
                          <Text
                            key={lIdx}
                            style={[
                              styles.stagePureChordLine,
                              { fontSize, lineHeight: fontSize * 1.5 },
                            ]}
                          >
                            {line}
                          </Text>
                        );
                      }

                      const parts = line.split(new RegExp(`(\\[${CHORD_REGEX_STR}\\])`, 'g'));
                      return (
                        <Text
                          key={lIdx}
                          style={[
                            styles.lyricRow,
                            { fontSize, lineHeight: fontSize * 1.6 },
                          ]}
                        >
                          {parts.map((p, pIdx) => {
                            const isBracket = p.startsWith('[') && p.endsWith(']');
                            if (isBracket) {
                              const cleanChord = p.slice(1, -1);
                              return (
                                <Text
                                  key={pIdx}
                                  style={styles.stageLyricChordTag}
                                  onPress={() => {
                                    setInspectedChord(cleanChord);
                                    setChordVoicingIndex(0);
                                  }}
                                >
                                  {cleanChord}
                                </Text>
                              );
                            }
                            return (
                              <Text key={pIdx} style={styles.lyricText}>
                                {p}
                              </Text>
                            );
                          })}
                        </Text>
                      );
                    })}
                </View>
              </ScrollView>
            </ScrollView>

            {/* Yüzen Kontrol Paneli */}
            <View style={[styles.floatingControls, { bottom: insets.bottom + 16 }]}>
              <TouchableOpacity
                style={[styles.scrollToggleBtn, isScrolling && styles.scrollToggleBtnActive]}
                onPress={() => setIsScrolling(!isScrolling)}
              >
                {isScrolling ? (
                  <Pause color="#FFFFFF" size={17} />
                ) : (
                  <Play color="#FFFFFF" size={17} fill="#FFFFFF" />
                )}
                <Text style={styles.scrollToggleBtnText}>
                  {isScrolling ? 'DURDUR' : 'KAYDIR'}
                </Text>
              </TouchableOpacity>

              <View style={styles.speedPillsContainer}>
                {[1, 2, 3, 4].map((spd) => (
                  <TouchableOpacity
                    key={spd}
                    style={[styles.speedPill, scrollSpeed === spd && styles.speedPillActiveStage]}
                    onPress={() => setScrollSpeed(spd)}
                  >
                    <Text
                      style={[
                        styles.speedPillText,
                        scrollSpeed === spd && styles.speedPillTextActive,
                      ]}
                    >
                      {spd}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.scrollResetBtn}
                onPress={() => {
                  setIsScrolling(false);
                  currentScrollY.current = 0;
                  scrollRef.current?.scrollTo({ y: 0, animated: true });
                }}
              >
                <RotateCcw color="#94A3B8" size={18} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ========================================================== */
          /* 2. REPERTUVAR VE SETLIST (WEB: MAVİ HAP / TURKUAZ KONSEPT)  */
          /* ========================================================== */
          <View style={styles.mainContainer}>
            <View style={styles.contentBoundedContainer}>
              <View style={styles.mainSplitLayout}>
                {/* SOL / ORTA BÖLÜM (REPERTUVAR) */}
                <View style={styles.primaryColumn}>
                  {/* Sekmeler */}
                  <View style={styles.mainTabsHeader}>
                    <TouchableOpacity
                      style={[styles.mainTabBtn, activeTab === 'songs' && styles.mainTabBtnActive]}
                      onPress={() => setActiveTab('songs')}
                    >
                      <Music
                        color={activeTab === 'songs' ? '#06B6D4' : '#64748B'}
                        size={16}
                      />
                      <Text
                        style={[
                          styles.mainTabBtnText,
                          activeTab === 'songs' && styles.mainTabBtnTextActive,
                        ]}
                      >
                        Şarkılarım ({songs.length})
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.mainTabBtn, activeTab === 'setlists' && styles.mainTabBtnActive]}
                      onPress={() => setActiveTab('setlists')}
                    >
                      <Layers
                        color={activeTab === 'setlists' ? '#06B6D4' : '#64748B'}
                        size={16}
                      />
                      <Text
                        style={[
                          styles.mainTabBtnText,
                          activeTab === 'setlists' && styles.mainTabBtnTextActive,
                        ]}
                      >
                        Setlistler ({setlists.length})
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Arama & Üst İşlemler */}
                  <View style={styles.topActionsRow}>
                    <View style={styles.searchBarBox}>
                      <Search color="#64748B" size={17} />
                      <TextInput
                        style={styles.searchBarInput}
                        placeholder="Şarkı veya sanatçı ara..."
                        placeholderTextColor="#64748B"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.iconSquareBtn}
                      onPress={() => setIsImportModalOpen(true)}
                    >
                      <Download color="#06B6D4" size={18} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.primaryAddBtn}
                      onPress={() => {
                        setEditingSongId(null);
                        setFormTitle('');
                        setFormArtist('');
                        setFormOriginalKey('Am');
                        setFormBpm('100');
                        setFormCapo('Yok');
                        setFormRhythm('');
                        setFormNotes('');
                        setFormContent('');
                        setIsFormModalOpen(true);
                      }}
                    >
                      <PlusCircle color="#080C15" size={18} />
                      <Text style={styles.primaryAddBtnText}>Şarkı Ekle</Text>
                    </TouchableOpacity>
                  </View>

                  {/* 5'li Kaynak Filtresi */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterScroll}
                    contentContainerStyle={styles.filterScrollContent}
                  >
                    {[
                      { key: 'ALL', label: 'Tümü' },
                      { key: 'MANUAL', label: 'Manuel' },
                      { key: 'WEB', label: 'Web' },
                      { key: 'AI_ARRANGED', label: 'AI Aranje' },
                      { key: 'PEER_SHARE', label: 'Paylaşılan' },
                    ].map((f) => (
                      <TouchableOpacity
                        key={f.key}
                        style={[
                          styles.filterChip,
                          sourceFilter === f.key && styles.filterChipActive,
                        ]}
                        onPress={() => setSourceFilter(f.key as FilterType)}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            sourceFilter === f.key && styles.filterChipTextActive,
                          ]}
                        >
                          {f.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Hata Uyarısı */}
                  {errorMessage && (
                    <View style={styles.errorBanner}>
                      <Text style={styles.errorBannerText}>{errorMessage}</Text>
                    </View>
                  )}

                  {/* Şarkı Listesi */}
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#06B6D4" />
                    </View>
                  ) : activeTab === 'songs' ? (
                    <ScrollView
                      style={styles.songListArea}
                      contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
                    >
                      {filteredSongs.map((song) => (
                        <TouchableOpacity
                          key={song.id}
                          style={styles.songListCard}
                          onPress={() => handleSelectSong(song)}
                        >
                          <View style={{ flex: 1, paddingRight: 10 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={styles.songListTitle}>{song.title}</Text>
                              {song.source_type === 'AI_ARRANGED' && (
                                <View style={styles.aiTagBadge}>
                                  <Text style={styles.aiTagText}>AI</Text>
                                </View>
                              )}
                              {song.source_type === 'WEB' && (
                                <View style={styles.webTagBadge}>
                                  <Text style={styles.webTagText}>WEB</Text>
                                </View>
                              )}
                              {song.source_type === 'PEER_SHARE' && (
                                <View style={styles.shareTagBadge}>
                                  <Text style={styles.shareTagText}>KOD</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.songListArtist}>{song.artist}</Text>
                          </View>

                          <View style={styles.cardRightMeta}>
                            <View style={styles.keyBadge}>
                              <Text style={styles.keyBadgeText}>{song.original_key}</Text>
                            </View>

                            <TouchableOpacity
                              style={styles.cardActionIcon}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleGenerateShareCode(song);
                              }}
                            >
                              <Share2 color="#06B6D4" size={15} />
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.cardActionIcon}
                              onPress={(e) => {
                                e.stopPropagation();
                                setEditingSongId(song.id);
                                setFormTitle(song.title);
                                setFormArtist(song.artist);
                                setFormOriginalKey(song.original_key);
                                setFormBpm(song.bpm?.toString() || '100');
                                setFormCapo(song.capo || 'Yok');
                                setFormRhythm(song.rhythm || '');
                                setFormNotes(song.notes || '');
                                setFormContent(song.content);
                                setIsFormModalOpen(true);
                              }}
                            >
                              <Edit3 color="#94A3B8" size={15} />
                            </TouchableOpacity>
                          </View>
                        </TouchableOpacity>
                      ))}

                      {filteredSongs.length === 0 && (
                        <View style={styles.emptyBox}>
                          <Text style={styles.emptyBoxText}>Bu kriterde kayıt bulunamadı.</Text>
                        </View>
                      )}
                    </ScrollView>
                  ) : (
                    /* Setlistler Görünümü */
                    <ScrollView
                      style={styles.songListArea}
                      contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
                    >
                      <View style={styles.setlistActionsRow}>
                        <Text style={styles.sectionHeaderTitle}>Konser Setlistleri</Text>
                        <TouchableOpacity
                          style={styles.primaryAddBtn}
                          onPress={() => {
                            setNewSetlistName('');
                            setSelectedSongIdsForSetlist([]);
                            setIsSetlistModalOpen(true);
                          }}
                        >
                          <PlusCircle color="#080C15" size={16} />
                          <Text style={styles.primaryAddBtnText}>Yeni Setlist</Text>
                        </TouchableOpacity>
                      </View>

                      {setlists.map((sl) => (
                        <View key={sl.id} style={styles.setlistBlock}>
                          <View style={styles.setlistBlockHeader}>
                            <View>
                              <Text style={styles.setlistBlockTitle}>{sl.name}</Text>
                              <Text style={styles.setlistBlockSubtitle}>{sl.song_ids.length} Şarkı</Text>
                            </View>
                            <TouchableOpacity
                              style={styles.cardActionIcon}
                              onPress={async () => {
                                await supabase.from('morfeus_setlists').delete().eq('id', sl.id);
                                setSetlists((prev) => prev.filter((item) => item.id !== sl.id));
                              }}
                            >
                              <Trash2 color="#EF4444" size={15} />
                            </TouchableOpacity>
                          </View>

                          <View style={styles.setlistSongsPreviewList}>
                            {sl.song_ids.map((sId, idx) => {
                              const s = songs.find((item) => item.id === sId);
                              if (!s) return null;
                              return (
                                <TouchableOpacity
                                  key={sId}
                                  style={styles.setlistPreviewRow}
                                  onPress={() => handleSelectSong(s, sl)}
                                >
                                  <Text style={styles.setlistSongIndex}>{idx + 1}.</Text>
                                  <Text style={styles.setlistSongName} numberOfLines={1}>
                                    {s.title} - {s.artist}
                                  </Text>
                                  <Text style={styles.setlistSongKey}>{s.original_key}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* SAĞ REKLAM ALANI 2: Standart Dikey Skyscraper (300x600) */}
                {isDesktop && (
                  <View style={styles.skyscraperAdColumn}>
                    <View style={styles.skyscraperAdCard}>
                      <View style={styles.adTagBadge}>
                        <Text style={styles.adTagBadgeText}>SPONSOR ALANI (300x600)</Text>
                      </View>
                      <View style={styles.adInnerContent}>
                        <Sparkles color="#06B6D4" size={32} />
                        <Text style={styles.adInnerTitle}>Morpheus AI Tarz Aranjörü</Text>
                        <Text style={styles.adInnerDesc}>
                          Seçtiğiniz şarkıları tek dokunuşla Jazz, Flamenco veya Arabesk tarzlarına dönüştürün.
                        </Text>
                        <View style={styles.adPill}>
                          <Text style={styles.adPillText}>Gemini 2.5 Mimarisi</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* ========================================================== */}
      {/* 3. MODALLAR VE DİYALOGLAR                                 */}
      {/* ========================================================== */}

      {/* 6 Haneli Şarkı Paylaşım Modalı */}
      <Modal visible={isShareModalOpen} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsShareModalOpen(false)}
        >
          <Pressable style={styles.modalCard}>
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalHeading}>Sahne Paylaşım Kodu</Text>
              <TouchableOpacity onPress={() => setIsShareModalOpen(false)}>
                <X color="#94A3B8" size={20} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubheading}>
              Bu 6 haneli kodu diğer müzisyenle paylaşın:
            </Text>
            <View style={styles.shareCodeDisplay}>
              <Text style={styles.shareCodeDigits}>{generatedShareCode}</Text>
            </View>
          </Pressable>
        </TouchableOpacity>
      </Modal>

      {/* Kod İle Şarkı İçe Aktarma Modalı */}
      <Modal visible={isImportModalOpen} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsImportModalOpen(false)}
        >
          <Pressable style={styles.modalCard}>
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalHeading}>Şarkı Klonla / İçe Aktar</Text>
              <TouchableOpacity onPress={() => setIsImportModalOpen(false)}>
                <X color="#94A3B8" size={20} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubheading}>
              Size iletilen MORF-XXXXXX kodunu girin:
            </Text>
            <TextInput
              style={styles.importCodeInput}
              placeholder="Örn: MORF-ABC123"
              placeholderTextColor="#64748B"
              value={inputShareCode}
              onChangeText={setInputShareCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={styles.modalFullBtn}
              onPress={handleImportSharedCode}
              disabled={isImporting}
            >
              <Text style={styles.modalFullBtnText}>
                {isImporting ? 'Klonlanıyor...' : 'Repertuvara Ekle'}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </TouchableOpacity>
      </Modal>

      {/* Şarkı Ekle / Düzenle Modalı (Geliştirilmiş & Hata Korumalı) */}
      <Modal visible={isFormModalOpen} animationType="slide" transparent>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsFormModalOpen(false)}
        >
          <Pressable style={[styles.modalCard, { maxHeight: '85%' }]}>
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalHeading}>
                {editingSongId ? 'Şarkıyı Düzenle' : 'Yeni Şarkı Ekle'}
              </Text>
              <TouchableOpacity onPress={() => setIsFormModalOpen(false)}>
                <X color="#94A3B8" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ marginTop: 12 }}>
              <TextInput
                style={styles.formInputField}
                placeholder="Şarkı Adı"
                placeholderTextColor="#64748B"
                value={formTitle}
                onChangeText={setFormTitle}
              />
              <TextInput
                style={styles.formInputField}
                placeholder="Sanatçı"
                placeholderTextColor="#64748B"
                value={formArtist}
                onChangeText={setFormArtist}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={[styles.formInputField, { flex: 1 }]}
                  placeholder="Ton (Am)"
                  placeholderTextColor="#64748B"
                  value={formOriginalKey}
                  onChangeText={setFormOriginalKey}
                />
                <TextInput
                  style={[styles.formInputField, { flex: 1 }]}
                  placeholder="BPM (100)"
                  placeholderTextColor="#64748B"
                  value={formBpm}
                  onChangeText={setFormBpm}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.formInputField, { flex: 1 }]}
                  placeholder="Kapo"
                  placeholderTextColor="#64748B"
                  value={formCapo}
                  onChangeText={setFormCapo}
                />
              </View>
              <TextInput
                style={styles.formInputField}
                placeholder="Ritim / Arpej Notu"
                placeholderTextColor="#64748B"
                value={formRhythm}
                onChangeText={setFormRhythm}
              />
              <TextInput
                style={styles.formInputField}
                placeholder="Sahne Performans Notu"
                placeholderTextColor="#64748B"
                value={formNotes}
                onChangeText={setFormNotes}
              />
              <TextInput
                style={[styles.formInputField, styles.formTextArea]}
                placeholder="[Am] Şarkı sözleri ve akorlar..."
                placeholderTextColor="#64748B"
                value={formContent}
                onChangeText={setFormContent}
                multiline
              />
              <TouchableOpacity
                style={[styles.modalFullBtn, isSaving && { opacity: 0.6 }]}
                onPress={handleSaveSong}
                disabled={isSaving}
              >
                <Text style={styles.modalFullBtnText}>
                  {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </TouchableOpacity>
      </Modal>

      {/* Ton Değiştirme Modalı */}
      <Modal visible={isToneModalOpen} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsToneModalOpen(false)}
        >
          <Pressable style={styles.modalCard}>
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalHeading}>Ton Seçin</Text>
              <TouchableOpacity onPress={() => setIsToneModalOpen(false)}>
                <X color="#94A3B8" size={20} />
              </TouchableOpacity>
            </View>
            <View style={styles.toneGridBox}>
              {ALL_TONES.map((tone) => (
                <TouchableOpacity
                  key={tone}
                  style={[styles.toneGridCell, selectedTone === tone && styles.toneGridCellActive]}
                  onPress={() => {
                    setSelectedTone(tone);
                    setIsToneModalOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.toneGridCellText,
                      selectedTone === tone && styles.toneGridCellTextActive,
                    ]}
                  >
                    {tone}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </TouchableOpacity>
      </Modal>

      {/* 3 Enstrüman Akor İnceleme Modalı */}
      <Modal visible={!!inspectedChord} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setInspectedChord(null)}
        >
          <Pressable style={styles.modalCard}>
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalHeading}>
                {selectedInstrument === 'guitar'
                  ? 'Gitar Akoru'
                  : selectedInstrument === 'bass'
                  ? 'Bas Gitar Akoru'
                  : 'Piyano Akoru'}
              </Text>
              <TouchableOpacity onPress={() => setInspectedChord(null)}>
                <X color="#94A3B8" size={20} />
              </TouchableOpacity>
            </View>

            {inspectedChord &&
              (selectedInstrument === 'guitar'
                ? renderGuitarDiagram(inspectedChord)
                : selectedInstrument === 'bass'
                ? renderBassDiagram(inspectedChord)
                : renderPianoDiagram(inspectedChord))}
          </Pressable>
        </TouchableOpacity>
      </Modal>

      {/* Tuner Modalı */}
      <TunerModal visible={isTunerOpen} onClose={() => setIsTunerOpen(false)} />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MorpheusAppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#080C15',
  },
  leaderboardAdBanner: {
    height: 70,
    backgroundColor: '#0B1120',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  adTagBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: '#06B6D4',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  adTagBadgeText: {
    color: '#06B6D4',
    fontSize: 9,
    fontWeight: '900',
  },
  leaderboardText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  appRoot: {
    flex: 1,
    backgroundColor: '#080C15',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#080C15',
  },
  contentBoundedContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  mainSplitLayout: {
    flex: 1,
    flexDirection: 'row',
    gap: 20,
  },
  primaryColumn: {
    flex: 1,
  },
  skyscraperAdColumn: {
    width: 300,
    paddingTop: 12,
  },
  skyscraperAdCard: {
    height: 600,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adInnerContent: {
    alignItems: 'center',
    textAlign: 'center',
    gap: 12,
    marginTop: 20,
  },
  adInnerTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  adInnerDesc: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  adPill: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#06B6D4',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  adPillText: {
    color: '#06B6D4',
    fontSize: 11,
    fontWeight: 'bold',
  },
  mainTabsHeader: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  mainTabBtnActive: {
    borderBottomColor: '#06B6D4',
    backgroundColor: '#161F30',
  },
  mainTabBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mainTabBtnTextActive: {
    color: '#06B6D4',
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    gap: 8,
  },
  searchBarBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  searchBarInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 12,
    outlineStyle: 'none',
  } as any,
  iconSquareBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06B6D4',
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  primaryAddBtnText: {
    color: '#080C15',
    fontWeight: 'bold',
    fontSize: 12,
  },
  filterScroll: {
    maxHeight: 44,
    marginTop: 8,
  },
  filterScrollContent: {
    alignItems: 'center',
    gap: 6,
  },
  filterChip: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 8,
  },
  filterChipActive: {
    backgroundColor: '#161F30',
    borderColor: '#06B6D4',
  },
  filterChipText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: 'bold',
  },
  filterChipTextActive: {
    color: '#06B6D4',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  errorBannerText: {
    color: '#EF4444',
    fontSize: 11,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  songListArea: {
    flex: 1,
    marginTop: 10,
  },
  songListCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  songListTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold',
  },
  songListArtist: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 3,
  },
  aiTagBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  aiTagText: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '900',
  },
  webTagBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: '#06B6D4',
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  webTagText: {
    color: '#06B6D4',
    fontSize: 9,
    fontWeight: '900',
  },
  shareTagBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 4,
  },
  shareTagText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '900',
  },
  cardRightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  keyBadge: {
    backgroundColor: '#1E293B',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 5,
  },
  keyBadgeText: {
    color: '#06B6D4',
    fontWeight: 'bold',
    fontSize: 11,
  },
  cardActionIcon: {
    padding: 6,
    backgroundColor: '#161F30',
    borderRadius: 6,
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyBoxText: {
    color: '#64748B',
    fontSize: 12,
  },
  setlistActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 8,
  },
  sectionHeaderTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: 'bold',
  },
  setlistBlock: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 12,
    marginBottom: 10,
  },
  setlistBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 8,
    marginBottom: 8,
  },
  setlistBlockTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold',
  },
  setlistBlockSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 1,
  },
  setlistSongsPreviewList: {
    gap: 4,
  },
  setlistPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#161F30',
    borderRadius: 6,
  },
  setlistSongIndex: {
    color: '#06B6D4',
    fontSize: 11,
    fontWeight: 'bold',
    width: 22,
  },
  setlistSongName: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 11,
  },
  setlistSongKey: {
    color: '#06B6D4',
    fontSize: 11,
    fontWeight: 'bold',
  },
  stageContainer: {
    flex: 1,
    backgroundColor: '#080C15',
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    gap: 10,
  },
  headerBackBtn: {
    padding: 6,
  },
  stageHeaderInfo: {
    flex: 1,
  },
  stageSongTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  stageSongArtist: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  stageHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bpmIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 5,
  },
  bpmDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#64748B',
  },
  bpmDotActive: {
    backgroundColor: '#EF4444',
    transform: [{ scale: 1.4 }],
  },
  bpmText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  stageActionBtn: {
    padding: 7,
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  stageSecondaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#161F30',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  toneSelectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toneSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  toneSelectorLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  stageToneSelectorValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  instrumentGroup: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 6,
    padding: 2,
    borderWidth: 1,
    borderColor: '#334155',
  },
  instTabBtn: {
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 4,
  },
  instTabBtnActive: {
    backgroundColor: '#1E293B',
  },
  instTabText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: 'bold',
  },
  instTabTextActive: {
    color: '#EF4444',
  },
  stageFontTransposeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  fontAdjustBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  fontAdjustBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  stageTransposeCircleBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transposeStepBadge: {
    color: '#F8FAFC',
    fontWeight: 'bold',
    fontSize: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  stageScrollArea: {
    flex: 1,
  },
  stageScrollContent: {
    padding: 16,
  },
  stageInfoCard: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
    overflow: 'hidden',
  },
  stageInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#161F30',
  },
  stageInfoTitle: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: 'bold',
  },
  stageInfoBody: {
    padding: 10,
    gap: 8,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  infoPill: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 5,
    gap: 4,
  },
  infoPillLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  infoPillValue: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: 'bold',
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1E293B',
    padding: 8,
    borderRadius: 6,
    gap: 6,
  },
  notesBoxText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 16,
  },
  lyricsSheet: {
    minWidth: '100%',
  },
  stagePureChordLine: {
    fontFamily: MONO_FONT,
    color: '#EF4444',
    fontWeight: 'bold',
    whiteSpace: 'pre',
  } as any,
  lyricRow: {
    fontFamily: MONO_FONT,
    whiteSpace: 'pre',
  } as any,
  stageLyricChordTag: {
    color: '#EF4444',
    fontWeight: 'bold',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 3,
  },
  lyricText: {
    color: '#E2E8F0',
    fontFamily: MONO_FONT,
  },
  floatingControls: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 6,
  },
  scrollToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
  },
  scrollToggleBtnActive: {
    backgroundColor: '#EF4444',
  },
  scrollToggleBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 11,
  },
  speedPillsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  speedPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  speedPillActiveStage: {
    backgroundColor: '#EF4444',
  },
  speedPillText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  speedPillTextActive: {
    color: '#FFFFFF',
  },
  scrollResetBtn: {
    padding: 6,
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 20,
  },
  modalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeading: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalSubheading: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 6,
    marginBottom: 14,
  },
  shareCodeDisplay: {
    backgroundColor: '#161F30',
    borderWidth: 1,
    borderColor: '#06B6D4',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  shareCodeDigits: {
    color: '#06B6D4',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  importCodeInput: {
    backgroundColor: '#161F30',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 1.5,
    outlineStyle: 'none',
  } as any,
  formInputField: {
    backgroundColor: '#161F30',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#F8FAFC',
    fontSize: 12,
    marginBottom: 8,
    outlineStyle: 'none',
  } as any,
  formTextArea: {
    height: 180,
    textAlignVertical: 'top',
    fontFamily: MONO_FONT,
    whiteSpace: 'pre',
  } as any,
  modalFullBtn: {
    backgroundColor: '#06B6D4',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  modalFullBtnText: {
    color: '#080C15',
    fontWeight: 'bold',
    fontSize: 12,
  },
  toneGridBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginTop: 10,
  },
  toneGridCell: {
    width: '22%',
    paddingVertical: 10,
    backgroundColor: '#161F30',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  toneGridCellActive: {
    backgroundColor: '#06B6D4',
    borderColor: '#06B6D4',
  },
  toneGridCellText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: 'bold',
  },
  toneGridCellTextActive: {
    color: '#080C15',
  },
  diagramWrapper: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 4,
  },
  diagramTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#06B6D4',
    marginBottom: 6,
  },
  voicingNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#161F30',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  voicingNavBtn: {
    padding: 4,
    backgroundColor: '#1E293B',
    borderRadius: 6,
  },
  voicingCountText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#06B6D4',
  },
  fretIndicator: {
    fontSize: 12,
    color: '#06B6D4',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  nutRow: {
    flexDirection: 'row',
    width: 160,
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nutIndicatorBox: {
    width: 20,
    alignItems: 'center',
  },
  nutIndicatorText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
  },
  fretboard: {
    width: 160,
    borderTopWidth: 3,
    borderTopColor: '#E2E8F0',
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
    backgroundColor: '#0F172A',
  },
  fretRow: {
    flexDirection: 'row',
    height: 34,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  fretStringCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  verticalStringLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: '#64748B',
  },
  fingerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#06B6D4',
    zIndex: 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  bassFingerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  bassRootDot: {
    backgroundColor: '#06B6D4',
  },
  bassToneDot: {
    backgroundColor: '#EF4444',
  },
  bassToneText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  stringNamesRow: {
    flexDirection: 'row',
    width: 160,
    justifyContent: 'space-between',
    marginTop: 6,
  },
  stringNameText: {
    width: 20,
    textAlign: 'center',
    color: '#64748B',
    fontSize: 11,
    fontWeight: 'bold',
  },
  pianoNotesList: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161F30',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  pianoNotesLabel: {
    color: '#94A3B8',
    fontSize: 11,
  },
  pianoNotesValue: {
    color: '#06B6D4',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pianoKeyboardContainer: {
    width: 320,
    height: 110,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    overflow: 'hidden',
  },
  pianoWhiteKeysRow: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
  },
  pianoWhiteKey: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRightWidth: 1,
    borderRightColor: '#94A3B8',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 6,
  },
  pianoWhiteKeyActive: {
    backgroundColor: '#06B6D4',
  },
  pianoWhiteKeyLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#334155',
  },
  pianoKeyTextActive: {
    color: '#FFFFFF',
  },
  diagramFallback: {
    padding: 16,
    alignItems: 'center',
  },
  fallbackTitle: {
    fontSize: 18,
    color: '#F8FAFC',
    fontWeight: 'bold',
  },
  fallbackDesc: {
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
    fontSize: 12,
  },
});