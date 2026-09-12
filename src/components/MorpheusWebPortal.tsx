import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { transposeContent, transposeChord, isChordLine } from '../utils/chordEngine';
import {
  Search,
  Share2,
  Smartphone,
  Sparkles,
  Plus,
  Minus,
  Globe,
  GraduationCap,
  MessageSquare,
  Calendar,
  ShoppingBag,
  X,
  Clock,
  Star,
  Flame,
  Filter,
  Eye,
  Check,
} from 'lucide-react-native';

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
  genre?: string;
  origin?: 'DOMESTIC' | 'FOREIGN';
  release_year?: number;
  view_count?: number;
  version_number?: number;
  version_desc?: string;
  rating_avg?: number;
  rating_count?: number;
}

interface Props {
  onSendToStage: (song: Song) => void;
}

const TURKISH_ALPHABET = [
  'A', 'B', 'C', 'Ç', 'D', 'E', 'F', 'G', 'H', 'I', 'İ',
  'J', 'K', 'L', 'M', 'N', 'O', 'Ö', 'P', 'R', 'S', 'Ş',
  'T', 'U', 'Ü', 'V', 'Y', 'Z'
];

const GENRES = ['Tümü', 'Rock', 'Pop', 'Arabesk', 'Türk Sanat', 'Caz/Blues', 'Akustik', 'Metal'];
const DECADES = [
  { label: 'Tüm Yıllar', min: 0, max: 3000 },
  { label: "70'ler", min: 1970, max: 1979 },
  { label: "80'ler", min: 1980, max: 1989 },
  { label: "90'lar", min: 1990, max: 1999 },
  { label: "2000'ler", min: 2000, max: 2009 },
  { label: '2010+', min: 2010, max: 2099 },
];

const MONO_FONT = Platform.select({
  web: 'Consolas, Monaco, "Courier New", monospace',
  default: 'monospace',
});

