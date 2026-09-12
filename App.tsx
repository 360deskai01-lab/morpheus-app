import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { supabase } from './src/lib/supabase';
import { ALL_TONES, transposeContent, transposeChord, isChordLine } from './src/utils/chordEngine';
import { getChordVoicings } from './src/utils/chordDiagrams';
import { getPianoKeysForChord, PIANO_KEYS_2_OCTAVES } from './src/utils/pianoDiagrams';
import { getBassVoicings } from './src/utils/bassDiagrams';
import TunerModal from './src/components/TunerModal';
import MorpheusWebPortal from './src/components/MorpheusWebPortal';
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
  Volume2,
  Bookmark,
  Share2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Globe,
  Music,
  Download,
} from 'lucide-react-native';

export type SourceType = 'ALL' | 'MANUAL' | 'WEB' | 'AI_ARRANGED' | 'PEER_SHARE';
type ActivePlatformTab = 'STAGE' | 'WEB_PORTAL';

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
  source_type?: string;
}

type InstrumentType = 'guitar' | 'piano' | 'bass';
type SortMode = 'TITLE' | 'ARTIST';

const TURKISH_ALPHABET = [
  'A', 'B', 'C', 'Ç', 'D', 'E', 'F', 'G', 'H', 'I', 'İ',
  'J', 'K', 'L', 'M', 'N', 'O', 'Ö', 'P', 'R', 'S', 'Ş',
  'T', 'U', 'Ü', 'V', 'Y', 'Z'
];

const MONO_FONT = Platform.select({
  web: 'Consolas, Monaco, "Courier New", monospace',
  default: 'monospace',
});

