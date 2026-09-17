import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal
} from 'react-native';
import { supabase } from '../lib/supabase';
import { transposeContent } from '../utils/chordEngine';
import { getPianoKeysForChord } from '../utils/pianoDiagrams';
import { PianoView, FretboardView } from './PianoView';

// Modallar
import AdminPanelModal from './AdminPanelModal';
import CoursesModal from './CoursesModal';
import EventsModal from './EventsModal';
import ForumModal from './ForumModal';
import StoreModal from './StoreModal';
import SubscriptionModal from './SubscriptionModal';
import TunerModal from './TunerModal';

// Sabitler
import { GENRES, YEARS, ALPHABET, ALL_KEYS } from '../constants/filters';

// Gitar Standart Akor Pozisyonları
const GUITAR_CHORD_FRETS: { [key: string]: number[] } = {
  'Am': [-1, 0, 2, 2, 1, 0],
  'A': [-1, 0, 2, 2, 2, 0],
  'A7': [-1, 0, 2, 0, 2, 0],
  'C': [-1, 3, 2, 0, 1, 0],
  'Cmaj7': [-1, 3, 2, 0, 0, 0],
  'D': [-1, -1, 0, 2, 3, 2],
  'Dm': [-1, -1, 0, 2, 3, 1],
  'D7': [-1, -1, 0, 2, 1, 2],
  'E': [0, 2, 2, 1, 0, 0],
  'Em': [0, 2, 2, 0, 0, 0],
  'E7': [0, 2, 0, 1, 0, 0],
  'F': [1, 3, 3, 2, 1, 1],
  'F#m': [2, 4, 4, 2, 2, 2],
  'G': [3, 2, 0, 0, 0, 3],
  'G7': [3, 2, 0, 0, 0, 1],
  'B7': [-1, 2, 1, 2, 0, 2],
  'Bm': [-1, 2, 4, 4, 3, 2],
};

// Bass Standart Kök Nota Pozisyonları
const BASS_CHORD_FRETS: { [key: string]: number[] } = {
  'Am': [0, -1, 2, -1],
  'A': [0, -1, 2, -1],
  'A7': [0, -1, 2, -1],
  'C': [-1, 3, -1, 0],
  'Cmaj7': [-1, 3, -1, 0],
  'D': [-1, 0, -1, 2],
  'Dm': [-1, 0, -1, 2],
  'D7': [-1, 0, -1, 2],
  'E': [0, -1, 2, -1],
  'Em': [0, -1, 2, -1],
  'E7': [0, -1, 2, -1],
  'F': [1, -1, 3, -1],
  'F#m': [2, -1, 4, -1],
  'G': [3, -1, 0, -1],
  'G7': [3, -1, 0, -1],
  'B7': [-1, 2, -1, 4],
  'Bm': [-1, 2, -1, 4],
};

