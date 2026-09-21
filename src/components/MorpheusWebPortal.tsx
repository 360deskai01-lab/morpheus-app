import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { reharmonizeSong, ReharmonizeStyle, ReharmonizeResult } from '../services/aiArrangerService';

// Modallar
import CoursesModal from './CoursesModal';
import EventsModal from './EventsModal';
import ForumModal from './ForumModal';
import StoreModal from './StoreModal';
import SubscriptionModal from './SubscriptionModal';
import TunerModal from './TunerModal';

// Sabitler
import { GENRES, YEARS, ALPHABET, ALL_KEYS } from '../constants/filters';

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

  // Görünüm Modu: 'portal' veya 'admin'
  const [currentView, setCurrentView] = useState<'portal' | 'admin'>('portal');

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

  // Auto-Scroll (Otomatik Kaydırma) State'leri
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(1); // 1, 2, 3
  const scrollRef = useRef<ScrollView>(null);
  const scrollPosition = useRef(0);

  // AI Aranje State'leri
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<ReharmonizeStyle>('jazz');
  const [aiResult, setAiResult] = useState<ReharmonizeResult | null>(null);
  const [activeArrangementContent, setActiveArrangementContent] = useState<string | null>(null);

  // Admin Dashboard State'leri
  const [adminTab, setAdminTab] = useState<'corrections' | 'add_song' | 'users'>('corrections');
  const [pendingCorrections, setPendingCorrections] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [loadingCorrections, setLoadingCorrections] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  
  // Yeni Şarkı Formu
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newKey, setNewKey] = useState('Am');
  const [newGenre, setNewGenre] = useState('Rock');
  const [newYear, setNewYear] = useState('2024');
  const [newContent, setNewContent] = useState('');
  const [savingNewSong, setSavingNewSong] = useState(false);

  // Modallar
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [correctionModalVisible, setCorrectionModalVisible] = useState(false);
  const [correctionText, setCorrectionText] = useState('');
  const [correctionNote, setCorrectionNote] = useState('');
  const [savingCorrection, setSavingCorrection] = useState(false);

  useEffect(() => {
    fetchSession();
    fetchSongs();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setCurrentView('portal');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Auto Scroll Döngüsü
  useEffect(() => {
    let interval: any = null;
    if (isScrolling) {
      interval = setInterval(() => {
        scrollPosition.current += scrollSpeed;
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ y: scrollPosition.current, animated: false });
        }
      }, 50);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isScrolling, scrollSpeed]);

  const loadProfile = async (currentUser: any) => {
    const { data: prof } = await supabase
      .from('morfeus_profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (prof) {
      if (prof.is_master_admin || prof.email === 'master@360bct.com' || prof.membership_tier?.toLowerCase() === 'admin') {
        prof.membership_tier = 'admin';
        prof.is_master_admin = true;
      }
      setProfile(prof);
    }
  };

  const fetchSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      await loadProfile(session.user);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setCurrentView('portal');
    alert('Başarıyla çıkış yapıldı.');
  };

  const isUserAdmin = useMemo(() => {
    if (!user) return false;
    if (user.email === 'master@360bct.com') return true;
    if (profile?.is_master_admin === true) return true;
    if (profile?.membership_tier?.toLowerCase() === 'admin') return true;
    return false;
  }, [user, profile]);

  const fetchSongs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('morfeus_songs')
      .select('*')
      .order('id', { ascending: false });

    if (!error && data) {
      setSongs(data);
      if (data.length > 0 && !selectedSong) {
        setSelectedSong(data[0]);
      }
    }
    setLoading(false);
  };

  const fetchCorrections = async () => {
    setLoadingCorrections(true);
    const { data } = await supabase
      .from('song_corrections')
      .select('*, morfeus_songs(title, artist)')
      .order('id', { ascending: false });
    if (data) {
      setPendingCorrections(data);
    }
    setLoadingCorrections(false);
  };

  const fetchAllProfiles = async () => {
    setLoadingProfiles(true);
    const { data } = await supabase
      .from('morfeus_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      setAllProfiles(data);
    }
    setLoadingProfiles(false);
  };

  const handleUpdateUserRole = async (userId: string, newTier: string) => {
    const { error } = await supabase
      .from('morfeus_profiles')
      .update({ membership_tier: newTier })
      .eq('id', userId);
    if (!error) {
      alert(`Kullanıcı yetkisi ${newTier.toUpperCase()} olarak güncellendi.`);
      fetchAllProfiles();
    } else {
      alert('Hata: ' + error.message);
    }
  };

  const handleApproveCorrection = async (item: any) => {
    await supabase
      .from('morfeus_songs')
      .update({ content: item.suggested_content })
      .eq('id', item.song_id);

    await supabase.from('song_corrections').delete().eq('id', item.id);
    alert('Düzeltme onaylandı ve parça güncellendi.');
    fetchCorrections();
    fetchSongs();
  };

  const handleRejectCorrection = async (id: number) => {
    await supabase.from('song_corrections').delete().eq('id', id);
    alert('Düzeltme önerisi silindi.');
    fetchCorrections();
  };

  const handleSaveNewSong = async () => {
    if (!newTitle || !newArtist || !newContent) {
      alert('Lütfen şarkı adı, sanatçı ve söz/akor içeriğini doldurun.');
      return;
    }
    setSavingNewSong(true);
    const { error } = await supabase.from('morfeus_songs').insert({
      title: newTitle,
      artist: newArtist,
      original_key: newKey,
      genre: newGenre,
      release_year: newYear,
      content: newContent,
      views: 0,
      rating: 5.0
    });
    setSavingNewSong(false);
    if (error) {
      alert('Hata: ' + error.message);
    } else {
      alert('Parça başarıyla Morpheus Kütüphanesine eklendi!');
      setNewTitle('');
      setNewArtist('');
      setNewContent('');
      fetchSongs();
    }
  };

  const handleSelectSong = async (song: any) => {
    setSelectedSong(song);
    setSemitoneShift(0);
    setActiveArrangementContent(null);
    setAiResult(null);
    setIsScrolling(false);
    scrollPosition.current = 0;
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
    await supabase
      .from('morfeus_songs')
      .update({ views: (song.views || 0) + 1 })
      .eq('id', song.id);
  };

  const handleUpdateOriginalKey = async (newKeyVal: string) => {
    if (!selectedSong) return;
    setShowKeyDropdown(false);
    setSelectedSong({ ...selectedSong, original_key: newKeyVal });
    await supabase
      .from('morfeus_songs')
      .update({ original_key: newKeyVal })
      .eq('id', selectedSong.id);
  };

  const currentContent = activeArrangementContent || selectedSong?.content || '';

  const transposedContent = useMemo(() => {
    if (!currentContent) return '';
    if (semitoneShift === 0) return currentContent;
    return transposeContent(currentContent, semitoneShift);
  }, [currentContent, semitoneShift]);

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

  const handleRunAiArrangement = async () => {
    if (!selectedSong) return;
    setAiLoading(true);
    try {
      const res = await reharmonizeSong(
        selectedSong.title,
        selectedSong.artist,
        selectedSong.content,
        selectedStyle
      );
      setAiResult(res);
    } catch (err: any) {
      alert('AI Aranje Hatası: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiArrangement = () => {
    if (!aiResult) return;
    setActiveArrangementContent(aiResult.content);
    setAiModalVisible(false);
  };

  const revertToOriginal = () => {
    setActiveArrangementContent(null);
    setAiResult(null);
  };

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
    <View style={styles.appContainer}>
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
            <View style={styles.userControls}>
              <TouchableOpacity onPress={() => setActiveModal('profile')}>
                <Text style={styles.userBadge}>
                  {user.email?.split('@')[0]} ({isUserAdmin ? 'ADMIN' : (profile?.membership_tier?.toUpperCase() || 'BASIC')})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutBtnText}>Çıkış</Text>
              </TouchableOpacity>
            </View>
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

      {/* ADMIN GÖRÜNÜMÜ VEYA STANDART PORTAL GÖRÜNÜMÜ */}
      {currentView === 'admin' ? (
        /* ================= MASTER ADMIN DASHBOARD ================= */
        <View style={styles.adminDashboardWrapper}>
          <View style={styles.adminTopHeader}>
            <TouchableOpacity style={styles.returnPortalBtn} onPress={() => setCurrentView('portal')}>
              <Text style={styles.returnPortalBtnText}>← Sahneye / Portala Dön</Text>
            </TouchableOpacity>
            <Text style={styles.adminMainTitle}>⚙️ MASTER ADMIN KONSOLU</Text>
            <View style={styles.adminStatsBox}>
              <Text style={styles.adminStatChip}>📚 Şarkılar: {songs.length}</Text>
              <Text style={styles.adminStatChip}>⏳ Düzeltmeler: {pendingCorrections.length}</Text>
              <Text style={styles.adminStatChip}>👥 Kullanıcılar: {allProfiles.length}</Text>
            </View>
          </View>

          <View style={styles.adminTabSelector}>
            <TouchableOpacity
              style={[styles.adminTabBtn, adminTab === 'corrections' && styles.activeAdminTabBtn]}
              onPress={() => {
                setAdminTab('corrections');
                fetchCorrections();
              }}
            >
              <Text style={[styles.adminTabBtnText, adminTab === 'corrections' && styles.activeAdminTabText]}>
                📝 Düzeltme Onay Havuzu
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.adminTabBtn, adminTab === 'add_song' && styles.activeAdminTabBtn]}
              onPress={() => setAdminTab('add_song')}
            >
              <Text style={[styles.adminTabBtnText, adminTab === 'add_song' && styles.activeAdminTabText]}>
                ➕ Yeni Parça Ekle
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.adminTabBtn, adminTab === 'users' && styles.activeAdminTabBtn]}
              onPress={() => {
                setAdminTab('users');
                fetchAllProfiles();
              }}
            >
              <Text style={[styles.adminTabBtnText, adminTab === 'users' && styles.activeAdminTabText]}>
                👥 Kullanıcı & Yetki Yönetimi
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.adminTabContent}>
            {adminTab === 'corrections' ? (
              <View style={styles.correctionsList}>
                {loadingCorrections ? (
                  <ActivityIndicator color="#8b5cf6" style={{ marginTop: 30 }} />
                ) : pendingCorrections.length === 0 ? (
                  <View style={styles.emptyAdminBox}>
                    <Text style={styles.emptyAdminText}>Bekleyen hiçbir akor düzeltme talebi yok. Sistem güncel!</Text>
                  </View>
                ) : (
                  pendingCorrections.map((corr) => (
                    <View key={corr.id} style={styles.correctionCard}>
                      <View style={styles.corrHeader}>
                        <Text style={styles.corrSongTitle}>
                          {corr.morfeus_songs?.title} - {corr.morfeus_songs?.artist}
                        </Text>
                        <View style={styles.corrActionBtns}>
                          <TouchableOpacity style={styles.corrApproveBtn} onPress={() => handleApproveCorrection(corr)}>
                            <Text style={styles.corrBtnText}>✓ Onayla & Yayına Al</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.corrRejectBtn} onPress={() => handleRejectCorrection(corr.id)}>
                            <Text style={styles.corrBtnTextRed}>✕ Reddet</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      {corr.notes ? <Text style={styles.corrNote}>💬 Kullanıcı Notu: {corr.notes}</Text> : null}
                      <ScrollView style={styles.corrCodeBox} nestedScrollEnabled>
                        <Text style={styles.corrCodeText}>{corr.suggested_content}</Text>
                      </ScrollView>
                    </View>
                  ))
                )}
              </View>
            ) : adminTab === 'add_song' ? (
              <View style={styles.addSongForm}>
                <View style={styles.formRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel}>Şarkı Adı:</Text>
                    <TextInput style={styles.formInput} value={newTitle} onChangeText={setNewTitle} placeholder="Örn: Caddelerde Rüzgar" placeholderTextColor="#64748b" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel}>Sanatçı:</Text>
                    <TextInput style={styles.formInput} value={newArtist} onChangeText={setNewArtist} placeholder="Örn: Nilüfer" placeholderTextColor="#64748b" />
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel}>Orijinal Ton:</Text>
                    <TextInput style={styles.formInput} value={newKey} onChangeText={setNewKey} placeholder="Örn: Am" placeholderTextColor="#64748b" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel}>Tür:</Text>
                    <TextInput style={styles.formInput} value={newGenre} onChangeText={setNewGenre} placeholder="Örn: Rock / Pop" placeholderTextColor="#64748b" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel}>Yıl:</Text>
                    <TextInput style={styles.formInput} value={newYear} onChangeText={setNewYear} placeholder="Örn: 1990" placeholderTextColor="#64748b" />
                  </View>
                </View>

                <Text style={styles.formLabel}>Şarkı Sözü ve Akor Formatı (Monospace):</Text>
                <TextInput
                  style={[styles.formInput, { height: 240, fontFamily: 'monospace', textAlignVertical: 'top' }]}
                  multiline
                  value={newContent}
                  onChangeText={setNewContent}
                  placeholder="Am            Dm&#10;Sözlerin üzerine akorları hizalayın..."
                  placeholderTextColor="#64748b"
                />

                <TouchableOpacity style={styles.saveSongBtn} onPress={handleSaveNewSong} disabled={savingNewSong}>
                  <Text style={styles.saveSongBtnText}>{savingNewSong ? 'Kaydediliyor...' : '💾 Parçayı Morpheus Kütüphanesine Kaydet'}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* KULLANICI YÖNETİMİ TABLOSU */
              <View style={styles.usersTableWrapper}>
                {loadingProfiles ? (
                  <ActivityIndicator color="#8b5cf6" style={{ marginTop: 30 }} />
                ) : (
                  <View style={styles.tableCard}>
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.thText, { flex: 2 }]}>E-Posta / İsim</Text>
                      <Text style={[styles.thText, { flex: 1 }]}>Mevcut Rol</Text>
                      <Text style={[styles.thText, { flex: 2 }]}>Rolü Değiştir (Tek Tık)</Text>
                    </View>
                    {allProfiles.map((p) => (
                      <View key={p.id} style={styles.tableBodyRow}>
                        <View style={{ flex: 2 }}>
                          <Text style={styles.tdTextEmail}>{p.email}</Text>
                          <Text style={styles.tdTextSub}>{p.full_name || 'İsimsiz Üye'}</Text>
                        </View>
                        <Text style={[styles.tdBadge, { flex: 1 }]}>
                          {p.membership_tier?.toUpperCase() || 'BASIC'}
                        </Text>
                        <View style={styles.roleActionButtons}>
                          <TouchableOpacity
                            style={[styles.roleMiniBtn, p.membership_tier === 'basic' && styles.activeMiniBtn]}
                            onPress={() => handleUpdateUserRole(p.id, 'basic')}
                          >
                            <Text style={styles.roleMiniBtnText}>BASIC</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.roleMiniBtn, p.membership_tier === 'premium' && styles.activeMiniBtn]}
                            onPress={() => handleUpdateUserRole(p.id, 'premium')}
                          >
                            <Text style={styles.roleMiniBtnText}>PRO</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.roleMiniBtn, p.membership_tier === 'band' && styles.activeMiniBtn]}
                            onPress={() => handleUpdateUserRole(p.id, 'band')}
                          >
                            <Text style={styles.roleMiniBtnText}>BAND</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.roleMiniBtn, p.membership_tier === 'admin' && styles.activeMiniBtnAdmin]}
                            onPress={() => handleUpdateUserRole(p.id, 'admin')}
                          >
                            <Text style={styles.roleMiniBtnTextAdmin}>ADMIN</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      ) : (
        /* ================= NORMAL PORTAL SAHNE GÖRÜNÜMÜ ================= */
        <View style={styles.portalBodyWrapper}>
          {/* 3. ARAMA, FİLTRE VE ALFABE */}
          <View style={styles.searchSection}>
            <View style={styles.searchInnerWrapper}>
              <TextInput
                style={styles.searchInput}
                placeholder="Şarkı adı veya sanatçı adı arayın..."
                placeholderTextColor="#64748b"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />

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

              {/* ALFABE */}
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

          {/* 4. 3 KOLONLU GÖVDE (SABİT YÜKSEKLİK & HER BİRİ KENDİ İÇİNDE KAYAR) */}
          <View style={styles.mainGrid}>
            {/* SOL: Arama Listesi (Inline Scroll) */}
            <View style={styles.leftCol}>
              <View style={styles.colHeader}>
                <Text style={styles.colHeaderText}>{viewMode === 'lists' ? 'Hazır Repertuvarlar' : 'Akor Kütüphanesi'}</Text>
                <Text style={styles.counterText}>{filteredSongs.length} Eser</Text>
              </View>

              {loading ? (
                <ActivityIndicator color="#0284c7" style={{ marginTop: 40 }} />
              ) : (
                <ScrollView style={styles.songListScroll} showsVerticalScrollIndicator={true}>
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
                <ScrollView ref={scrollRef} style={styles.songViewWrapper} showsVerticalScrollIndicator={true}>
                  {/* Üst İşlem Butonları */}
                  <View style={styles.actionHeaderRow}>
                    <TouchableOpacity
                      style={styles.actionBtnAI}
                      onPress={() => setAiModalVisible(true)}
                    >
                      <Text style={styles.actionBtnText}>⚡ AI ARANJE ET</Text>
                    </TouchableOpacity>

                    {activeArrangementContent && (
                      <TouchableOpacity
                        style={styles.revertBtn}
                        onPress={revertToOriginal}
                      >
                        <Text style={styles.revertBtnText}>↺ Orijinal Akorlara Dön</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.actionBtnSecondary}
                      onPress={() => alert(`Paylaşım Kodu: MORPH-${selectedSong.id.slice(0, 8).toUpperCase()}`)}
                    >
                      <Text style={styles.actionBtnTextSec}>🔗 PAYLAŞIM KODU</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtnPro, (!isUserAdmin && profile?.membership_tier === 'basic') && styles.disabledBtn]}
                      onPress={() => {
                        if (!isUserAdmin && (profile?.membership_tier === 'basic' || !user)) {
                          alert('Sahne Modu Single & Band üyelere özeldir. Lütfen paketinizi yükseltin.');
                        } else {
                          setActiveModal('tuner');
                        }
                      }}
                    >
                      <Text style={styles.actionBtnTextPro}>👑 SAHNE MODU</Text>
                    </TouchableOpacity>
                  </View>

                  {/* AUTO SCROLL (OTOMATİK KAYDIRMA) SAHNE ŞERİDİ */}
                  <View style={styles.autoScrollControls}>
                    <TouchableOpacity
                      style={[styles.scrollToggleBtn, isScrolling && styles.scrollToggleBtnActive]}
                      onPress={() => setIsScrolling(!isScrolling)}
                    >
                      <Text style={styles.scrollToggleBtnText}>
                        {isScrolling ? '⏸ KAYDIRMAYI DURDUR' : '▶ OTOMATİK AKIŞ (AUTO-SCROLL)'}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.speedButtonGroup}>
                      <Text style={styles.speedLabel}>HIZ:</Text>
                      {[1, 2, 3].map((spd) => (
                        <TouchableOpacity
                          key={spd}
                          style={[styles.speedBtn, scrollSpeed === spd && styles.speedBtnActive]}
                          onPress={() => setScrollSpeed(spd)}
                        >
                          <Text style={[styles.speedBtnText, scrollSpeed === spd && styles.textWhite]}>{spd}x</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Başlık & Sayaçlar */}
                  <View style={styles.songHeaderBox}>
                    <View style={styles.titleRow}>
                      <Text style={styles.songMainTitle}>{selectedSong.title}</Text>
                      <View style={[styles.stdBadge, activeArrangementContent ? styles.aiActiveBadge : null]}>
                        <Text style={[styles.stdBadgeText, activeArrangementContent ? styles.aiActiveBadgeText : null]}>
                          {activeArrangementContent ? `AI Aranje (${aiResult?.style.toUpperCase()})` : 'Standart Akor'}
                        </Text>
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

                  {/* ENSTRÜMAN TABLARI */}
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
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <View style={styles.memberPanel}>
                  <Text style={styles.memberPanelTitle}>KULLANICI PANELİ</Text>
                  <View style={styles.memberCard}>
                    <Text style={styles.memberName}>{user ? user.email : 'Kayıtsız Ziyaretçi'}</Text>
                    <Text style={styles.memberTier}>
                      {user ? (isUserAdmin ? 'ADMIN' : (profile?.membership_tier?.toUpperCase() || 'BASIC')) : 'ZİYARETÇİ'}
                    </Text>
                  </View>

                  <View style={styles.memberLinks}>
                    <TouchableOpacity style={styles.memberLinkBtn} onPress={handleOpenAuth}>
                      <Text style={styles.memberLinkText}>👤 Profil Detayları</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.memberLinkBtn} onPress={() => setViewMode('lists')}>
                      <Text style={styles.memberLinkText}>📁 Parça & Repertuvar Listelerim</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.memberLinkBtn} onPress={() => {
                      if (isUserAdmin) {
                        setAdminTab('add_song');
                        setCurrentView('admin');
                      } else {
                        alert('Onaylı Parça Ekleme Formu kullanıcılar için hazırlanıyor.');
                      }
                    }}>
                      <Text style={styles.memberLinkText}>➕ Yeni Parça Ekle</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.memberLinkBtn} onPress={() => alert('Dahili Mesaj Kutusu')}>
                      <Text style={styles.memberLinkText}>📩 Mesaj Kutusu</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.memberLinkBtn} onPress={() => alert('Düzeltme önerileri listesi')}>
                      <Text style={styles.memberLinkText}>📝 Verdiğim Düzeltmeler</Text>
                    </TouchableOpacity>

                    {/* MASTER ADMIN KONSOL BUTONU */}
                    {isUserAdmin && (
                      <TouchableOpacity
                        style={[styles.memberLinkBtn, { backgroundColor: '#8b5cf6' }]}
                        onPress={() => {
                          fetchCorrections();
                          fetchAllProfiles();
                          setCurrentView('admin');
                        }}
                      >
                        <Text style={[styles.memberLinkText, { color: '#ffffff', fontWeight: '700' }]}>⚙️ Master Admin Paneli</Text>
                      </TouchableOpacity>
                    )}

                    {user && (
                      <TouchableOpacity style={[styles.memberLinkBtn, styles.panelLogoutBtn]} onPress={handleLogout}>
                        <Text style={styles.panelLogoutText}>🚪 Güvenli Çıkış Yap</Text>
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
              </ScrollView>
            </View>
          </View>

          {/* 5. 4 KOLONLU ZENGİN KURUMSAL FOOTER (SABİT ALT PANEL) */}
          <View style={styles.richFooter}>
            <View style={styles.footerInner}>
              <View style={styles.footerCol}>
                <Text style={styles.footerColTitle}>KURUMSAL</Text>
                <TouchableOpacity onPress={() => alert('Morpheus Hakkında')}><Text style={styles.footerLink}>Hakkımızda</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => alert('İletişim: info@360bct.com')}><Text style={styles.footerLink}>İletişim & Destek</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => alert('Künye & Ekip')}><Text style={styles.footerLink}>Künye</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => alert('Reklam & Sponsorluk')}><Text style={styles.footerLink}>Sponsorluk Başvurusu</Text></TouchableOpacity>
              </View>

              <View style={styles.footerCol}>
                <Text style={styles.footerColTitle}>HUKUKİ & GÜVENLİK</Text>
                <TouchableOpacity onPress={() => alert('Kullanım Koşulları')}><Text style={styles.footerLink}>Kullanıcı Sözleşmesi</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => alert('Gizlilik İlkeleri')}><Text style={styles.footerLink}>Gizlilik Politikası</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => alert('KVKK Metni')}><Text style={styles.footerLink}>KVKK & Çerezler</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => alert('Telif Hakları Uyarısı')}><Text style={styles.footerLink}>Telif Hakları & Lisans</Text></TouchableOpacity>
              </View>

              <View style={styles.footerCol}>
                <Text style={styles.footerColTitle}>TOPLULUK & MÜZİK</Text>
                <TouchableOpacity onPress={() => setActiveModal('forum')}><Text style={styles.footerLink}>Müzisyen Forumu</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => alert('Akor Ekleme Standartları Kılavuzu')}><Text style={styles.footerLink}>Akor Kılavuzu</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveModal('courses')}><Text style={styles.footerLink}>Online Eğitimler</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveModal('events')}><Text style={styles.footerLink}>Canlı Etkinlikler</Text></TouchableOpacity>
              </View>

              <View style={styles.footerCol}>
                <Text style={styles.footerColTitle}>MORPHEUS MOBİL</Text>
                <Text style={styles.footerDesc}>
                  Sahnede internetsiz çalım, dijital tuner ve grup senkronizasyonu yakında iOS & Android'de.
                </Text>
                <View style={styles.appBadgeRow}>
                  <View style={styles.appBadge}><Text style={styles.appBadgeText}>🍏 App Store</Text></View>
                  <View style={styles.appBadge}><Text style={styles.appBadgeText}>🤖 Play Store</Text></View>
                </View>
              </View>
            </View>

            <View style={styles.footerBottomBar}>
              <Text style={styles.footerCopyText}>
                © 2026 360DESK MÜZİK TEKNOLOJİLERİ A.Ş. • TÜM HAKLARI SAKLIDIR. MORPHEUS PRO ECOSYSTEM
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* AI ARANJE ET MODALI */}
      <Modal visible={aiModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { width: 620, maxHeight: '90%' }]}>
            <Text style={styles.modalTitle}>⚡ Gemini AI Reharmonization</Text>
            <Text style={styles.modalSubtitle}>{selectedSong?.title} - {selectedSong?.artist}</Text>

            <Text style={styles.label}>Aranje Edilecek Müzik Tarzı:</Text>
            <View style={styles.styleSelectorRow}>
              {(
                [
                  { id: 'jazz', label: '🎷 Jazz / Neo-Soul' },
                  { id: 'bossa', label: '🏖️ Bossa Nova' },
                  { id: 'lofi', label: '☕ Lo-Fi / Akustik' },
                  { id: 'rock_ballad', label: '🎸 Rock Ballad' },
                ] as const
              ).map((st) => (
                <TouchableOpacity
                  key={st.id}
                  style={[styles.styleChip, selectedStyle === st.id && styles.activeStyleChip]}
                  onPress={() => setSelectedStyle(st.id)}
                >
                  <Text style={[styles.styleChipText, selectedStyle === st.id && styles.activeStyleChipText]}>
                    {st.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {aiLoading ? (
              <View style={styles.aiLoadingBox}>
                <ActivityIndicator size="large" color="#8b5cf6" />
                <Text style={styles.aiLoadingText}>Gemini armoni motoru akorları yeniden yazıyor...</Text>
              </View>
            ) : aiResult ? (
              <View style={styles.aiResultWrapper}>
                <Text style={styles.aiNotesText}>💡 {aiResult.notes}</Text>
                <ScrollView style={styles.aiPreviewBox}>
                  <Text style={styles.aiPreviewContent}>{aiResult.content}</Text>
                </ScrollView>
              </View>
            ) : (
              <Text style={styles.aiPromptInfo}>
                Seçtiğiniz tarza uygun olarak şarkının melodisi korunacak, akorlar zenginleştirilecektir.
              </Text>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setAiModalVisible(false);
                  setAiResult(null);
                }}
              >
                <Text style={styles.modalCancelText}>Kapat</Text>
              </TouchableOpacity>

              {aiResult ? (
                <TouchableOpacity
                  style={[styles.modalSubmitBtn, { backgroundColor: '#10b981' }]}
                  onPress={applyAiArrangement}
                >
                  <Text style={styles.modalSubmitText}>Sahneye Uygula</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.modalSubmitBtn, { backgroundColor: '#8b5cf6' }]}
                  onPress={handleRunAiArrangement}
                  disabled={aiLoading}
                >
                  <Text style={styles.modalSubmitText}>Aranje Üret</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

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

      {/* SİSTEM MODALLARI */}
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
      {activeModal === 'tuner' && (
        <TunerModal
          visible={true}
          onClose={() => setActiveModal(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: { flex: 1, backgroundColor: '#090d16', height: '100vh', overflow: 'hidden' as any },
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
  userControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userBadge: { color: '#38bdf8', fontSize: 11, fontWeight: '600' },
  logoutBtn: { backgroundColor: '#ef444420', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: '#ef444450' },
  logoutBtnText: { color: '#f87171', fontSize: 10, fontWeight: '700' },
  advBanner: { height: 40, backgroundColor: '#0284c710', justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#0284c725' },
  advBannerText: { color: '#38bdf8', fontSize: 11, fontWeight: '600' },
  
  // ADMIN DASHBOARD STİLLERİ
  adminDashboardWrapper: { flex: 1, backgroundColor: '#070a12', padding: 20 },
  adminTopHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b', marginBottom: 16 },
  returnPortalBtn: { backgroundColor: '#1e293b', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#334155' },
  returnPortalBtnText: { color: '#38bdf8', fontWeight: '700', fontSize: 12 },
  adminMainTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  adminStatsBox: { flexDirection: 'row', gap: 10 },
  adminStatChip: { backgroundColor: '#8b5cf620', color: '#c084fc', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, fontSize: 11, fontWeight: '700', borderWidth: 1, borderColor: '#8b5cf640' },
  adminTabSelector: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  adminTabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b' },
  activeAdminTabBtn: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
  adminTabBtnText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  activeAdminTabText: { color: '#ffffff' },
  adminTabContent: { flex: 1 },
  emptyAdminBox: { padding: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#1e293b' },
  emptyAdminText: { color: '#94a3b8', fontSize: 13 },
  correctionsList: { gap: 12 },
  correctionCard: { backgroundColor: '#0f172a', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#1e293b' },
  corrHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  corrSongTitle: { color: '#f8fafc', fontSize: 14, fontWeight: '800' },
  corrActionBtns: { flexDirection: 'row', gap: 8 },
  corrApproveBtn: { backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 5 },
  corrRejectBtn: { backgroundColor: '#ef444420', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 5, borderWidth: 1, borderColor: '#ef444450' },
  corrBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  corrBtnTextRed: { color: '#f87171', fontSize: 11, fontWeight: '700' },
  corrNote: { color: '#38bdf8', fontSize: 12, marginBottom: 8, fontStyle: 'italic' },
  corrCodeBox: { maxHeight: 150, backgroundColor: '#090d16', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#1e293b' },
  corrCodeText: { color: '#f8fafc', fontFamily: 'monospace', fontSize: 11, lineHeight: 18 },

  // YENİ ŞARKI FORMU
  addSongForm: { backgroundColor: '#0f172a', borderRadius: 8, padding: 20, borderWidth: 1, borderColor: '#1e293b', gap: 14, maxWidth: 800 },
  formRow: { flexDirection: 'row', gap: 12 },
  formLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  formInput: { backgroundColor: '#090d16', color: '#f8fafc', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#334155', fontSize: 12 },
  saveSongBtn: { backgroundColor: '#0284c7', paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginTop: 8 },
  saveSongBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13 },

  // KULLANICI TABLOSU STİLLERİ
  usersTableWrapper: { maxWidth: 900 },
  tableCard: { backgroundColor: '#0f172a', borderRadius: 8, borderWidth: 1, borderColor: '#1e293b', overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#151e33', padding: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  thText: { color: '#38bdf8', fontSize: 11, fontWeight: '700' },
  tableBodyRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#131c2e' },
  tdTextEmail: { color: '#f8fafc', fontSize: 12, fontWeight: '600' },
  tdTextSub: { color: '#64748b', fontSize: 10, marginTop: 2 },
  tdBadge: { color: '#f59e0b', fontSize: 11, fontWeight: '700' },
  roleActionButtons: { flex: 2, flexDirection: 'row', gap: 4 },
  roleMiniBtn: { backgroundColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#334155' },
  activeMiniBtn: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  activeMiniBtnAdmin: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
  roleMiniBtnText: { color: '#94a3b8', fontSize: 9, fontWeight: '700' },
  roleMiniBtnTextAdmin: { color: '#ffffff', fontSize: 9, fontWeight: '700' },

  // PORTAL GÖVDE DÜZENİ
  portalBodyWrapper: { flex: 1, display: 'flex' as any, flexDirection: 'column' },

  // STANDART ARAMA VE FİLTRELEME
  searchSection: { 
    backgroundColor: '#0d1322', 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#1e293b', 
    zIndex: 50, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  searchInnerWrapper: { width: '100%', maxWidth: 960, alignItems: 'center' },
  searchInput: { 
    backgroundColor: '#1e293b', 
    height: 38, 
    borderRadius: 8, 
    paddingHorizontal: 14, 
    color: '#f8fafc', 
    fontSize: 13, 
    marginBottom: 8, 
    width: '100%', 
    maxWidth: 680, 
    borderWidth: 1, 
    borderColor: '#334155' 
  },
  filterBar: { marginBottom: 8, zIndex: 40, width: '100%', alignItems: 'center', justifyContent: 'center' },
  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 6 },
  filterChip: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  activeChip: { backgroundColor: '#0284c7' },
  filterChipText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  activeChipText: { color: '#ffffff' },
  filterChipSpecial: { backgroundColor: '#8b5cf620', borderWidth: 1, borderColor: '#8b5cf6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  activeChipSpecial: { backgroundColor: '#8b5cf6' },
  filterChipTextSpecial: { color: '#c084fc', fontSize: 11, fontWeight: '700' },

  dropdownContainer: { position: 'relative' },
  dropdownBtn: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#334155' },
  activeDropdownBtn: { borderColor: '#38bdf8', backgroundColor: '#0284c725' },
  dropdownBtnText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  activeDropdownBtnText: { color: '#38bdf8' },
  dropdownMenu: { position: 'absolute', top: 28, left: 0, width: 140, backgroundColor: '#0f172a', borderRadius: 6, borderWidth: 1, borderColor: '#334155', zIndex: 100, elevation: 10 },
  dropdownItem: { paddingHorizontal: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  activeDropdownItem: { backgroundColor: '#0284c730' },
  dropdownItemText: { color: '#94a3b8', fontSize: 11 },
  activeDropdownItemText: { color: '#38bdf8', fontWeight: '700' },

  alphaScrollView: { width: '100%', maxWidth: 820 },
  alphaScrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: 4 },
  alphaChar: { width: 22, height: 22, justifyContent: 'center', alignItems: 'center', borderRadius: 4, backgroundColor: '#151e33' },
  activeAlphaChar: { backgroundColor: '#0284c7' },
  alphaCharText: { color: '#94a3b8', fontSize: 10, fontWeight: '600' },
  activeAlphaCharText: { color: '#ffffff' },

  // 3 KOLONLU GÖVDE: SABİT KALIR VE İÇİNDEKİLER KAYAR
  mainGrid: { flex: 1, flexDirection: 'row', overflow: 'hidden' as any },
  leftCol: { width: 280, borderRightWidth: 1, borderRightColor: '#1e293b', backgroundColor: '#090d16', display: 'flex' as any, flexDirection: 'column' },
  colHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  colHeaderText: { color: '#f8fafc', fontWeight: '700', fontSize: 12 },
  counterText: { color: '#38bdf8', fontSize: 11 },
  songListScroll: { flex: 1 },
  songCard: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#131c2e', alignItems: 'center' },
  songCardSelected: { backgroundColor: '#1e293b' },
  songCardTitle: { color: '#cbd5e1', fontSize: 12, fontWeight: '600' },
  songCardArtist: { color: '#64748b', fontSize: 10, marginTop: 2 },
  keyTag: { color: '#38bdf8', fontWeight: '700', fontSize: 11 },
  textWhite: { color: '#ffffff' },
  
  centerCol: { flex: 1, backgroundColor: '#070a12', display: 'flex' as any },
  songViewWrapper: { flex: 1, padding: 16 },
  actionHeaderRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' },
  actionBtnAI: { backgroundColor: '#8b5cf6', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 5 },
  revertBtn: { backgroundColor: '#334155', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 5 },
  revertBtnText: { color: '#38bdf8', fontWeight: '700', fontSize: 11 },
  actionBtnSecondary: { backgroundColor: '#1e293b', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 5 },
  actionBtnPro: { backgroundColor: '#f59e0b', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 5 },
  disabledBtn: { opacity: 0.5 },
  actionBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 11 },
  actionBtnTextSec: { color: '#cbd5e1', fontWeight: '600', fontSize: 11 },
  actionBtnTextPro: { color: '#000000', fontWeight: '800', fontSize: 11 },

  // AUTO SCROLL STİLLERİ
  autoScrollControls: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#0f172a', 
    padding: 8, 
    borderRadius: 6, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#1e293b' 
  },
  scrollToggleBtn: { backgroundColor: '#1e293b', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4, borderWidth: 1, borderColor: '#334155' },
  scrollToggleBtnActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  scrollToggleBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  speedButtonGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  speedLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },
  speedBtn: { backgroundColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  speedBtnActive: { backgroundColor: '#0284c7' },
  speedBtnText: { color: '#94a3b8', fontSize: 10, fontWeight: '700' },

  songHeaderBox: { borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 12, marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  songMainTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '800' },
  stdBadge: { backgroundColor: '#0284c720', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  aiActiveBadge: { backgroundColor: '#8b5cf625' },
  stdBadgeText: { color: '#38bdf8', fontSize: 10, fontWeight: '600' },
  aiActiveBadgeText: { color: '#c084fc', fontWeight: '700' },
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
  correctionBtn: { marginTop: 12, marginBottom: 24, padding: 10, borderRadius: 6, backgroundColor: '#1e293b', alignItems: 'center' },
  correctionBtnText: { color: '#38bdf8', fontSize: 11, fontWeight: '600' },
  emptyCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyCenterText: { color: '#475569', fontSize: 13 },
  
  rightCol: { width: 300, padding: 12, backgroundColor: '#090d16', borderLeftWidth: 1, borderLeftColor: '#1e293b' },
  memberPanel: { backgroundColor: '#0f172a', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: '#1e293b' },
  memberPanelTitle: { color: '#38bdf8', fontSize: 11, fontWeight: '700', marginBottom: 8 },
  memberCard: { marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  memberName: { color: '#f8fafc', fontSize: 12, fontWeight: '600' },
  memberTier: { color: '#f59e0b', fontSize: 10, fontWeight: '700', marginTop: 2 },
  memberLinks: { gap: 6 },
  memberLinkBtn: { backgroundColor: '#1e293b', padding: 7, borderRadius: 4 },
  memberLinkText: { color: '#cbd5e1', fontSize: 10 },
  panelLogoutBtn: { backgroundColor: '#ef444415', borderWidth: 1, borderColor: '#ef444440', marginTop: 6 },
  panelLogoutText: { color: '#f87171', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  advBlock: { height: 160, marginTop: 12, backgroundColor: '#0d1322', borderRadius: 6, borderWidth: 1, borderColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed' },
  advBlockTitle: { color: '#475569', fontSize: 10, fontWeight: '600' },

  // 4 KOLONLU FOOTER: SABİT TABAN
  richFooter: { backgroundColor: '#060911', borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 16 },
  footerInner: { flexDirection: 'row', justifyContent: 'space-between', maxWidth: 1200, marginHorizontal: 'auto', paddingHorizontal: 20, width: '100%', gap: 20 },
  footerCol: { flex: 1 },
  footerColTitle: { color: '#38bdf8', fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 },
  footerLink: { color: '#94a3b8', fontSize: 10, marginBottom: 5 },
  footerDesc: { color: '#64748b', fontSize: 10, lineHeight: 14, marginBottom: 8 },
  appBadgeRow: { flexDirection: 'row', gap: 6 },
  appBadge: { backgroundColor: '#1e293b', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: '#334155' },
  appBadgeText: { color: '#cbd5e1', fontSize: 9, fontWeight: '600' },
  footerBottomBar: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#0f172a', paddingVertical: 8, alignItems: 'center' },
  footerCopyText: { color: '#475569', fontSize: 9, letterSpacing: 0.5 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: 500, backgroundColor: '#0f172a', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#1e293b' },
  modalTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  modalSubtitle: { color: '#38bdf8', fontSize: 12, marginBottom: 12 },
  label: { color: '#94a3b8', fontSize: 11, marginBottom: 6, fontWeight: '600' },

  styleSelectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  styleChip: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#334155' },
  activeStyleChip: { backgroundColor: '#8b5cf625', borderColor: '#8b5cf6' },
  styleChipText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  activeStyleChipText: { color: '#c084fc', fontWeight: '700' },
  aiLoadingBox: { height: 140, justifyContent: 'center', alignItems: 'center', gap: 10 },
  aiLoadingText: { color: '#c084fc', fontSize: 12 },
  aiPromptInfo: { color: '#64748b', fontSize: 12, lineHeight: 18, marginBottom: 16 },
  aiResultWrapper: { marginBottom: 14 },
  aiNotesText: { color: '#38bdf8', fontSize: 11, marginBottom: 8, fontWeight: '600' },
  aiPreviewBox: { height: 180, backgroundColor: '#090d16', borderRadius: 6, padding: 10, borderWidth: 1, borderColor: '#1e293b' },
  aiPreviewContent: { color: '#f8fafc', fontFamily: 'monospace', fontSize: 11, lineHeight: 18 },

  modalTextInput: { backgroundColor: '#090d16', color: '#f8fafc', borderRadius: 5, padding: 8, fontFamily: 'monospace', fontSize: 12, height: 140, textAlignVertical: 'top', borderWidth: 1, borderColor: '#1e293b', marginBottom: 10 },
  modalNoteInput: { backgroundColor: '#090d16', color: '#f8fafc', borderRadius: 5, padding: 8, fontSize: 12, height: 36, borderWidth: 1, borderColor: '#1e293b', marginBottom: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  modalCancelBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 5, backgroundColor: '#1e293b' },
  modalCancelText: { color: '#94a3b8', fontSize: 12 },
  modalSubmitBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 5, backgroundColor: '#0284c7' },
  modalSubmitText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
});