export default function App() {
  const [platformTab, setPlatformTab] = useState<ActivePlatformTab>('WEB_PORTAL');
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('TITLE');
  const [sourceFilter, setSourceFilter] = useState<SourceType>('ALL');
  const [loading, setLoading] = useState(true);

  // Sahne ve Transpoze
  const [transposeValue, setTransposeValue] = useState(0);
  const [selectedTone, setSelectedTone] = useState<string>('');
  const [isToneModalOpen, setIsToneModalOpen] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>('guitar');
  const [isNoteCardVisible, setIsNoteCardVisible] = useState(true);
  const [isTunerOpen, setIsTunerOpen] = useState(false);

  // Auto-Scroll
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2);
  const scrollRef = useRef<ScrollView>(null);
  const currentScrollY = useRef(0);
  const scrollIntervalRef = useRef<any>(null);

  // BPM Metronom
  const [isBeatActive, setIsBeatActive] = useState(false);

  // Akor Pop-up
  const [inspectedChord, setInspectedChord] = useState<string | null>(null);
  const [chordVoicingIndex, setChordVoicingIndex] = useState(0);

  // Modallar
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCodeInput, setImportCodeInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newOriginalKey, setNewOriginalKey] = useState('Am');
  const [newBpm, setNewBpm] = useState('100');
  const [newCapo, setNewCapo] = useState('Yok');
  const [newRhythm, setNewRhythm] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [generatedShareCode, setGeneratedShareCode] = useState('');

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('morfeus_songs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setSongs(data);
    } catch (err) {
      console.error('Şarkılar yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    if (!selectedSong?.bpm || selectedSong.bpm <= 0) return;
    const intervalMs = (60 / selectedSong.bpm) * 1000;
    const metronome = setInterval(() => {
      setIsBeatActive(true);
      setTimeout(() => setIsBeatActive(false), 120);
    }, intervalMs);
    return () => clearInterval(metronome);
  }, [selectedSong]);

  const handleSelectSong = (songItem: Song) => {
    setSelectedSong(songItem);
    setSelectedTone(songItem.original_key);
    setTransposeValue(0);
    setIsScrolling(false);
    currentScrollY.current = 0;
  };

  const handleTranspose = (step: number) => {
    setTransposeValue((prev) => prev + step);
    setSelectedTone((prev) => transposeChord(prev, step));
  };

  const handleOpenChordModal = (chord: string) => {
    setInspectedChord(chord);
    setChordVoicingIndex(0);
  };

  const handleGenerateShareCode = async (song: Song) => {
    try {
      const code = 'MORF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const { error } = await supabase.from('morfeus_shares').insert([
        {
          share_code: code,
          payload_type: 'SONG',
          payload: song,
        },
      ]);
      if (error) throw error;
      setGeneratedShareCode(code);
      setIsShareModalOpen(true);
    } catch (err: any) {
      alert('Paylaşım kodu hatası: ' + err.message);
    }
  };

  const handleImportByCode = async () => {
    const code = importCodeInput.trim().toUpperCase();
    if (!code) {
      alert('Lütfen geçerli bir kod girin (Örn: MORF-XXXXXX)');
      return;
    }

    try {
      setIsImporting(true);
      const { data, error } = await supabase
        .from('morfeus_shares')
        .select('*')
        .eq('share_code', code)
        .single();

      if (error || !data) {
        alert('Bu koda ait şarkı bulunamadı.');
        return;
      }

      const songPayload = data.payload;
      const { data: insertedData, error: insErr } = await supabase
        .from('morfeus_songs')
        .insert([
          {
            title: songPayload.title,
            artist: songPayload.artist,
            original_key: songPayload.original_key || 'Am',
            bpm: songPayload.bpm || 100,
            capo: songPayload.capo || 'Yok',
            rhythm: songPayload.rhythm || '',
            notes: songPayload.notes || '',
            content: songPayload.content,
            source_type: 'PEER_SHARE',
          },
        ])
        .select();

      if (insErr) throw insErr;

      if (insertedData && insertedData.length > 0) {
        setSongs([insertedData[0], ...songs]);
        handleSelectSong(insertedData[0]);
        setIsImportModalOpen(false);
        setImportCodeInput('');
        setPlatformTab('STAGE');
      }
    } catch (err: any) {
      alert('İçe aktarma hatası: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteSong = async (id: string) => {
    if (!confirm('Bu şarkıyı silmek istediğinize emin misiniz?')) return;
    try {
      const { error } = await supabase.from('morfeus_songs').delete().eq('id', id);
      if (error) throw error;
      setSongs((prev) => prev.filter((s) => s.id !== id));
      if (selectedSong?.id === id) setSelectedSong(null);
    } catch (e: any) {
      alert('Silme hatası: ' + e.message);
    }
  };

  const handleSaveSong = async () => {
    if (!newTitle.trim() || !newArtist.trim() || !newContent.trim()) {
      alert('Lütfen şarkı adı, sanatçı ve akor/söz alanlarını doldurun.');
      return;
    }

    try {
      setIsSaving(true);
      const { data, error } = await supabase
        .from('morfeus_songs')
        .insert([
          {
            title: newTitle.trim(),
            artist: newArtist.trim(),
            original_key: newOriginalKey.trim() || 'Am',
            bpm: parseInt(newBpm, 10) || 100,
            capo: newCapo.trim(),
            rhythm: newRhythm.trim(),
            notes: newNotes.trim(),
            content: newContent,
            source_type: 'MANUAL',
          },
        ])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setSongs([data[0], ...songs]);
        handleSelectSong(data[0]);
        setIsAddModalOpen(false);
        setNewTitle('');
        setNewArtist('');
        setNewRhythm('');
        setNewNotes('');
        setNewContent('');
      }
    } catch (err: any) {
      alert('Kayıt hatası: ' + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  const renderStageContent = (content: string) => {
    const lines = content.split('\n');

    return lines.map((line, lineIdx) => {
      if (isChordLine(line)) {
        const tokens = line.split(/(\s+)/);
        return (
          <View key={lineIdx} style={styles.lineWrapper}>
            <Text style={[styles.chordOnlyLineText, { fontSize, fontFamily: MONO_FONT }]}>
              {tokens.map((tok, tIdx) => {
                if (!tok.trim()) return tok;
                return (
                  <Text
                    key={tIdx}
                    style={styles.clickableChord}
                    onPress={() => handleOpenChordModal(tok.trim())}
                  >
                    {tok}
                  </Text>
                );
              })}
            </Text>
          </View>
        );
      }

      if (line.includes('[')) {
        const parts = line.split(/(\[[^\]]+\])/g);
        const pairs: { chord: string; lyric: string }[] = [];

        let currentChord = '';
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (part.startsWith('[') && part.endsWith(']')) {
            currentChord = part.slice(1, -1);
          } else {
            pairs.push({ chord: currentChord, lyric: part });
            currentChord = '';
          }
        }
        if (currentChord) pairs.push({ chord: currentChord, lyric: '' });

        return (
          <View key={lineIdx} style={styles.chordOverLyricLine}>
            {pairs.map((p, pIdx) => (
              <View key={pIdx} style={styles.chordSyllableCol}>
                <TouchableOpacity
                  disabled={!p.chord}
                  onPress={() => p.chord && handleOpenChordModal(p.chord)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chordAboveText,
                      { fontSize: Math.max(13, fontSize - 2), opacity: p.chord ? 1 : 0 },
                    ]}
                  >
                    {p.chord || '-'}
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.lyricsText, { fontSize, fontFamily: MONO_FONT }]}>
                  {p.lyric || (p.chord ? ' ' : '')}
                </Text>
              </View>
            ))}
          </View>
        );
      }

      return (
        <View key={lineIdx} style={styles.lineWrapper}>
          <Text style={[styles.lyricsText, { fontSize, fontFamily: MONO_FONT }]}>
            {line || ' '}
          </Text>
        </View>
      );
    });
  };

  const filteredSongs = songs
    .filter((s) => {
      const matchSearch =
        s.title.toLocaleLowerCase('tr').includes(searchQuery.toLocaleLowerCase('tr')) ||
        s.artist.toLocaleLowerCase('tr').includes(searchQuery.toLocaleLowerCase('tr'));
      if (!matchSearch) return false;

      if (sourceFilter !== 'ALL' && s.source_type !== sourceFilter) {
        return false;
      }

      if (selectedLetter) {
        const targetString = sortMode === 'TITLE' ? s.title : s.artist;
        return targetString.trim().toLocaleUpperCase('tr').startsWith(selectedLetter);
      }
      return true;
    })
    .sort((a, b) => {
      const fieldA = sortMode === 'TITLE' ? a.title : a.artist;
      const fieldB = sortMode === 'TITLE' ? b.title : b.artist;
      return fieldA.localeCompare(fieldB, 'tr');
    });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070B13" />

      {/* PLATFORM ÜST SEKME SEÇİCİSİ */}
      <View style={styles.platformNavHeader}>
        <View style={styles.platformBrand}>
          <Text style={styles.brandMorpheus}>MORPHEUS</Text>
          <Text style={styles.brandMusic}>MUSIC</Text>
        </View>

        <View style={styles.platformTabGroup}>
          <TouchableOpacity
            style={[styles.platformTabBtn, platformTab === 'STAGE' && styles.platformTabBtnActive]}
            onPress={() => setPlatformTab('STAGE')}
          >
            <Music color={platformTab === 'STAGE' ? '#38BDF8' : '#64748B'} size={15} />
            <Text
              style={[
                styles.platformTabText,
                platformTab === 'STAGE' && styles.platformTabTextActive,
              ]}
            >
              Morpheus Sahne
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.platformTabBtn,
              platformTab === 'WEB_PORTAL' && styles.platformTabBtnActive,
            ]}
            onPress={() => setPlatformTab('WEB_PORTAL')}
          >
            <Globe color={platformTab === 'WEB_PORTAL' ? '#38BDF8' : '#64748B'} size={15} />
            <Text
              style={[
                styles.platformTabText,
                platformTab === 'WEB_PORTAL' && styles.platformTabTextActive,
              ]}
            >
              Web Portalı (3-Kolon)
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.importCodeBtn}
          onPress={() => setIsImportModalOpen(true)}
        >
          <Download color="#38BDF8" size={14} />
          <Text style={styles.importCodeBtnText}>Kodla Aktar</Text>
        </TouchableOpacity>
      </View>

      {/* PLATFORM KOŞULU: WEB_PORTAL MI, STAGE APP Mİ? */}
      {platformTab === 'WEB_PORTAL' ? (
        <MorpheusWebPortal
          onSendToStage={(webSong) => {
            handleSelectSong(webSong);
            setPlatformTab('STAGE');
          }}
        />
      ) : (
        <View style={styles.mainWrapper}>
          <View style={styles.contentCard}>
            {selectedSong ? (
              <>
                <View style={styles.header}>
                  <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => {
                      setSelectedSong(null);
                      setIsScrolling(false);
                    }}
                  >
                    <ArrowLeft color="#F8FAFC" size={20} />
                  </TouchableOpacity>
                  <View style={{ flex: 1, marginHorizontal: 10 }}>
                    <Text style={styles.title} numberOfLines={1}>
                      {selectedSong.title}
                    </Text>
                    <Text style={styles.artist} numberOfLines={1}>
                      {selectedSong.artist}
                    </Text>
                  </View>

                  {selectedSong.bpm ? (
                    <View style={styles.bpmBadge}>
                      <View style={[styles.bpmDot, isBeatActive && styles.bpmDotActive]} />
                      <Text style={styles.bpmText}>{selectedSong.bpm} BPM</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={styles.topIconBtn}
                    onPress={() => handleGenerateShareCode(selectedSong)}
                  >
                    <Share2 color="#38BDF8" size={17} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.topIconBtn}
                    onPress={() => setIsTunerOpen(true)}
                  >
                    <Volume2 color="#10B981" size={17} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.topIconBtn}
                    onPress={() => handleDeleteSong(selectedSong.id)}
                  >
                    <Trash2 color="#EF4444" size={17} />
                  </TouchableOpacity>
                </View>

                <View style={styles.controlBar}>
                  <TouchableOpacity
                    style={styles.toneButton}
                    onPress={() => setIsToneModalOpen(true)}
                  >
                    <Text style={styles.toneLabel}>TON:</Text>
                    <Text style={styles.toneValue}>
                      {selectedTone || selectedSong.original_key}
                    </Text>
                    <ChevronDown color="#94A3B8" size={13} />
                  </TouchableOpacity>

                  <View style={styles.instrumentGroup}>
                    {(['guitar', 'piano', 'bass'] as InstrumentType[]).map((inst) => (
                      <TouchableOpacity
                        key={inst}
                        style={[
                          styles.instrumentItemBtn,
                          selectedInstrument === inst && styles.instrumentItemBtnActive,
                        ]}
                        onPress={() => setSelectedInstrument(inst)}
                      >
                        <Text
                          style={[
                            styles.instrumentLabel,
                            selectedInstrument === inst && styles.instrumentLabelActive,
                          ]}
                        >
                          {inst === 'guitar' ? 'Gitar' : inst === 'piano' ? 'Piyano' : 'Bas'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.transposeControls}>
                    <TouchableOpacity
                      style={styles.fontBtn}
                      onPress={() => setFontSize((p) => Math.max(12, p - 1))}
                    >
                      <Text style={styles.fontBtnText}>A-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.fontBtn}
                      onPress={() => setFontSize((p) => Math.min(26, p + 1))}
                    >
                      <Text style={styles.fontBtnText}>A+</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.circleBtn}
                      onPress={() => handleTranspose(-1)}
                    >
                      <Minus color="#FFFFFF" size={14} />
                    </TouchableOpacity>
                    <Text style={styles.transposeText}>
                      {transposeValue > 0 ? `+${transposeValue}` : transposeValue}
                    </Text>
                    <TouchableOpacity
                      style={styles.circleBtn}
                      onPress={() => handleTranspose(1)}
                    >
                      <Plus color="#FFFFFF" size={14} />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView
                  ref={scrollRef}
                  style={styles.scrollArea}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {(selectedSong.capo || selectedSong.rhythm || selectedSong.notes) && (
                    <View style={styles.infoCard}>
                      <TouchableOpacity
                        style={styles.infoHeader}
                        onPress={() => setIsNoteCardVisible(!isNoteCardVisible)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Bookmark color="#F59E0B" size={14} />
                          <Text style={styles.infoCardTitle}>Sahne Notları</Text>
                        </View>
                        {isNoteCardVisible ? (
                          <ChevronUp color="#94A3B8" size={14} />
                        ) : (
                          <ChevronDown color="#94A3B8" size={14} />
                        )}
                      </TouchableOpacity>

                      {isNoteCardVisible && (
                        <View style={styles.infoBody}>
                          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                            {selectedSong.capo ? (
                              <View style={styles.pill}>
                                <Text style={styles.pillLabel}>KAPO:</Text>
                                <Text style={styles.pillVal}>{selectedSong.capo}</Text>
                              </View>
                            ) : null}
                            {selectedSong.rhythm ? (
                              <View style={styles.pill}>
                                <Text style={styles.pillLabel}>RİTİM:</Text>
                                <Text style={styles.pillVal}>{selectedSong.rhythm}</Text>
                              </View>
                            ) : null}
                          </View>
                          {selectedSong.notes ? (
                            <Text style={styles.notesText}>{selectedSong.notes}</Text>
                          ) : null}
                        </View>
                      )}
                    </View>
                  )}

                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ minWidth: '100%' }}>
                      {renderStageContent(
                        transposeContent(selectedSong.content, transposeValue)
                      )}
                    </View>
                  </ScrollView>
                </ScrollView>

                <View style={styles.floatingBar}>
                  <TouchableOpacity
                    style={[styles.scrollActionBtn, isScrolling && styles.scrollActionBtnActive]}
                    onPress={() => setIsScrolling(!isScrolling)}
                  >
                    {isScrolling ? (
                      <Pause color="#FFFFFF" size={16} />
                    ) : (
                      <Play color="#FFFFFF" size={16} fill="#FFFFFF" />
                    )}
                    <Text style={styles.scrollActionText}>
                      {isScrolling ? 'DURDUR' : 'KAYDIR'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.speedBox}>
                    {[1, 2, 3, 4].map((spd) => (
                      <TouchableOpacity
                        key={spd}
                        style={[styles.speedBtn, scrollSpeed === spd && styles.speedBtnActive]}
                        onPress={() => setScrollSpeed(spd)}
                      >
                        <Text
                          style={[
                            styles.speedBtnText,
                            scrollSpeed === spd && styles.speedBtnTextActive,
                          ]}
                        >
                          {spd}x
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.resetBtn}
                    onPress={() => {
                      setIsScrolling(false);
                      currentScrollY.current = 0;
                      scrollRef.current?.scrollTo({ y: 0, animated: true });
                    }}
                  >
                    <RotateCcw color="#94A3B8" size={16} />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.listHeader}>
                  <View>
                    <Text style={styles.mainTitle}>Morpheus Sahne</Text>
                    <Text style={styles.subTitle}>{songs.length} Şarkı Hazır</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => setIsAddModalOpen(true)}
                  >
                    <PlusCircle color="#FFFFFF" size={17} />
                    <Text style={styles.addBtnText}>Şarkı Ekle</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.searchRow}>
                  <View style={styles.searchBar}>
                    <Search color="#64748B" size={16} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Şarkı veya sanatçı ara..."
                      placeholderTextColor="#64748B"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    {searchQuery ? (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <X color="#64748B" size={16} />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={styles.sortToggleBtn}
                    onPress={() =>
                      setSortMode((prev) => (prev === 'TITLE' ? 'ARTIST' : 'TITLE'))
                    }
                  >
                    <Text style={styles.sortToggleText}>
                      {sortMode === 'TITLE' ? 'Şarkı A-Z' : 'Sanatçı A-Z'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.filterBar}
                  contentContainerStyle={styles.filterBarContent}
                >
                  {[
                    { key: 'ALL', label: 'Tümü' },
                    { key: 'MANUAL', label: 'Manuel' },
                    { key: 'WEB', label: 'Web' },
                    { key: 'AI_ARRANGED', label: 'AI Aranje' },
                    { key: 'PEER_SHARE', label: 'Paylaşılan' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.filterChip,
                        sourceFilter === item.key && styles.filterChipActive,
                      ]}
                      onPress={() => setSourceFilter(item.key as SourceType)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          sourceFilter === item.key && styles.filterChipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.alphaBar}
                  contentContainerStyle={styles.alphaBarContent}
                >
                  <TouchableOpacity
                    style={[styles.alphaChip, !selectedLetter && styles.alphaChipActive]}
                    onPress={() => setSelectedLetter(null)}
                  >
                    <Text
                      style={[styles.alphaText, !selectedLetter && styles.alphaTextActive]}
                    >
                      Hepsi
                    </Text>
                  </TouchableOpacity>
                  {TURKISH_ALPHABET.map((char) => (
                    <TouchableOpacity
                      key={char}
                      style={[
                        styles.alphaChip,
                        selectedLetter === char && styles.alphaChipActive,
                      ]}
                      onPress={() => setSelectedLetter(selectedLetter === char ? null : char)}
                    >
                      <Text
                        style={[
                          styles.alphaText,
                          selectedLetter === char && styles.alphaTextActive,
                        ]}
                      >
                        {char}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {loading ? (
                  <View style={styles.center}>
                    <ActivityIndicator size="large" color="#0284C7" />
                  </View>
                ) : (
                  <ScrollView style={styles.listArea}>
                    {filteredSongs.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.songListItem}
                        onPress={() => handleSelectSong(item)}
                      >
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.songListTitle}>{item.title}</Text>
                            {item.source_type && item.source_type !== 'MANUAL' && (
                              <View style={styles.sourceBadge}>
                                <Text style={styles.sourceBadgeText}>{item.source_type}</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.songListArtist}>{item.artist}</Text>
                        </View>
                        <View style={styles.keyBadge}>
                          <Text style={styles.keyBadgeText}>{item.original_key}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                    {filteredSongs.length === 0 && (
                      <Text style={styles.emptyText}>Bu filtreye uygun şarkı bulunamadı.</Text>
                    )}
                  </ScrollView>
                )}
              </>
            )}
          </View>
        </View>
      )}

      {/* 6 HANELİ PAYLAŞIM KODU MODALI */}
      <Modal visible={isShareModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.shareModalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sahne Paylaşım Kodu</Text>
              <TouchableOpacity onPress={() => setIsShareModalOpen(false)}>
                <X color="#94A3B8" size={20} />
              </TouchableOpacity>
            </View>
            <Text style={styles.shareSubtitle}>
              Grup arkadaşınız bu 6 haneli kodu girerek şarkıyı anında kendi sahnesine aktarabilir:
            </Text>
            <View style={styles.shareCodeCard}>
              <Text style={styles.shareCodeDigits}>{generatedShareCode}</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* KODLA İÇERİ AKTARMA MODALI */}
      <Modal visible={isImportModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.shareModalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kodla Şarkı Aktar</Text>
              <TouchableOpacity onPress={() => setIsImportModalOpen(false)}>
                <X color="#94A3B8" size={20} />
              </TouchableOpacity>
            </View>
            <Text style={styles.shareSubtitle}>
              Arkadaşınızdan veya Web Portalı'ndan aldığınız 6 haneli kodu buraya girin:
            </Text>
            <TextInput
              style={[styles.formInput, { textAlign: 'center', fontSize: 18, fontWeight: 'bold' }]}
              placeholder="MORF-XXXXXX"
              placeholderTextColor="#64748B"
              value={importCodeInput}
              onChangeText={setImportCodeInput}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.saveBtn, isImporting && { opacity: 0.6 }]}
              onPress={handleImportByCode}
              disabled={isImporting}
            >
              <Text style={styles.saveBtnText}>
                {isImporting ? 'Aktarılıyor...' : 'Şarkıyı Sahneye Ekle'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* AKOR POZİSYON MODALI */}
      <Modal
        visible={!!inspectedChord}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setInspectedChord(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.chordModalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalChordTitle}>{inspectedChord}</Text>
              <TouchableOpacity onPress={() => setInspectedChord(null)}>
                <X color="#94A3B8" size={20} />
              </TouchableOpacity>
            </View>

            {inspectedChord && (
              <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                {selectedInstrument === 'guitar' && (
                  <GuitarDiagram
                    chord={inspectedChord}
                    voicingIdx={chordVoicingIndex}
                    setVoicingIdx={setChordVoicingIndex}
                  />
                )}
                {selectedInstrument === 'piano' && <PianoDiagram chord={inspectedChord} />}
                {selectedInstrument === 'bass' && (
                  <BassDiagram
                    chord={inspectedChord}
                    voicingIdx={chordVoicingIndex}
                    setVoicingIdx={setChordVoicingIndex}
                  />
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ŞARKI EKLEME MODALI */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.addModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Şarkı Ekle</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <X color="#94A3B8" size={20} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.formInput}
              placeholder="Şarkı Adı"
              placeholderTextColor="#64748B"
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <TextInput
              style={styles.formInput}
              placeholder="Sanatçı"
              placeholderTextColor="#64748B"
              value={newArtist}
              onChangeText={setNewArtist}
            />

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[styles.formInput, { flex: 1 }]}
                placeholder="Ton (Am)"
                placeholderTextColor="#64748B"
                value={newOriginalKey}
                onChangeText={setNewOriginalKey}
              />
              <TextInput
                style={[styles.formInput, { flex: 1 }]}
                placeholder="BPM (100)"
                placeholderTextColor="#64748B"
                value={newBpm}
                onChangeText={setNewBpm}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.formInput, { flex: 1 }]}
                placeholder="Kapo"
                placeholderTextColor="#64748B"
                value={newCapo}
                onChangeText={setNewCapo}
              />
            </View>

            <TextInput
              style={styles.formInput}
              placeholder="Ritim (Örn: 4/4 A-Y-A-Y)"
              placeholderTextColor="#64748B"
              value={newRhythm}
              onChangeText={setNewRhythm}
            />

            <TextInput
              style={styles.formInput}
              placeholder="Sahne Notu"
              placeholderTextColor="#64748B"
              value={newNotes}
              onChangeText={setNewNotes}
            />

            <TextInput
              style={[styles.formInput, styles.textArea]}
              placeholder="[Am] Akdeniz akşamları bir [Dm] başka oluyor..."
              placeholderTextColor="#64748B"
              value={newContent}
              onChangeText={setNewContent}
              multiline
            />

            <TouchableOpacity
              style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
              onPress={handleSaveSong}
              disabled={isSaving}
            >
              <Text style={styles.saveBtnText}>
                {isSaving ? 'Kaydediliyor...' : 'Repertuvara Kaydet'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* TON SEÇİCİ MODAL */}
      <Modal visible={isToneModalOpen} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ton Seçin</Text>
              <TouchableOpacity onPress={() => setIsToneModalOpen(false)}>
                <Text style={styles.closeText}>Kapat</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.tonesGrid}>
              {ALL_TONES.map((tone) => (
                <TouchableOpacity
                  key={tone}
                  style={[
                    styles.toneGridItem,
                    selectedTone === tone && styles.selectedToneGridItem,
                  ]}
                  onPress={() => {
                    setSelectedTone(tone);
                    setIsToneModalOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.toneGridText,
                      selectedTone === tone && styles.selectedToneGridText,
                    ]}
                  >
                    {tone}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <TunerModal visible={isTunerOpen} onClose={() => setIsTunerOpen(false)} />
    </SafeAreaView>
  );
}

// Görsel Akor Bileşenleri
function GuitarDiagram({ chord, voicingIdx, setVoicingIdx }: any) {
  const voicings = getChordVoicings(chord);
  if (!voicings || voicings.length === 0) {
    return <Text style={{ color: '#94A3B8', padding: 10 }}>Diyagram bulunamadı.</Text>;
  }
  const current = voicings[voicingIdx] || voicings[0];
  const minFret = current.baseFret;
  const strings = ['E', 'A', 'D', 'G', 'B', 'e'];

  return (
    <View style={{ alignItems: 'center' }}>
      {voicings.length > 1 && (
        <View style={styles.voicingNav}>
          <TouchableOpacity
            disabled={voicingIdx === 0}
            onPress={() => setVoicingIdx(Math.max(0, voicingIdx - 1))}
            style={[styles.vNavBtn, voicingIdx === 0 && { opacity: 0.3 }]}
          >
            <ChevronLeft color="#38BDF8" size={16} />
          </TouchableOpacity>
          <Text style={styles.vNavText}>Pozisyon {voicingIdx + 1} / {voicings.length}</Text>
          <TouchableOpacity
            disabled={voicingIdx === voicings.length - 1}
            onPress={() => setVoicingIdx(Math.min(voicings.length - 1, voicingIdx + 1))}
            style={[styles.vNavBtn, voicingIdx === voicings.length - 1 && { opacity: 0.3 }]}
          >
            <ChevronRight color="#38BDF8" size={16} />
          </TouchableOpacity>
        </View>
      )}

      {minFret > 1 && <Text style={styles.fretBadge}>{minFret}. Perde</Text>}

      <View style={styles.nutLine}>
        {current.frets.map((f: number, i: number) => (
          <Text
            key={i}
            style={[
              styles.nutTxt,
              f === -1 && { color: '#EF4444' },
              f === 0 && { color: '#10B981' },
            ]}
          >
            {f === -1 ? '✕' : f === 0 ? '○' : ''}
          </Text>
        ))}
      </View>

      <View style={styles.guitarFretboard}>
        {[0, 1, 2, 3].map((fIdx) => {
          const currentFret = minFret + fIdx;
          return (
            <View key={fIdx} style={styles.gRow}>
              {[0, 1, 2, 3, 4, 5].map((sIdx) => {
                const hasDot = current.frets[sIdx] === currentFret;
                return (
                  <View key={sIdx} style={styles.gCell}>
                    <View style={styles.gStringLine} />
                    {hasDot && <View style={styles.gDot} />}
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>

      <View style={styles.stringLabelRow}>
        {strings.map((s, i) => (
          <Text key={i} style={styles.stringLabelText}>{s}</Text>
        ))}
      </View>
    </View>
  );
}

function PianoDiagram({ chord }: { chord: string }) {
  const { activeSemitones, activeNoteNames } = getPianoKeysForChord(chord);
  const whiteKeys = PIANO_KEYS_2_OCTAVES.filter((k) => !k.isBlack);

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={styles.pianoNotesPreview}>Notalar: {activeNoteNames.join(' - ')}</Text>
      <View style={styles.pianoWrap}>
        <View style={styles.whiteKeysRow}>
          {whiteKeys.map((k) => {
            const isActive = activeSemitones.includes(k.semitone);
            return (
              <View key={k.semitone} style={[styles.wKey, isActive && styles.wKeyActive]}>
                <Text style={[styles.wKeyLabel, isActive && { color: '#FFFFFF' }]}>{k.note}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.blackKeysOverlay} pointerEvents="none">
          {PIANO_KEYS_2_OCTAVES.map((k) => {
            if (!k.isBlack) return <View key={k.semitone} style={{ flex: 1 }} />;
            const isActive = activeSemitones.includes(k.semitone);
            return (
              <View key={k.semitone} style={[styles.bKey, isActive && styles.bKeyActive]}>
                {isActive && <View style={styles.bDot} />}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function BassDiagram({ chord, voicingIdx, setVoicingIdx }: any) {
  const voicings = getBassVoicings(chord);
  if (!voicings || voicings.length === 0) {
    return <Text style={{ color: '#94A3B8', padding: 10 }}>Bas diyagramı bulunamadı.</Text>;
  }
  const current = voicings[voicingIdx] || voicings[0];
  const minFret = current.baseFret;
  const strings = ['E', 'A', 'D', 'G'];

  return (
    <View style={{ alignItems: 'center' }}>
      {minFret > 1 && <Text style={styles.fretBadge}>{minFret}. Perde</Text>}
      <View style={[styles.guitarFretboard, { width: 140 }]}>
        {[0, 1, 2, 3].map((fIdx) => {
          const currentFret = minFret + fIdx;
          return (
            <View key={fIdx} style={styles.gRow}>
              {[0, 1, 2, 3].map((sIdx) => {
                const tone = current.chordTones.find(
                  (t: any) => t.stringIdx === sIdx && t.fret === currentFret
                );
                return (
                  <View key={sIdx} style={styles.gCell}>
                    <View style={[styles.gStringLine, { width: 4 - sIdx }]} />
                    {tone && (
                      <View
                        style={[
                          styles.bassDot,
                          tone.isRoot ? styles.bassRootDot : styles.bassToneDot,
                        ]}
                      >
                        <Text style={styles.bassDotText}>{tone.interval}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>
      <View style={[styles.stringLabelRow, { width: 140 }]}>
        {strings.map((s, i) => (
          <Text key={i} style={styles.stringLabelText}>{s}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070B13' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  platformNavHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0B1120',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  platformBrand: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  brandMorpheus: { color: '#F8FAFC', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  brandMusic: { color: '#0284C7', fontWeight: '900', fontSize: 14 },
  platformTabGroup: {
    flexDirection: 'row',
    backgroundColor: '#070B13',
    padding: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 4,
  },
  platformTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  platformTabBtnActive: { backgroundColor: '#1E293B' },
  platformTabText: { color: '#64748B', fontSize: 11, fontWeight: 'bold' },
  platformTabTextActive: { color: '#38BDF8' },
  importCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#161F30',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  importCodeBtnText: { color: '#38BDF8', fontSize: 11, fontWeight: 'bold' },

  mainWrapper: { flex: 1, alignItems: 'center', width: '100%' },
  contentCard: {
    flex: 1,
    width: '100%',
    maxWidth: 780,
    backgroundColor: '#0F172A',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#1E293B',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: { padding: 6 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#F8FAFC' },
  artist: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  bpmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 5,
    marginRight: 6,
  },
  bpmDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#64748B' },
  bpmDotActive: { backgroundColor: '#10B981', transform: [{ scale: 1.4 }] },
  bpmText: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold' },
  topIconBtn: { padding: 6, backgroundColor: '#1E293B', borderRadius: 6, marginLeft: 6 },

  controlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#161F30',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  toneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },
  toneLabel: { fontSize: 10, color: '#94A3B8', fontWeight: 'bold' },
  toneValue: { fontSize: 12, fontWeight: 'bold', color: '#38BDF8' },
  instrumentGroup: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 6,
    padding: 2,
    borderWidth: 1,
    borderColor: '#334155',
  },
  instrumentItemBtn: { paddingVertical: 4, paddingHorizontal: 7, borderRadius: 4 },
  instrumentItemBtnActive: { backgroundColor: '#1E293B' },
  instrumentLabel: { color: '#64748B', fontSize: 10, fontWeight: 'bold' },
  instrumentLabelActive: { color: '#38BDF8' },
  transposeControls: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  fontBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#334155',
  },
  fontBtnText: { color: '#94A3B8', fontWeight: 'bold', fontSize: 11 },
  circleBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transposeText: { fontSize: 12, fontWeight: 'bold', color: '#F8FAFC', minWidth: 20, textAlign: 'center' },

  scrollArea: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 110 },
  infoCard: {
    backgroundColor: '#161F30',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
    overflow: 'hidden',
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#1E293B',
  },
  infoCardTitle: { color: '#F8FAFC', fontSize: 11, fontWeight: 'bold' },
  infoBody: { padding: 8, gap: 6 },
  pill: { flexDirection: 'row', backgroundColor: '#0F172A', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, gap: 4 },
  pillLabel: { color: '#94A3B8', fontSize: 10, fontWeight: 'bold' },
  pillVal: { color: '#38BDF8', fontSize: 10, fontWeight: 'bold' },
  notesText: { color: '#CBD5E1', fontSize: 11, lineHeight: 16 },

  lineWrapper: { marginBottom: 6 },
  chordOverLyricLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 10 },
  chordSyllableCol: { flexDirection: 'column', alignItems: 'flex-start', marginRight: 1 },
  chordAboveText: { color: '#F87171', fontWeight: '900', marginBottom: 2, letterSpacing: 0.5 },
  chordOnlyLineText: { color: '#F87171', fontWeight: 'bold', lineHeight: 22 },
  clickableChord: { color: '#F87171', fontWeight: 'bold', cursor: 'pointer' as any },
  lyricsText: { color: '#F1F5F9', lineHeight: 22 },

  floatingBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scrollActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 5,
  },
  scrollActionBtnActive: { backgroundColor: '#EF4444' },
  scrollActionText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 11 },
  speedBox: { flexDirection: 'row', backgroundColor: '#1E293B', borderRadius: 6, padding: 2, gap: 2 },
  speedBtn: { paddingVertical: 4, paddingHorizontal: 7, borderRadius: 4 },
  speedBtnActive: { backgroundColor: '#0284C7' },
  speedBtnText: { color: '#94A3B8', fontSize: 10, fontWeight: 'bold' },
  speedBtnTextActive: { color: '#FFFFFF' },
  resetBtn: { padding: 6, backgroundColor: '#1E293B', borderRadius: 6 },

  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  mainTitle: { fontSize: 18, fontWeight: 'bold', color: '#F8FAFC' },
  subTitle: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 5,
  },
  addBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
  searchRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 8,
  },
  searchInput: { flex: 1, color: '#F8FAFC', fontSize: 12, outlineStyle: 'none' } as any,
  sortToggleBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sortToggleText: { color: '#38BDF8', fontSize: 11, fontWeight: 'bold' },

  filterBar: { maxHeight: 36, marginBottom: 6 },
  filterBarContent: { paddingHorizontal: 16, gap: 6 },
  filterChip: {
    backgroundColor: '#161F30',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  filterChipActive: { backgroundColor: '#0284C7', borderColor: '#38BDF8' },
  filterChipText: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold' },
  filterChipTextActive: { color: '#FFFFFF' },

  alphaBar: { maxHeight: 36, marginBottom: 10 },
  alphaBarContent: { paddingHorizontal: 16, gap: 4 },
  alphaChip: {
    backgroundColor: '#161F30',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  alphaChipActive: { backgroundColor: '#38BDF8' },
  alphaText: { color: '#64748B', fontSize: 11, fontWeight: 'bold' },
  alphaTextActive: { color: '#000000' },

  listArea: { flex: 1, paddingHorizontal: 16 },
  songListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#161F30',
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  songListTitle: { fontSize: 14, fontWeight: 'bold', color: '#F8FAFC' },
  songListArtist: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  sourceBadge: {
    backgroundColor: '#334155',
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 3,
  },
  sourceBadgeText: { color: '#38BDF8', fontSize: 9, fontWeight: 'bold' },
  keyBadge: { backgroundColor: '#1E293B', paddingVertical: 3, paddingHorizontal: 7, borderRadius: 5 },
  keyBadgeText: { color: '#38BDF8', fontWeight: 'bold', fontSize: 11 },
  emptyText: { color: '#64748B', textAlign: 'center', marginTop: 30, fontSize: 12 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  chordModalBox: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalChordTitle: { fontSize: 20, fontWeight: 'bold', color: '#F87171' },
  shareModalBox: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#334155',
  },
  shareSubtitle: { color: '#94A3B8', fontSize: 12, marginBottom: 12, lineHeight: 16 },
  shareCodeCard: {
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0284C7',
  },
  shareCodeDigits: { color: '#38BDF8', fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  addModalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxWidth: 520,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: { fontSize: 15, fontWeight: 'bold', color: '#F8FAFC' },
  formInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    color: '#F8FAFC',
    fontSize: 12,
    marginBottom: 8,
    outlineStyle: 'none',
  } as any,
  textArea: { height: 120, textAlignVertical: 'top', fontFamily: MONO_FONT },
  saveBtn: { backgroundColor: '#0284C7', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    borderColor: '#334155',
  },
  closeText: { color: '#94A3B8', fontSize: 12 },
  tonesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  toneGridItem: {
    width: '21%',
    paddingVertical: 8,
    backgroundColor: '#0F172A',
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectedToneGridItem: { backgroundColor: '#0284C7', borderColor: '#38BDF8' },
  toneGridText: { fontSize: 12, fontWeight: '600', color: '#F8FAFC' },
  selectedToneGridText: { color: '#FFFFFF' },

  voicingNav: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  vNavBtn: { backgroundColor: '#0F172A', padding: 4, borderRadius: 4 },
  vNavText: { color: '#38BDF8', fontSize: 10, fontWeight: 'bold' },
  fretBadge: { color: '#38BDF8', fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
  nutLine: { flexDirection: 'row', width: 170, justifyContent: 'space-between', marginBottom: 2 },
  nutTxt: { width: 22, textAlign: 'center', fontWeight: 'bold', fontSize: 10 },
  guitarFretboard: { width: 170, borderTopWidth: 4, borderTopColor: '#E2E8F0', backgroundColor: '#0F172A', borderRadius: 2 },
  gRow: { flexDirection: 'row', height: 30, borderBottomWidth: 1, borderBottomColor: '#334155' },
  gCell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gStringLine: { position: 'absolute', top: 0, bottom: 0, width: 1.5, backgroundColor: '#64748B' },
  gDot: { width: 13, height: 13, borderRadius: 6.5, backgroundColor: '#F87171', borderWidth: 1.5, borderColor: '#FFFFFF', zIndex: 2 },
  stringLabelRow: { flexDirection: 'row', width: 170, justifyContent: 'space-between', marginTop: 3 },
  stringLabelText: { width: 22, textAlign: 'center', color: '#64748B', fontSize: 9, fontWeight: 'bold' },
  pianoNotesPreview: { color: '#38BDF8', fontWeight: 'bold', fontSize: 11, marginBottom: 6 },
  pianoWrap: { width: 300, height: 95, position: 'relative', backgroundColor: '#0F172A', borderWidth: 2, borderColor: '#334155', borderRadius: 6, overflow: 'hidden' },
  whiteKeysRow: { flexDirection: 'row', width: '100%', height: '100%' },
  wKey: { flex: 1, backgroundColor: '#F8FAFC', borderRightWidth: 1, borderRightColor: '#94A3B8', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 3 },
  wKeyActive: { backgroundColor: '#F87171' },
  wKeyLabel: { fontSize: 8, fontWeight: 'bold', color: '#334155' },
  blackKeysOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 55, flexDirection: 'row' },
  bKey: { flex: 1, backgroundColor: '#0F172A', marginHorizontal: 1, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, borderWidth: 1, borderColor: '#334155', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 3, zIndex: 10 },
  bKeyActive: { backgroundColor: '#F87171' },
  bDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#FFFFFF' },
  bassDot: { width: 15, height: 15, borderRadius: 7.5, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  bassRootDot: { backgroundColor: '#38BDF8' },
  bassToneDot: { backgroundColor: '#F87171' },
  bassDotText: { fontSize: 8, fontWeight: 'bold', color: '#0F172A' },
});