export default function MorpheusWebPortal() {
  const [songs, setSongs] = useState<any[]>([]);
  const [selectedSong, setSelectedSong] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);

  // Filtreler
  const [searchQuery, setSearchQuery] = useState('');
  const [originFilter, setOriginFilter] = useState<'Tümü' | 'Yerli' | 'Yabancı'>('Tümü');
  const [sortFilter, setSortFilter] = useState<'none' | 'views' | 'rating'>('none');
  const [selectedGenre, setSelectedGenre] = useState<string>('Tümü');
  const [selectedYear, setSelectedYear] = useState<string>('Tüm Yıllar');
  const [selectedLetter, setSelectedLetter] = useState<string>('Tümü');
  const [viewMode, setViewMode] = useState<'songs' | 'lists'>('songs');

  // Dropdown Açık/Kapalı State'leri
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showKeyDropdown, setShowKeyDropdown] = useState(false);

  // Transpoze, Font ve Enstrüman Tabı
  const [semitoneShift, setSemitoneShift] = useState(0);
  const [fontSize, setFontSize] = useState(15);
  const [instrumentTab, setInstrumentTab] = useState<'gitar' | 'piyano' | 'bass'>('piyano');

  // Modallar
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [correctionModalVisible, setCorrectionModalVisible] = useState(false);
  const [correctionText, setCorrectionText] = useState('');
  const [correctionNote, setCorrectionNote] = useState('');
  const [savingCorrection, setSavingCorrection] = useState(false);

  useEffect(() => {
    fetchSession();
    fetchSongs();
  }, []);

  const fetchSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (prof) setProfile(prof);
    }
  };

  const fetchSongs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('morfeus_songs')
      .select('*')
      .order('id', { ascending: false });

    if (!error && data) {
      setSongs(data);
      if (data.length > 0) {
        setSelectedSong(data[0]);
      }
    }
    setLoading(false);
  };

  const handleSelectSong = async (song: any) => {
    setSelectedSong(song);
    setSemitoneShift(0);
    await supabase
      .from('morfeus_songs')
      .update({ views: (song.views || 0) + 1 })
      .eq('id', song.id);
  };

  const handleUpdateOriginalKey = async (newKey: string) => {
    if (!selectedSong) return;
    setShowKeyDropdown(false);
    setSelectedSong({ ...selectedSong, original_key: newKey });
    await supabase
      .from('morfeus_songs')
      .update({ original_key: newKey })
      .eq('id', selectedSong.id);
  };

  const transposedContent = useMemo(() => {
    if (!selectedSong?.content) return '';
    if (semitoneShift === 0) return selectedSong.content;
    return transposeContent(selectedSong.content, semitoneShift);
  }, [selectedSong, semitoneShift]);

  const uniqueChordsInSong = useMemo<string[]>(() => {
    if (!transposedContent) return [];
    const chordRegex = /\b[A-G][b#]?(?:m|maj|min|dim|aug|sus)?[0-9]?(?:[#b][0-9]+)?(?:\/[A-G][b#]?)?\b/g;
    const matches = transposedContent.match(chordRegex) || [];
    return Array.from(new Set(matches)) as string[];
  }, [transposedContent]);

  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        (song.title && song.title.toLowerCase().includes(q)) ||
        (song.artist && song.artist.toLowerCase().includes(q));

      const matchesOrigin = originFilter === 'Tümü' ||
        (originFilter === 'Yerli' && song.is_local !== false) ||
        (originFilter === 'Yabancı' && song.is_local === false);

      const matchesGenre = selectedGenre === 'Tümü' || song.genre === selectedGenre;

      let matchesYear = true;
      const y = parseInt(song.release_year, 10);
      if (selectedYear === "70'ler") matchesYear = y >= 1970 && y < 1980;
      else if (selectedYear === "80'ler") matchesYear = y >= 1980 && y < 1990;
      else if (selectedYear === "90'lar") matchesYear = y >= 1990 && y < 2000;
      else if (selectedYear === "2000'ler") matchesYear = y >= 2000 && y < 2010;
      else if (selectedYear === "2010'lar") matchesYear = y >= 2010 && y < 2020;
      else if (selectedYear === '2020+') matchesYear = y >= 2020;

      const matchesLetter = selectedLetter === 'Tümü' ||
        (song.title && song.title.toLocaleLowerCase('tr-TR').startsWith(selectedLetter.toLocaleLowerCase('tr-TR')));

      return matchesSearch && matchesOrigin && matchesGenre && matchesYear && matchesLetter;
    }).sort((a, b) => {
      if (sortFilter === 'views') return (b.views || 0) - (a.views || 0);
      if (sortFilter === 'rating') return (b.rating || 0) - (a.rating || 0);
      return 0;
    });
  }, [songs, searchQuery, originFilter, selectedGenre, selectedYear, selectedLetter, sortFilter]);

  const submitCorrection = async () => {
    if (!selectedSong || !correctionText) return;
    setSavingCorrection(true);
    const { error } = await supabase.from('song_corrections').insert({
      song_id: selectedSong.id,
      user_id: user?.id || null,
      suggested_content: correctionText,
      notes: correctionNote
    });
    setSavingCorrection(false);
    if (error) {
      alert('Hata: ' + error.message);
    } else {
      setCorrectionModalVisible(false);
      setCorrectionText('');
      setCorrectionNote('');
      alert('Düzeltme öneriniz admin havuzuna iletildi.');
    }
  };

  const handleOpenAuth = () => {
    setActiveModal('subscription');
  };

  return (
    <View style={styles.container}>
      {/* 1. ÜST NAVİGASYON */}
      <View style={styles.topNav}>
        <View style={styles.topNavLeft}>
          <Text style={styles.brandTitle}>MORPHEUS <Text style={styles.brandSub}>v3.6 ULTRA</Text></Text>
          <View style={styles.mainMenuLinks}>
            <TouchableOpacity style={styles.menuBtn} onPress={() => setActiveModal('forum')}><Text style={styles.menuBtnText}>FORUM</Text></TouchableOpacity>
            <TouchableOpacity style={styles.menuBtn} onPress={() => setActiveModal('events')}><Text style={styles.menuBtnText}>ETKİNLİKLER</Text></TouchableOpacity>
            <TouchableOpacity style={styles.menuBtn} onPress={() => setActiveModal('courses')}><Text style={styles.menuBtnText}>EĞİTİMLER</Text></TouchableOpacity>
            <TouchableOpacity style={styles.menuBtn} onPress={() => setActiveModal('store')}><Text style={styles.menuBtnText}>MAĞAZA</Text></TouchableOpacity>
            <TouchableOpacity style={styles.menuBtn} onPress={() => alert('Morpheus Help & Teori Merkezi')}><Text style={styles.menuBtnText}>HELP</Text></TouchableOpacity>
          </View>
        </View>

        <View style={styles.topNavRight}>
          <View style={styles.webAppSwitch}>
            <TouchableOpacity style={[styles.switchBtn, styles.switchActive]}><Text style={styles.switchText}>WEB</Text></TouchableOpacity>
            <TouchableOpacity style={styles.switchBtn} onPress={() => alert('Mobile App Store yönlendirmesi')}><Text style={styles.switchText}>APP</Text></TouchableOpacity>
          </View>

          {user ? (
            <TouchableOpacity onPress={() => setActiveModal('profile')}>
              <Text style={styles.userBadge}>{user.email?.split('@')[0]} ({profile?.membership_tier?.toUpperCase() || 'BASIC'})</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.authBtns}>
              <TouchableOpacity style={styles.loginBtn} onPress={handleOpenAuth}><Text style={styles.loginText}>Giriş</Text></TouchableOpacity>
              <TouchableOpacity style={styles.registerBtn} onPress={handleOpenAuth}><Text style={styles.registerText}>Kayıt</Text></TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* 2. ADV BAR */}
      <View style={styles.advBanner}>
        <Text style={styles.advBannerText}>REKLAM (728x90) • Morpheus Sahne Omurgası • Canlı Performans & Akor İstasyonu</Text>
      </View>

      {/* 3. ARAMA, FİLTRE VE ALFABE (ORTALANMIŞ & DARALTILMIŞ BÖLÜM) */}
      <View style={styles.searchSection}>
        <View style={styles.searchInnerWrapper}>
          {/* Daraltılmış & Ortalanmış Arama Çubuğu */}
          <TextInput
            style={styles.searchInput}
            placeholder="Şarkı adı veya sanatçı adı arayın..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {/* Ortalanmış Filtre & Dropdown Satırı */}
          <View style={styles.filterBar}>
            <View style={styles.filterRow}>
              {(['Tümü', 'Yerli', 'Yabancı'] as const).map((org) => (
                <TouchableOpacity
                  key={org}
                  style={[styles.filterChip, originFilter === org && styles.activeChip]}
                  onPress={() => setOriginFilter(org)}
                >
                  <Text style={[styles.filterChipText, originFilter === org && styles.activeChipText]}>{org}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[styles.filterChip, sortFilter === 'views' && styles.activeChip]}
                onPress={() => setSortFilter(sortFilter === 'views' ? 'none' : 'views')}
              >
                <Text style={[styles.filterChipText, sortFilter === 'views' && styles.activeChipText]}>En Çok Ziyaret Edilenler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, sortFilter === 'rating' && styles.activeChip]}
                onPress={() => setSortFilter(sortFilter === 'rating' ? 'none' : 'rating')}
              >
                <Text style={[styles.filterChipText, sortFilter === 'rating' && styles.activeChipText]}>En Çok Oy Alanlar</Text>
              </TouchableOpacity>

              {/* TÜR DROPDOWN */}
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={[styles.dropdownBtn, selectedGenre !== 'Tümü' && styles.activeDropdownBtn]}
                  onPress={() => {
                    setShowGenreDropdown(!showGenreDropdown);
                    setShowYearDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownBtnText, selectedGenre !== 'Tümü' && styles.activeDropdownBtnText]}>
                    {selectedGenre === 'Tümü' ? 'Tür Seç' : selectedGenre} ▾
                  </Text>
                </TouchableOpacity>

                {showGenreDropdown && (
                  <View style={styles.dropdownMenu}>
                    {GENRES.map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[styles.dropdownItem, selectedGenre === g && styles.activeDropdownItem]}
                        onPress={() => {
                          setSelectedGenre(g);
                          setShowGenreDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, selectedGenre === g && styles.activeDropdownItemText]}>{g}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* YILLAR DROPDOWN */}
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={[styles.dropdownBtn, selectedYear !== 'Tüm Yıllar' && styles.activeDropdownBtn]}
                  onPress={() => {
                    setShowYearDropdown(!showYearDropdown);
                    setShowGenreDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownBtnText, selectedYear !== 'Tüm Yıllar' && styles.activeDropdownBtnText]}>
                    {selectedYear === 'Tüm Yıllar' ? 'Yıllar' : selectedYear} ▾
                  </Text>
                </TouchableOpacity>

                {showYearDropdown && (
                  <View style={styles.dropdownMenu}>
                    {YEARS.map((y) => (
                      <TouchableOpacity
                        key={y}
                        style={[styles.dropdownItem, selectedYear === y && styles.activeDropdownItem]}
                        onPress={() => {
                          setSelectedYear(y);
                          setShowYearDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, selectedYear === y && styles.activeDropdownItemText]}>{y}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* LİSTELER BUTONU */}
              <TouchableOpacity
                style={[styles.filterChipSpecial, viewMode === 'lists' && styles.activeChipSpecial]}
                onPress={() => setViewMode(viewMode === 'lists' ? 'songs' : 'lists')}
              >
                <Text style={styles.filterChipTextSpecial}>LİSTELER</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Ortalanmış Alfabe Şeridi */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.alphaScrollContent}
            style={styles.alphaScrollView}
          >
            {ALPHABET.map((char) => (
              <TouchableOpacity
                key={char}
                style={[styles.alphaChar, selectedLetter === char && styles.activeAlphaChar]}
                onPress={() => setSelectedLetter(char)}
              >
                <Text style={[styles.alphaCharText, selectedLetter === char && styles.activeAlphaCharText]}>{char}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* 4. 3 KOLONLU GÖVDE */}
      <View style={styles.mainGrid}>
        {/* SOL: Arama Listesi */}
        <View style={styles.leftCol}>
          <View style={styles.colHeader}>
            <Text style={styles.colHeaderText}>{viewMode === 'lists' ? 'Hazır Repertuvarlar' : 'Akor Kütüphanesi'}</Text>
            <Text style={styles.counterText}>{filteredSongs.length} Eser</Text>
          </View>

          {loading ? (
            <ActivityIndicator color="#0284c7" style={{ marginTop: 40 }} />
          ) : (
            <ScrollView style={styles.songList}>
              {filteredSongs.map((song) => {
                const isSelected = selectedSong?.id === song.id;
                return (
                  <TouchableOpacity
                    key={song.id}
                    style={[styles.songCard, isSelected && styles.songCardSelected]}
                    onPress={() => handleSelectSong(song)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.songCardTitle, isSelected && styles.textWhite]}>{song.title}</Text>
                      <Text style={styles.songCardArtist}>{song.artist} • {song.genre || 'Genel'}</Text>
                    </View>
                    <Text style={styles.keyTag}>{song.original_key || 'Am'}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ORTA: Şarkı Sahnesi & Akor Tabları */}
        <View style={styles.centerCol}>
          {selectedSong ? (
            <ScrollView style={styles.songViewWrapper}>
              <View style={styles.actionHeaderRow}>
                <TouchableOpacity
                  style={styles.actionBtnAI}
                  onPress={() => alert('AI Aranje Motoru: Gemini API üzerinden yeni aranje üretiliyor...')}
                >
                  <Text style={styles.actionBtnText}>⚡ AI ARANJE ET</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtnSecondary}
                  onPress={() => alert(`Paylaşım Kodu: MORPH-${selectedSong.id.slice(0, 8).toUpperCase()}`)}
                >
                  <Text style={styles.actionBtnTextSec}>🔗 PAYLAŞIM KODU</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtnPro, profile?.membership_tier === 'basic' && styles.disabledBtn]}
                  onPress={() => {
                    if (profile?.membership_tier === 'basic' || !user) {
                      alert('Sahne Modu Single & Band üyelere özeldir. Lütfen paketinizi yükseltin.');
                    } else {
                      setActiveModal('tuner');
                    }
                  }}
                >
                  <Text style={styles.actionBtnTextPro}>👑 SAHNE MODU</Text>
                </TouchableOpacity>
              </View>

              {/* Başlık & Sayaçlar */}
              <View style={styles.songHeaderBox}>
                <View style={styles.titleRow}>
                  <Text style={styles.songMainTitle}>{selectedSong.title}</Text>
                  <View style={styles.stdBadge}>
                    <Text style={styles.stdBadgeText}>Standart Akor</Text>
                  </View>
                  <View style={styles.statsRow}>
                    <Text style={styles.statItem}>⭐ {selectedSong.rating || '5.0'} Oy</Text>
                    <Text style={styles.statItem}>👁️ {selectedSong.views || 0} İzlenme</Text>
                    <Text style={styles.statItem}>📑 {selectedSong.playlist_count || 12} Liste</Text>
                  </View>
                </View>

                <View style={styles.artistRow}>
                  <Text style={styles.artistName}>
                    {selectedSong.artist} • {selectedSong.release_year || '2000'} • {selectedSong.genre || 'Rock'}
                  </Text>
                  <View style={styles.fontSizeControls}>
                    <TouchableOpacity onPress={() => setFontSize(Math.max(12, fontSize - 1))} style={styles.sizeBtn}><Text style={styles.sizeBtnText}>A-</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setFontSize(Math.min(26, fontSize + 1))} style={styles.sizeBtn}><Text style={styles.sizeBtnText}>A+</Text></TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* ENSTRÜMAN TABLARI & MİNİMALİST DİYAGRAMLAR */}
              <View style={styles.tabSection}>
                <View style={styles.tabInstrumentSelector}>
                  <TouchableOpacity
                    style={[styles.instBtn, instrumentTab === 'piyano' && styles.instBtnActive]}
                    onPress={() => setInstrumentTab('piyano')}
                  >
                    <Text style={[styles.instBtnText, instrumentTab === 'piyano' && styles.textWhite]}>PİYANO</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.instBtn, instrumentTab === 'gitar' && styles.instBtnActive]}
                    onPress={() => setInstrumentTab('gitar')}
                  >
                    <Text style={[styles.instBtnText, instrumentTab === 'gitar' && styles.textWhite]}>GİTAR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.instBtn, instrumentTab === 'bass' && styles.instBtnActive]}
                    onPress={() => setInstrumentTab('bass')}
                  >
                    <Text style={[styles.instBtnText, instrumentTab === 'bass' && styles.textWhite]}>BASS</Text>
                  </TouchableOpacity>
                </View>

                {/* Dinamik Diyagram Şeridi */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chordsScroll}>
                  {uniqueChordsInSong.map((chord: string) => {
                    if (instrumentTab === 'piyano') {
                      const pitches = getPianoKeysForChord(chord);
                      return (
                        <View key={`piano-${chord}`} style={styles.chordDiagramCard}>
                          <PianoView activePitches={pitches} chordName={chord} />
                        </View>
                      );
                    } else if (instrumentTab === 'gitar') {
                      const frets = GUITAR_CHORD_FRETS[chord] || [-1, 0, 2, 2, 1, 0];
                      return (
                        <View key={`guitar-${chord}`} style={styles.chordDiagramCard}>
                          <FretboardView chordName={chord} stringsCount={6} frets={frets} />
                        </View>
                      );
                    } else {
                      const frets = BASS_CHORD_FRETS[chord] || [0, -1, 2, -1];
                      return (
                        <View key={`bass-${chord}`} style={styles.chordDiagramCard}>
                          <FretboardView chordName={chord} stringsCount={4} frets={frets} />
                        </View>
                      );
                    }
                  })}
                </ScrollView>
              </View>

              {/* Ton & Transpoze */}
              <View style={styles.transRow}>
                <View style={styles.keyPickerWrap}>
                  <Text style={styles.tonLabel}>TON : </Text>
                  <TouchableOpacity
                    style={styles.keySelectorBtn}
                    onPress={() => setShowKeyDropdown(!showKeyDropdown)}
                  >
                    <Text style={styles.keySelectorBtnText}>{selectedSong.original_key || 'Am'} ▾</Text>
                  </TouchableOpacity>

                  {showKeyDropdown && (
                    <View style={styles.keyDropdownMenu}>
                      {ALL_KEYS.map((k) => (
                        <TouchableOpacity
                          key={k}
                          style={styles.keyDropItem}
                          onPress={() => handleUpdateOriginalKey(k)}
                        >
                          <Text style={styles.keyDropText}>{k}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.transposeButtons}>
                  <TouchableOpacity style={styles.transBtn} onPress={() => setSemitoneShift(semitoneShift - 1)}><Text style={styles.transBtnText}>-</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.transBtnZero} onPress={() => setSemitoneShift(0)}><Text style={styles.transBtnZeroText}>0</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.transBtn} onPress={() => setSemitoneShift(semitoneShift + 1)}><Text style={styles.transBtnText}>+</Text></TouchableOpacity>
                  <Text style={styles.transOffset}>({semitoneShift > 0 ? `+${semitoneShift}` : semitoneShift})</Text>
                </View>
              </View>

              {/* Şarkı Sözleri ve Akorlar */}
              <View style={styles.lyricsBox}>
                <Text style={[styles.lyricsText, { fontSize }]}>
                  {transposedContent}
                </Text>
              </View>

              {/* Düzeltme Önerisi */}
              <TouchableOpacity
                style={styles.correctionBtn}
                onPress={() => {
                  setCorrectionText(selectedSong.content || '');
                  setCorrectionModalVisible(true);
                }}
              >
                <Text style={styles.correctionBtnText}>✍️ Bu Parça İçin Düzeltme Önerisinde Bulun</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <View style={styles.emptyCenter}>
              <Text style={styles.emptyCenterText}>Görüntülemek için soldan bir şarkı seçin.</Text>
            </View>
          )}
        </View>

        {/* SAĞ: Kullanıcı Paneli & Reklamlar */}
        <View style={styles.rightCol}>
          <View style={styles.memberPanel}>
            <Text style={styles.memberPanelTitle}>KULLANICI PANELİ</Text>
            <View style={styles.memberCard}>
              <Text style={styles.memberName}>{user ? user.email : 'Kayıtsız Ziyaretçi'}</Text>
              <Text style={styles.memberTier}>{profile?.membership_tier ? profile.membership_tier.toUpperCase() : 'ZİYARETÇİ'}</Text>
            </View>

            <View style={styles.memberLinks}>
              <TouchableOpacity style={styles.memberLinkBtn} onPress={handleOpenAuth}>
                <Text style={styles.memberLinkText}>👤 Profil Detayları</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.memberLinkBtn} onPress={() => setViewMode('lists')}>
                <Text style={styles.memberLinkText}>📁 Parça & Repertuvar Listelerim</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.memberLinkBtn} onPress={() => alert('Onaylı Parça Ekleme Formu')}>
                <Text style={styles.memberLinkText}>➕ Yeni Parça Ekle</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.memberLinkBtn} onPress={() => alert('Dahili Mesaj Kutusu')}>
                <Text style={styles.memberLinkText}>📩 Mesaj Kutusu</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.memberLinkBtn} onPress={() => alert('Düzeltme önerileri listesi')}>
                <Text style={styles.memberLinkText}>📝 Verdiğim Düzeltmeler</Text>
              </TouchableOpacity>

              {profile?.membership_tier === 'admin' && (
                <TouchableOpacity style={[styles.memberLinkBtn, { backgroundColor: '#8b5cf6' }]} onPress={() => setActiveModal('admin')}>
                  <Text style={[styles.memberLinkText, { color: '#ffffff', fontWeight: '700' }]}>⚙️ Master Admin Paneli</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.advBlock}>
            <Text style={styles.advBlockTitle}>SPONSOR ALANI 1 (300x250)</Text>
          </View>

          <View style={styles.advBlock}>
            <Text style={styles.advBlockTitle}>SPONSOR ALANI 2 (300x250)</Text>
          </View>
        </View>
      </View>

      {/* DÜZELTME MODALI */}
      <Modal visible={correctionModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Şarkı İçin Düzeltme Öner</Text>
            <Text style={styles.modalSubtitle}>{selectedSong?.title} - {selectedSong?.artist}</Text>

            <Text style={styles.label}>Önerilen Şarkı Sözü ve Akor Formatı:</Text>
            <TextInput
              style={styles.modalTextInput}
              multiline
              numberOfLines={10}
              value={correctionText}
              onChangeText={setCorrectionText}
            />

            <Text style={styles.label}>Ek Notunuz:</Text>
            <TextInput
              style={styles.modalNoteInput}
              placeholder="Örn: Nakarat kısmındaki Dm basımı aslında F olmalı..."
              placeholderTextColor="#64748b"
              value={correctionNote}
              onChangeText={setCorrectionNote}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setCorrectionModalVisible(false)}>
                <Text style={styles.modalCancelText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={submitCorrection} disabled={savingCorrection}>
                <Text style={styles.modalSubmitText}>{savingCorrection ? 'Gönderiliyor...' : 'Öneriyi Gönder'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DİĞER MODALLAR */}
      {activeModal === 'forum' && (
        <ForumModal
          visible={true}
          onClose={() => setActiveModal(null)}
          currentUser={user}
          onOpenAuth={handleOpenAuth}
        />
      )}
      {activeModal === 'events' && (
        <EventsModal
          visible={true}
          onClose={() => setActiveModal(null)}
          currentUser={user}
          onOpenAuth={handleOpenAuth}
        />
      )}
      {activeModal === 'courses' && (
        <CoursesModal
          visible={true}
          onClose={() => setActiveModal(null)}
          currentUser={user}
          onOpenAuth={handleOpenAuth}
        />
      )}
      {activeModal === 'store' && (
        <StoreModal
          visible={true}
          onClose={() => setActiveModal(null)}
          currentUser={user}
          onOpenAuth={handleOpenAuth}
        />
      )}
      {activeModal === 'subscription' && (
        <SubscriptionModal
          visible={true}
          onClose={() => setActiveModal(null)}
          currentUser={user}
          onSuccess={() => {
            fetchSession();
            setActiveModal(null);
          }}
          onOpenAuth={handleOpenAuth}
        />
      )}
      {activeModal === 'admin' && (
        <AdminPanelModal
          visible={true}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'tuner' && (
        <TunerModal
          visible={true}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 360DESK MÜZİK TEKNOLOJİLERİ • STAGE MORPHEUS PRO ECOSYSTEM</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  topNav: {
    height: 52,
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  topNavLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  brandTitle: { color: '#f8fafc', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  brandSub: { color: '#38bdf8', fontSize: 10 },
  mainMenuLinks: { flexDirection: 'row', gap: 12 },
  menuBtn: { paddingVertical: 4 },
  menuBtnText: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },
  topNavRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  webAppSwitch: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 4, padding: 2 },
  switchBtn: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3 },
  switchActive: { backgroundColor: '#0284c7' },
  switchText: { color: '#f8fafc', fontSize: 10, fontWeight: '700' },
  authBtns: { flexDirection: 'row', gap: 8 },
  loginBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#334155' },
  loginText: { color: '#f8fafc', fontSize: 11 },
  registerBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, backgroundColor: '#0284c7' },
  registerText: { color: '#f8fafc', fontSize: 11, fontWeight: '700' },
  userBadge: { color: '#38bdf8', fontSize: 11, fontWeight: '600' },
  advBanner: { height: 42, backgroundColor: '#0284c710', justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#0284c725' },
  advBannerText: { color: '#38bdf8', fontSize: 11, fontWeight: '600' },
  
  // ARAMA VE FİLTRELEME BÖLÜMÜ (ORTALANMIŞ & KONTROLLÜ GENİŞLİK)
  searchSection: { 
    backgroundColor: '#0d1322', 
    paddingVertical: 14, 
    paddingHorizontal: 16,
    borderBottomWidth: 1, 
    borderBottomColor: '#1e293b', 
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center'
  },
  searchInnerWrapper: {
    width: '100%',
    maxWidth: 960,
    alignItems: 'center'
  },
  searchInput: { 
    backgroundColor: '#1e293b', 
    height: 40, 
    borderRadius: 8, 
    paddingHorizontal: 14, 
    color: '#f8fafc', 
    fontSize: 13, 
    marginBottom: 10,
    width: '100%',
    maxWidth: 680,
    borderWidth: 1,
    borderColor: '#334155'
  },
  filterBar: { 
    marginBottom: 10, 
    zIndex: 40,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    flexWrap: 'wrap', 
    gap: 6 
  },
  filterChip: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4 },
  activeChip: { backgroundColor: '#0284c7' },
  filterChipText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  activeChipText: { color: '#ffffff' },
  filterChipSpecial: { backgroundColor: '#8b5cf620', borderWidth: 1, borderColor: '#8b5cf6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4 },
  activeChipSpecial: { backgroundColor: '#8b5cf6' },
  filterChipTextSpecial: { color: '#c084fc', fontSize: 11, fontWeight: '700' },

  // DROPDOWN STİLLERİ
  dropdownContainer: { position: 'relative' },
  dropdownBtn: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4, borderWidth: 1, borderColor: '#334155' },
  activeDropdownBtn: { borderColor: '#38bdf8', backgroundColor: '#0284c725' },
  dropdownBtnText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  activeDropdownBtnText: { color: '#38bdf8' },
  dropdownMenu: { position: 'absolute', top: 30, left: 0, width: 140, backgroundColor: '#0f172a', borderRadius: 6, borderWidth: 1, borderColor: '#334155', zIndex: 100, elevation: 10 },
  dropdownItem: { paddingHorizontal: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  activeDropdownItem: { backgroundColor: '#0284c730' },
  dropdownItemText: { color: '#94a3b8', fontSize: 11 },
  activeDropdownItemText: { color: '#38bdf8', fontWeight: '700' },

  // ALFABE ŞERİDİ (ORTALANMIŞ)
  alphaScrollView: {
    width: '100%',
    maxWidth: 820
  },
  alphaScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5
  },
  alphaChar: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center', borderRadius: 4, backgroundColor: '#151e33' },
  activeAlphaChar: { backgroundColor: '#0284c7' },
  alphaCharText: { color: '#94a3b8', fontSize: 10, fontWeight: '600' },
  activeAlphaCharText: { color: '#ffffff' },

  mainGrid: { flex: 1, flexDirection: 'row' },
  leftCol: { width: 280, borderRightWidth: 1, borderRightColor: '#1e293b', backgroundColor: '#090d16' },
  colHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  colHeaderText: { color: '#f8fafc', fontWeight: '700', fontSize: 12 },
  counterText: { color: '#38bdf8', fontSize: 11 },
  songList: { flex: 1 },
  songCard: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#131c2e', alignItems: 'center' },
  songCardSelected: { backgroundColor: '#1e293b' },
  songCardTitle: { color: '#cbd5e1', fontSize: 12, fontWeight: '600' },
  songCardArtist: { color: '#64748b', fontSize: 10, marginTop: 2 },
  keyTag: { color: '#38bdf8', fontWeight: '700', fontSize: 11 },
  textWhite: { color: '#ffffff' },
  centerCol: { flex: 1, backgroundColor: '#070a12' },
  songViewWrapper: { padding: 16 },
  actionHeaderRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  actionBtnAI: { backgroundColor: '#8b5cf6', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 5 },
  actionBtnSecondary: { backgroundColor: '#1e293b', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 5 },
  actionBtnPro: { backgroundColor: '#f59e0b', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 5 },
  disabledBtn: { opacity: 0.5 },
  actionBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 11 },
  actionBtnTextSec: { color: '#cbd5e1', fontWeight: '600', fontSize: 11 },
  actionBtnTextPro: { color: '#000000', fontWeight: '800', fontSize: 11 },
  songHeaderBox: { borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 12, marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  songMainTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '800' },
  stdBadge: { backgroundColor: '#0284c720', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  stdBadgeText: { color: '#38bdf8', fontSize: 10, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 12, marginLeft: 'auto' },
  statItem: { color: '#94a3b8', fontSize: 11 },
  artistRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  artistName: { color: '#64748b', fontSize: 12 },
  fontSizeControls: { flexDirection: 'row', gap: 5 },
  sizeBtn: { backgroundColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  sizeBtnText: { color: '#94a3b8', fontWeight: '700', fontSize: 11 },
  
  tabSection: { marginVertical: 8, backgroundColor: '#0d1322', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#1e293b' },
  tabInstrumentSelector: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  instBtn: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 4, backgroundColor: '#1e293b' },
  instBtnActive: { backgroundColor: '#0284c7' },
  instBtnText: { color: '#94a3b8', fontSize: 10, fontWeight: '700' },
  chordsScroll: { flexDirection: 'row', paddingVertical: 4 },
  chordDiagramCard: { 
    backgroundColor: '#090d16', 
    borderRadius: 6, 
    padding: 6, 
    marginRight: 8, 
    borderWidth: 1, 
    borderColor: '#1e293b', 
    alignItems: 'center', 
    justifyContent: 'center',
  },

  transRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: 10, borderRadius: 6, marginVertical: 10 },
  keyPickerWrap: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  tonLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  keySelectorBtn: { backgroundColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  keySelectorBtnText: { color: '#38bdf8', fontWeight: '700', fontSize: 12 },
  keyDropdownMenu: { position: 'absolute', top: 32, left: 35, width: 80, maxHeight: 160, backgroundColor: '#1e293b', borderRadius: 5, zIndex: 20, borderWidth: 1, borderColor: '#334155' },
  keyDropItem: { padding: 5, borderBottomWidth: 1, borderBottomColor: '#334155' },
  keyDropText: { color: '#f8fafc', fontSize: 11, textAlign: 'center' },
  transposeButtons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  transBtn: { backgroundColor: '#1e293b', width: 28, height: 28, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  transBtnText: { color: '#f8fafc', fontSize: 14, fontWeight: '700' },
  transBtnZero: { backgroundColor: '#0284c7', width: 28, height: 28, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  transBtnZeroText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  transOffset: { color: '#94a3b8', fontSize: 11, marginLeft: 4 },
  lyricsBox: { backgroundColor: '#05080e', padding: 16, borderRadius: 6, borderWidth: 1, borderColor: '#1e293b', marginVertical: 8 },
  lyricsText: { color: '#f8fafc', fontFamily: 'monospace', lineHeight: 22 },
  correctionBtn: { marginTop: 12, padding: 10, borderRadius: 6, backgroundColor: '#1e293b', alignItems: 'center' },
  correctionBtnText: { color: '#38bdf8', fontSize: 11, fontWeight: '600' },
  emptyCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyCenterText: { color: '#475569', fontSize: 13 },
  rightCol: { width: 300, padding: 12, backgroundColor: '#090d16', borderLeftWidth: 1, borderLeftColor: '#1e293b', gap: 12 },
  memberPanel: { backgroundColor: '#0f172a', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: '#1e293b' },
  memberPanelTitle: { color: '#38bdf8', fontSize: 11, fontWeight: '700', marginBottom: 8 },
  memberCard: { marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  memberName: { color: '#f8fafc', fontSize: 12, fontWeight: '600' },
  memberTier: { color: '#f59e0b', fontSize: 10, fontWeight: '700', marginTop: 2 },
  memberLinks: { gap: 6 },
  memberLinkBtn: { backgroundColor: '#1e293b', padding: 7, borderRadius: 4 },
  memberLinkText: { color: '#cbd5e1', fontSize: 10 },
  advBlock: { height: 180, backgroundColor: '#0d1322', borderRadius: 6, borderWidth: 1, borderColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed' },
  advBlockTitle: { color: '#475569', fontSize: 10, fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: 500, backgroundColor: '#0f172a', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#1e293b' },
  modalTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  modalSubtitle: { color: '#38bdf8', fontSize: 12, marginBottom: 12 },
  label: { color: '#94a3b8', fontSize: 11, marginBottom: 4, fontWeight: '600' },
  modalTextInput: { backgroundColor: '#090d16', color: '#f8fafc', borderRadius: 5, padding: 8, fontFamily: 'monospace', fontSize: 12, height: 140, textAlignVertical: 'top', borderWidth: 1, borderColor: '#1e293b', marginBottom: 10 },
  modalNoteInput: { backgroundColor: '#090d16', color: '#f8fafc', borderRadius: 5, padding: 8, fontSize: 12, height: 36, borderWidth: 1, borderColor: '#1e293b', marginBottom: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  modalCancelBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 5, backgroundColor: '#1e293b' },
  modalCancelText: { color: '#94a3b8', fontSize: 12 },
  modalSubmitBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 5, backgroundColor: '#0284c7' },
  modalSubmitText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  footer: { height: 30, backgroundColor: '#090d16', justifyContent: 'center', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1e293b' },
  footerText: { color: '#475569', fontSize: 9, letterSpacing: 0.5 }
});