export default function MorpheusWebPortal({ onSendToStage }: Props) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtre State'leri
  const [selectedGenre, setSelectedGenre] = useState('Tümü');
  const [selectedOrigin, setSelectedOrigin] = useState<'ALL' | 'DOMESTIC' | 'FOREIGN'>('ALL');
  const [selectedDecade, setSelectedDecade] = useState('Tüm Yıllar');
  const [sortByPopularity, setSortByPopularity] = useState(false);

  // Transpoze & Font Kontrolleri
  const [transposeValue, setTransposeValue] = useState(0);
  const [currentTone, setCurrentTone] = useState('');
  const [fontSize, setFontSize] = useState(15);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Oylama State'leri
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [userVoted, setUserVoted] = useState(false);

  // "Yakında Yayında" Modalı State'i
  const [comingSoonFeature, setComingSoonFeature] = useState<{
    title: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    fetchWebSongs();
  }, []);

  const fetchWebSongs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('morfeus_songs')
        .select('*')
        .order('rating_avg', { ascending: false });

      if (error) throw error;
      if (data) {
        setSongs(data);
        if (data.length > 0) {
          selectSongForView(data[0]);
        }
      }
    } catch (err) {
      console.error('Web kütüphanesi yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectSongForView = async (song: Song) => {
    setSelectedSong(song);
    setCurrentTone(song.original_key);
    setTransposeValue(0);
    setUserVoted(false);

    // Ziyaret Sayısını Arka Planda 1 Artır
    try {
      const newCount = (song.view_count || 0) + 1;
      await supabase
        .from('morfeus_songs')
        .update({ view_count: newCount })
        .eq('id', song.id);

      setSongs((prev) =>
        prev.map((s) => (s.id === song.id ? { ...s, view_count: newCount } : s))
      );
    } catch (e) {
      // Arka plan sayacı hatası akışı durdurmasın
    }
  };

  const handleTranspose = (step: number) => {
    setTransposeValue((prev) => prev + step);
    setCurrentTone((prev) => transposeChord(prev, step));
  };

  const handleRateSong = async (stars: number) => {
    if (!selectedSong || userVoted) return;

    try {
      setUserVoted(true);
      const currentCount = selectedSong.rating_count || 1;
      const currentAvg = Number(selectedSong.rating_avg) || 5;

      const newCount = currentCount + 1;
      const newAvg = Number(((currentAvg * currentCount + stars) / newCount).toFixed(2));

      await supabase.from('morfeus_ratings').insert([{ song_id: selectedSong.id, stars }]);
      await supabase
        .from('morfeus_songs')
        .update({ rating_avg: newAvg, rating_count: newCount })
        .eq('id', selectedSong.id);

      const updated = { ...selectedSong, rating_avg: newAvg, rating_count: newCount };
      setSelectedSong(updated);
      setSongs((prev) => prev.map((s) => (s.id === selectedSong.id ? updated : s)));
    } catch (err: any) {
      alert('Oylama iletilemedi: ' + err.message);
    }
  };

  const handleShareToApp = async (song: Song) => {
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
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 5000);
    } catch (err: any) {
      alert('Paylaşım kodu oluşturulamadı: ' + err.message);
    }
  };

  // Akorları hece üstüne dikey basan renderer
  const renderWebContent = (content: string) => {
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
                    { fontSize: Math.max(12, fontSize - 2), opacity: pair.chord ? 1 : 0 },
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

  // Top 3 Versiyon Mantığı & Gelişmiş Filtreleme
  const processedSongs = useMemo(() => {
    let result = songs.filter((s) => {
      const matchSearch =
        s.title.toLocaleLowerCase('tr').includes(searchQuery.toLocaleLowerCase('tr')) ||
        s.artist.toLocaleLowerCase('tr').includes(searchQuery.toLocaleLowerCase('tr'));
      if (!matchSearch) return false;

      if (selectedLetter && !s.title.trim().toLocaleUpperCase('tr').startsWith(selectedLetter)) {
        return false;
      }

      if (selectedGenre !== 'Tümü' && s.genre !== selectedGenre) {
        return false;
      }

      if (selectedOrigin !== 'ALL' && s.origin !== selectedOrigin) {
        return false;
      }

      if (selectedDecade !== 'Tüm Yıllar') {
        const dec = DECADES.find((d) => d.label === selectedDecade);
        if (dec && (s.release_year || 2000) < dec.min || (s.release_year || 2000) > dec.max) {
          return false;
        }
      }

      return true;
    });

    // Sanatçı araması yapılıyorsa: Şarkı başına en yüksek puanlı ilk 3 versiyon kuralı
    const isArtistSearch =
      searchQuery.trim().length > 0 &&
      result.some((s) => s.artist.toLocaleLowerCase('tr').includes(searchQuery.toLocaleLowerCase('tr')));

    if (isArtistSearch) {
      const groupedByTitle: { [key: string]: Song[] } = {};
      result.forEach((s) => {
        const key = s.title.toLocaleLowerCase('tr').trim();
        if (!groupedByTitle[key]) groupedByTitle[key] = [];
        groupedByTitle[key].push(s);
      });

      const limited: Song[] = [];
      Object.keys(groupedByTitle).forEach((k) => {
        const sortedVersions = groupedByTitle[k].sort(
          (a, b) => (b.rating_avg || 0) - (a.rating_avg || 0)
        );
        limited.push(...sortedVersions.slice(0, 3));
      });
      result = limited;
    }

    if (sortByPopularity) {
      return result.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
    }

    return result.sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0));
  }, [
    songs,
    searchQuery,
    selectedLetter,
    selectedGenre,
    selectedOrigin,
    selectedDecade,
    sortByPopularity,
  ]);

  return (
    <View style={styles.outerContainer}>
      {/* ================= 1. SUB-NAV BAR (YAKINDA LİNKLERİ) ================= */}
      <View style={styles.subNavBar}>
        <View style={styles.subNavBarInner}>
          <View style={styles.subNavLinks}>
            <TouchableOpacity
              style={styles.subNavLinkItem}
              onPress={() =>
                setComingSoonFeature({
                  title: 'Morpheus Müzik Kursları',
                  description:
                    'Canlı ve video kayıtlı enstrüman eğitimleri, workshoplar ve armoni dersleri çok yakında.',
                })
              }
            >
              <GraduationCap color="#94A3B8" size={14} />
              <Text style={styles.subNavLinkText}>Kurslar</Text>
              <View style={styles.soonPill}><Text style={styles.soonPillText}>YAKINDA</Text></View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.subNavLinkItem}
              onPress={() =>
                setComingSoonFeature({
                  title: 'Müzisyenler Forumu',
                  description:
                    'Şarkı tonları, grup arkadaşı bulma ve ekipman tartışmaları için topluluk alanı yakında yayında.',
                })
              }
            >
              <MessageSquare color="#94A3B8" size={14} />
              <Text style={styles.subNavLinkText}>Forum</Text>
              <View style={styles.soonPill}><Text style={styles.soonPillText}>YAKINDA</Text></View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.subNavLinkItem}
              onPress={() =>
                setComingSoonFeature({
                  title: 'Konser & Sahne Etkinlikleri',
                  description:
                    'Şehirdeki jam session buluşmaları, konserler ve açık sahne duyuruları çok yakında burada.',
                })
              }
            >
              <Calendar color="#94A3B8" size={14} />
              <Text style={styles.subNavLinkText}>Etkinlikler</Text>
              <View style={styles.soonPill}><Text style={styles.soonPillText}>YAKINDA</Text></View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.subNavLinkItem}
              onPress={() =>
                setComingSoonFeature({
                  title: 'Morpheus Mağaza',
                  description:
                    'Müzisyenlere özel penalar, sahne aksesuarları ve kişiselleştirilmiş tişörtler yakında yayında.',
                })
              }
            >
              <ShoppingBag color="#94A3B8" size={14} />
              <Text style={styles.subNavLinkText}>Mağaza</Text>
              <View style={styles.soonPill}><Text style={styles.soonPillText}>YAKINDA</Text></View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ================= 2. ÜST 728x90 STANDART REKLAM ALANI ================= */}
      <View style={styles.topAdSection}>
        <View style={styles.adBox728}>
          <Text style={styles.adTag}>REKLAM (728x90)</Text>
          <Text style={styles.adMessage} numberOfLines={1}>
            Morpheus Sahne İstasyonu • Akor, Söz, Transpoze, Canlı Tuner ve Çoklu Versiyon Motoru
          </Text>
        </View>
      </View>

      {/* ================= 3. 1280px MERKEZLENMİŞ GÖVDE ================= */}
      <View style={styles.centerContainerWrapper}>
        <View style={styles.mainContainer1280}>
          {/* ================= SOL KOLON: FİLTRELER & LİSTE (310px) ================= */}
          <View style={styles.leftColumn}>
            <View style={styles.leftHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Globe color="#38BDF8" size={15} />
                <Text style={styles.leftHeaderTitle}>Akor Kütüphanesi</Text>
              </View>
              <Text style={styles.songCountBadge}>{processedSongs.length} Kayıt</Text>
            </View>

            {/* Arama */}
            <View style={styles.searchBox}>
              <Search color="#64748B" size={14} />
              <TextInput
                style={styles.searchInput}
                placeholder="Şarkı veya sanatçı..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Popülerlik / En Çok Ziyaret Edilen Toggle */}
            <View style={styles.filterRowCompact}>
              <TouchableOpacity
                style={[styles.sortBtn, sortByPopularity && styles.sortBtnActive]}
                onPress={() => setSortByPopularity(!sortByPopularity)}
              >
                <Flame color={sortByPopularity ? '#F59E0B' : '#64748B'} size={13} />
                <Text style={[styles.sortBtnText, sortByPopularity && { color: '#F59E0B' }]}>
                  En Çok Ziyaret Edilenler
                </Text>
              </TouchableOpacity>

              {/* Yerli / Yabancı */}
              <View style={styles.originGroup}>
                <TouchableOpacity
                  style={[styles.originBtn, selectedOrigin === 'ALL' && styles.originBtnActive]}
                  onPress={() => setSelectedOrigin('ALL')}
                >
                  <Text style={[styles.originText, selectedOrigin === 'ALL' && styles.originTextActive]}>Hepsi</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.originBtn, selectedOrigin === 'DOMESTIC' && styles.originBtnActive]}
                  onPress={() => setSelectedOrigin('DOMESTIC')}
                >
                  <Text style={[styles.originText, selectedOrigin === 'DOMESTIC' && styles.originTextActive]}>Yerli</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.originBtn, selectedOrigin === 'FOREIGN' && styles.originBtnActive]}
                  onPress={() => setSelectedOrigin('FOREIGN')}
                >
                  <Text style={[styles.originText, selectedOrigin === 'FOREIGN' && styles.originTextActive]}>Yabancı</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Tür Filtresi (Scrollable) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.genreBar}
              contentContainerStyle={{ gap: 4, paddingHorizontal: 8 }}
            >
              {GENRES.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genreChip, selectedGenre === g && styles.genreChipActive]}
                  onPress={() => setSelectedGenre(g)}
                >
                  <Text style={[styles.genreText, selectedGenre === g && styles.genreTextActive]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* On-Yıl / Dönem Filtresi (80'ler, 90'lar vs.) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.decadeBar}
              contentContainerStyle={{ gap: 4, paddingHorizontal: 8 }}
            >
              {DECADES.map((d) => (
                <TouchableOpacity
                  key={d.label}
                  style={[styles.decadeChip, selectedDecade === d.label && styles.decadeChipActive]}
                  onPress={() => setSelectedDecade(d.label)}
                >
                  <Text style={[styles.decadeText, selectedDecade === d.label && styles.decadeTextActive]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* A-Z Alfabetik İndeks */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.alphaBar}
              contentContainerStyle={{ gap: 3, paddingHorizontal: 8 }}
            >
              <TouchableOpacity
                style={[styles.alphaBtn, !selectedLetter && styles.alphaBtnActive]}
                onPress={() => setSelectedLetter(null)}
              >
                <Text style={[styles.alphaTxt, !selectedLetter && styles.alphaTxtActive]}>
                  Tümü
                </Text>
              </TouchableOpacity>
              {TURKISH_ALPHABET.map((ch) => (
                <TouchableOpacity
                  key={ch}
                  style={[styles.alphaBtn, selectedLetter === ch && styles.alphaBtnActive]}
                  onPress={() => setSelectedLetter(selectedLetter === ch ? null : ch)}
                >
                  <Text style={[styles.alphaTxt, selectedLetter === ch && styles.alphaTxtActive]}>
                    {ch}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Şarkı ve Çoklu Versiyon Listesi */}
            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator color="#38BDF8" />
              </View>
            ) : (
              <ScrollView style={styles.songListScroll} showsVerticalScrollIndicator={false}>
                {processedSongs.map((s) => {
                  const isSelected = selectedSong?.id === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.songCard, isSelected && styles.songCardActive]}
                      onPress={() => selectSongForView(s)}
                    >
                      <View style={{ flex: 1, paddingRight: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text
                            style={[styles.songCardTitle, isSelected && styles.songCardTitleActive]}
                            numberOfLines={1}
                          >
                            {s.title}
                          </Text>
                          {s.version_number && s.version_number > 1 ? (
                            <View style={styles.versionBadge}>
                              <Text style={styles.versionBadgeText}>v{s.version_number}</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.songCardArtist} numberOfLines={1}>
                          {s.artist} {s.genre ? `• ${s.genre}` : ''}
                        </Text>
                      </View>

                      <View style={{ alignItems: 'flex-end', gap: 2 }}>
                        <View style={styles.ratingBadge}>
                          <Star color="#F59E0B" fill="#F59E0B" size={10} />
                          <Text style={styles.ratingText}>
                            {Number(s.rating_avg || 5.0).toFixed(1)}
                          </Text>
                        </View>
                        <View style={styles.keyTag}>
                          <Text style={styles.keyTagText}>{s.original_key}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {processedSongs.length === 0 && (
                  <Text style={styles.emptyText}>Kriterlere uygun eser bulunamadı.</Text>
                )}
              </ScrollView>
            )}
          </View>

          {/* ================= ORTA KOLON: OKUYUCU & DERECELENDİRME (ESNEK) ================= */}
          <View style={styles.centerColumn}>
            {selectedSong ? (
              <>
                <View style={styles.centerHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.centerSongTitle}>{selectedSong.title}</Text>
                      {selectedSong.version_desc && (
                        <View style={styles.versionDescBadge}>
                          <Text style={styles.versionDescText}>{selectedSong.version_desc}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.centerSongArtist}>
                      {selectedSong.artist} • {selectedSong.release_year || '2000'} • {selectedSong.genre || 'Rock'}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <TouchableOpacity
                      style={styles.bridgeBtn}
                      onPress={() => handleShareToApp(selectedSong)}
                    >
                      <Share2 color="#38BDF8" size={13} />
                      <Text style={styles.bridgeBtnText}>
                        {copiedCode ? copiedCode : 'Paylaşım Kodu'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.stageDirectBtn}
                      onPress={() => onSendToStage(selectedSong)}
                    >
                      <Smartphone color="#FFFFFF" size={13} />
                      <Text style={styles.stageDirectBtnText}>Sahne Modunda Aç</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 5 Yıldızlı Puanlama ve İstatistik Şeridi */}
                <View style={styles.ratingBar}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.rateLabel}>Akor Puanı:</Text>
                    <View style={{ flexDirection: 'row', gap: 2 }}>
                      {[1, 2, 3, 4, 5].map((star) => {
                        const filled = (hoveredStar ?? Math.round(selectedSong.rating_avg || 5)) >= star;
                        return (
                          <TouchableOpacity
                            key={star}
                            disabled={userVoted}
                            onPress={() => handleRateSong(star)}
                            onMouseEnter={() => !userVoted && setHoveredStar(star)}
                            onMouseLeave={() => !userVoted && setHoveredStar(null)}
                          >
                            <Star
                              color="#F59E0B"
                              fill={filled ? '#F59E0B' : 'transparent'}
                              size={16}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <Text style={styles.ratingDetailText}>
                      {Number(selectedSong.rating_avg || 5).toFixed(2)} ({selectedSong.rating_count || 1} oy)
                    </Text>
                    {userVoted && <Text style={styles.votedNotice}>Oyunuz alındı!</Text>}
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Eye color="#64748B" size={13} />
                    <Text style={styles.viewsCountText}>{selectedSong.view_count || 1} görüntülenme</Text>
                  </View>
                </View>

                {/* Okuyucu Kontrol Barı */}
                <View style={styles.readerControls}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={styles.tonDisplay}>
                      <Text style={styles.tonLabel}>TON:</Text>
                      <Text style={styles.tonValue}>{currentTone}</Text>
                    </View>

                    <View style={styles.transGroup}>
                      <TouchableOpacity
                        style={styles.circleBtn}
                        onPress={() => handleTranspose(-1)}
                      >
                        <Minus color="#FFFFFF" size={11} />
                      </TouchableOpacity>
                      <Text style={styles.transValueText}>
                        {transposeValue > 0 ? `+${transposeValue}` : transposeValue}
                      </Text>
                      <TouchableOpacity
                        style={styles.circleBtn}
                        onPress={() => handleTranspose(1)}
                      >
                        <Plus color="#FFFFFF" size={11} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 5 }}>
                    <TouchableOpacity
                      style={styles.fontBtn}
                      onPress={() => setFontSize((p) => Math.max(12, p - 1))}
                    >
                      <Text style={styles.fontBtnText}>A-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.fontBtn}
                      onPress={() => setFontSize((p) => Math.min(24, p + 1))}
                    >
                      <Text style={styles.fontBtnText}>A+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView
                  style={styles.lyricsScroll}
                  contentContainerStyle={styles.lyricsScrollContent}
                >
                  {renderWebContent(transposeContent(selectedSong.content, transposeValue))}
                </ScrollView>
              </>
            ) : (
              <View style={styles.center}>
                <Text style={styles.emptyText}>Görüntülemek için bir şarkı seçin.</Text>
              </View>
            )}
          </View>

          {/* ================= SAĞ KOLON: 300x600 REKLAM & AI MODÜLÜ (310px) ================= */}
          <View style={styles.rightColumn}>
            <View style={styles.adSkyscraper300x600}>
              <Text style={styles.adTag}>SPONSOR ALANI (300x600)</Text>
              <View style={styles.adInnerContent}>
                <Sparkles color="#38BDF8" size={30} />
                <Text style={styles.adHeroTitle}>Morpheus AI Tarz Aranjörü</Text>
                <Text style={styles.adHeroDesc}>
                  Şarkıyı tek dokunuşla Jazz, Flamenco veya Arabesk tarzına çevirin.
                </Text>
                <View style={styles.adBadgeOutline}>
                  <Text style={styles.adBadgeText}>Gemini Mimarisi</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* YAKINDA YAYINDA MODALI */}
      <Modal
        visible={!!comingSoonFeature}
        transparent
        animationType="fade"
        onRequestClose={() => setComingSoonFeature(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Clock color="#F59E0B" size={18} />
                <Text style={styles.modalCardTitle}>{comingSoonFeature?.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setComingSoonFeature(null)}>
                <X color="#94A3B8" size={18} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalCardBodyText}>{comingSoonFeature?.description}</Text>
            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={() => setComingSoonFeature(null)}
            >
              <Text style={styles.modalConfirmBtnText}>Anladım</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#070B13' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  subNavBar: {
    width: '100%',
    backgroundColor: '#0B1120',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    alignItems: 'center',
  },
  subNavBarInner: {
    width: '100%',
    maxWidth: 1280,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  subNavLinks: { flexDirection: 'row', gap: 18, alignItems: 'center' },
  subNavLinkItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  subNavLinkText: { color: '#CBD5E1', fontSize: 12, fontWeight: '600' },
  soonPill: {
    backgroundColor: '#1E293B',
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  soonPillText: { color: '#F59E0B', fontSize: 9, fontWeight: '900' },

  topAdSection: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#070B13',
  },
  adBox728: {
    width: '100%',
    maxWidth: 728,
    height: 48,
    backgroundColor: '#0F172A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  adTag: {
    backgroundColor: '#0284C7',
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 3,
  },
  adMessage: { color: '#94A3B8', fontSize: 11, fontWeight: '500', flex: 1 },

  centerContainerWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  mainContainer1280: {
    flex: 1,
    width: '100%',
    maxWidth: 1280,
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#0B1120',
  },

  // Sol Kolon
  leftColumn: {
    width: 310,
    backgroundColor: '#090E1A',
    borderRightWidth: 1,
    borderRightColor: '#1E293B',
    display: 'flex',
    flexDirection: 'column',
  },
  leftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  leftHeaderTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: 'bold' },
  songCountBadge: { color: '#64748B', fontSize: 11, fontWeight: 'bold' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161F30',
    margin: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  searchInput: { flex: 1, color: '#F8FAFC', fontSize: 12, outlineStyle: 'none' } as any,

  filterRowCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#161F30',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  sortBtnActive: { backgroundColor: '#312E81' },
  sortBtnText: { color: '#94A3B8', fontSize: 10, fontWeight: 'bold' },
  originGroup: { flexDirection: 'row', backgroundColor: '#161F30', borderRadius: 4, padding: 1 },
  originBtn: { paddingVertical: 3, paddingHorizontal: 6, borderRadius: 3 },
  originBtnActive: { backgroundColor: '#0284C7' },
  originText: { color: '#64748B', fontSize: 10, fontWeight: 'bold' },
  originTextActive: { color: '#FFFFFF' },

  genreBar: { maxHeight: 26, marginBottom: 4 },
  genreChip: {
    backgroundColor: '#161F30',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 4,
  },
  genreChipActive: { backgroundColor: '#0284C7' },
  genreText: { color: '#94A3B8', fontSize: 10, fontWeight: '600' },
  genreTextActive: { color: '#FFFFFF' },

  decadeBar: { maxHeight: 26, marginBottom: 6 },
  decadeChip: {
    backgroundColor: '#161F30',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  decadeChipActive: { backgroundColor: '#38BDF8' },
  decadeText: { color: '#64748B', fontSize: 10, fontWeight: 'bold' },
  decadeTextActive: { color: '#000000' },

  alphaBar: { maxHeight: 28, marginBottom: 6 },
  alphaBtn: { paddingVertical: 2, paddingHorizontal: 5, borderRadius: 3, backgroundColor: '#161F30' },
  alphaBtnActive: { backgroundColor: '#38BDF8' },
  alphaTxt: { color: '#64748B', fontSize: 9, fontWeight: 'bold' },
  alphaTxtActive: { color: '#000000' },

  songListScroll: { flex: 1, paddingHorizontal: 8 },
  songCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 8,
    borderRadius: 6,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  songCardActive: { borderColor: '#38BDF8', backgroundColor: '#161F30' },
  songCardTitle: { color: '#F8FAFC', fontSize: 12, fontWeight: 'bold' },
  songCardTitleActive: { color: '#38BDF8' },
  songCardArtist: { color: '#64748B', fontSize: 10, marginTop: 1 },
  versionBadge: {
    backgroundColor: '#334155',
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  versionBadgeText: { color: '#38BDF8', fontSize: 9, fontWeight: 'bold' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { color: '#F59E0B', fontSize: 10, fontWeight: 'bold' },
  keyTag: { backgroundColor: '#1E293B', paddingVertical: 1, paddingHorizontal: 5, borderRadius: 3 },
  keyTagText: { color: '#38BDF8', fontSize: 9, fontWeight: 'bold' },
  emptyText: { color: '#64748B', fontSize: 11, textAlign: 'center', marginTop: 24 },

  // Orta Kolon
  centerColumn: { flex: 1, backgroundColor: '#070B13', display: 'flex', flexDirection: 'column' },
  centerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0B1120',
  },
  centerSongTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: 'bold' },
  centerSongArtist: { color: '#94A3B8', fontSize: 11, marginTop: 1 },
  versionDescBadge: {
    backgroundColor: '#1E293B',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  versionDescText: { color: '#38BDF8', fontSize: 10, fontWeight: 'bold' },
  bridgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 5,
    gap: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bridgeBtnText: { color: '#38BDF8', fontWeight: 'bold', fontSize: 10 },
  stageDirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 5,
    gap: 4,
  },
  stageDirectBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 10 },

  // Oylama Şeridi
  ratingBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 5,
    backgroundColor: '#0A0F1D',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  rateLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  ratingDetailText: { color: '#CBD5E1', fontSize: 11, fontWeight: 'bold' },
  votedNotice: { color: '#10B981', fontSize: 10, fontWeight: 'bold' },
  viewsCountText: { color: '#64748B', fontSize: 10, fontWeight: 'bold' },

  readerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  tonDisplay: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tonLabel: { color: '#64748B', fontSize: 10, fontWeight: 'bold' },
  tonValue: { color: '#38BDF8', fontSize: 12, fontWeight: 'bold' },
  transGroup: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  circleBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transValueText: { color: '#F8FAFC', fontSize: 11, fontWeight: 'bold', minWidth: 18, textAlign: 'center' },
  fontBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  fontBtnText: { color: '#94A3B8', fontSize: 10, fontWeight: 'bold' },

  lyricsScroll: { flex: 1 },
  lyricsScrollContent: { padding: 18, paddingBottom: 60 },
  lineBox: { marginBottom: 5 },
  chordOnlyText: { color: '#F87171', fontWeight: 'bold', lineHeight: 20 },
  chordLyricRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 8 },
  heceColumn: { flexDirection: 'column', alignItems: 'flex-start', marginRight: 1 },
  aboveChord: { color: '#F87171', fontWeight: '900', marginBottom: 1, letterSpacing: 0.5 },
  lyricText: { color: '#E2E8F0', lineHeight: 20 },

  // Sağ Kolon
  rightColumn: {
    width: 310,
    backgroundColor: '#090E1A',
    borderLeftWidth: 1,
    borderLeftColor: '#1E293B',
    padding: 10,
    alignItems: 'center',
  },
  adSkyscraper300x600: {
    width: '100%',
    height: 520,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
    alignItems: 'center',
  },
  adInnerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8, gap: 10 },
  adHeroTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  adHeroDesc: { color: '#94A3B8', fontSize: 11, textAlign: 'center', lineHeight: 16 },
  adBadgeOutline: {
    borderWidth: 1,
    borderColor: '#0284C7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginTop: 6,
  },
  adBadgeText: { color: '#38BDF8', fontSize: 10, fontWeight: 'bold' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalCardTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: 'bold' },
  modalCardBodyText: { color: '#94A3B8', fontSize: 12, lineHeight: 18, marginBottom: 14 },
  modalConfirmBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  modalConfirmBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
});