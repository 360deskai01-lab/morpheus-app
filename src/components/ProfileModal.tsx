import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ArrowLeft, UserRound } from 'lucide-react-native';
import { isDisplayNameTaken, updateOwnProfile, type ProfilePatch } from '../services/authService';
import { pickLocalImageFile, stampCloudBackup, uploadProfileAvatar } from '../services/profileExtras';
import {
  CHORD_PALETTES,
  STAGE_BADGES,
  displayTier,
  isUpperMembership,
  resolveBadge,
} from '../utils/membership';

interface Props {
  userId: string;
  email?: string | null;
  fullName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  stageBadge?: string | null;
  chordPalette?: string | null;
  cloudBackupAt?: string | null;
  membershipTier?: string | null;
  premiumUntil?: string | null;
  isAdmin?: boolean;
  playlistCount?: number;
  onBackToStage: () => void;
  onLogout?: () => void;
  onOpenPlaylists?: () => void;
  onProfileUpdated: (patch: ProfilePatch) => void;
}

export default function ProfileStage({
  userId,
  email,
  fullName,
  phone,
  avatarUrl,
  stageBadge,
  chordPalette,
  cloudBackupAt,
  membershipTier,
  premiumUntil,
  isAdmin,
  playlistCount = 0,
  onBackToStage,
  onLogout,
  onOpenPlaylists,
  onProfileUpdated,
}: Props) {
  const tier = displayTier(membershipTier, isAdmin);
  const upper = isUpperMembership(membershipTier, isAdmin, premiumUntil);
  const badge = resolveBadge(stageBadge);
  const [nameValue, setNameValue] = useState(fullName || '');
  const [phoneValue, setPhoneValue] = useState(phone || '');
  const [nameStatus, setNameStatus] = useState<'idle' | 'checking' | 'saving' | 'saved' | 'taken' | 'error'>('idle');
  const [phoneStatus, setPhoneStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [nameMessage, setNameMessage] = useState('');
  const [phoneMessage, setPhoneMessage] = useState('');
  const nameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phoneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');

  useEffect(() => {
    setNameValue(fullName || '');
    setPhoneValue(phone || '');
  }, [fullName, phone, userId]);

  useEffect(() => {
    return () => {
      if (nameTimer.current) clearTimeout(nameTimer.current);
      if (phoneTimer.current) clearTimeout(phoneTimer.current);
    };
  }, []);

  const persistName = async (raw: string) => {
    const clean = raw.replace(/\s+/g, ' ').trim();
    if (!clean) {
      setNameStatus('error');
      setNameMessage('Görünen ad boş bırakılamaz.');
      return;
    }
    if (clean === (fullName || '').replace(/\s+/g, ' ').trim()) {
      setNameStatus('idle');
      setNameMessage('');
      return;
    }

    setNameStatus('checking');
    setNameMessage('İsim uygunluğu kontrol ediliyor...');
    const taken = await isDisplayNameTaken(clean, userId);
    if (taken) {
      setNameStatus('taken');
      setNameMessage('Bu görünen ad başka bir profilde kayıtlı. Lütfen farklı bir isim seçin.');
      return;
    }

    setNameStatus('saving');
    try {
      await updateOwnProfile(userId, { full_name: clean });
      onProfileUpdated({ full_name: clean });
      setNameStatus('saved');
      setNameMessage('Görünen ad kaydedildi.');
    } catch (err: any) {
      setNameStatus('error');
      setNameMessage(err.message || 'İsim kaydedilemedi.');
    }
  };

  const persistPhone = async (raw: string) => {
    const clean = raw.replace(/\s+/g, ' ').trim();
    const next = clean || null;
    if ((phone || null) === next) {
      setPhoneStatus('idle');
      setPhoneMessage('');
      return;
    }

    setPhoneStatus('saving');
    try {
      await updateOwnProfile(userId, { phone: next });
      onProfileUpdated({ phone: next });
      setPhoneStatus('saved');
      setPhoneMessage(next ? 'Telefon numarası kaydedildi.' : 'Telefon numarası kaldırıldı.');
    } catch (err: any) {
      setPhoneStatus('error');
      setPhoneMessage(err.message || 'Telefon kaydedilemedi.');
    }
  };

  const onNameChange = (value: string) => {
    setNameValue(value);
    setNameStatus('idle');
    setNameMessage('');
    if (nameTimer.current) clearTimeout(nameTimer.current);
    nameTimer.current = setTimeout(() => persistName(value), 700);
  };

  const onPhoneChange = (value: string) => {
    setPhoneValue(value);
    setPhoneStatus('idle');
    setPhoneMessage('');
    if (phoneTimer.current) clearTimeout(phoneTimer.current);
    phoneTimer.current = setTimeout(() => persistPhone(value), 700);
  };

  return (
    <ScrollView style={styles.wrapper} showsVerticalScrollIndicator>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <UserRound color="#38BDF8" size={18} />
          <Text style={styles.headerTitle}>Profil Detayları</Text>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={onBackToStage}>
          <ArrowLeft color="#38BDF8" size={16} />
          <Text style={styles.backBtnText}>Sahneye Dön</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.identityRow}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <UserRound color="#38BDF8" size={22} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.email}>{email}</Text>
            <View style={[styles.tierChip, { borderColor: badge.color }]}>
              <Text style={[styles.tierText, { color: badge.color }]}>{tier} · {badge.label}</Text>
            </View>
            {premiumUntil ? (
              <Text style={styles.statusOk}>Premium bitiş: {new Date(premiumUntil).toLocaleDateString('tr-TR')}</Text>
            ) : null}
          </View>
        </View>

        {upper ? (
          <View style={styles.premiumBox}>
            <Text style={styles.label}>Profil resmi (üst paket)</Text>
            <TouchableOpacity
              style={styles.secondaryBtn}
              disabled={avatarBusy}
              onPress={async () => {
                setAvatarBusy(true);
                setAvatarMessage('');
                try {
                  const file = await pickLocalImageFile();
                  if (!file) {
                    setAvatarBusy(false);
                    return;
                  }
                  const url = await uploadProfileAvatar(userId, file);
                  onProfileUpdated({ avatar_url: url });
                  setAvatarMessage('Avatar güncellendi.');
                } catch (err: any) {
                  setAvatarMessage(err.message || 'Avatar yüklenemedi. Storage bucket henüz açılmamış olabilir.');
                }
                setAvatarBusy(false);
              }}
            >
              <Text style={styles.secondaryBtnText}>{avatarBusy ? 'Yükleniyor...' : 'Avatar Yükle / Değiştir'}</Text>
            </TouchableOpacity>
            {avatarMessage ? <Text style={styles.statusOk}>{avatarMessage}</Text> : null}

            <Text style={styles.label}>Sahne rozeti</Text>
            <View style={styles.chipRow}>
              {STAGE_BADGES.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.choiceChip, stageBadge === item.id && { borderColor: item.color, backgroundColor: `${item.color}22` }]}
                  onPress={async () => {
                    await updateOwnProfile(userId, { stage_badge: item.id });
                    onProfileUpdated({ stage_badge: item.id });
                  }}
                >
                  <Text style={[styles.choiceChipText, { color: item.color }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Favori akor paleti</Text>
            <View style={styles.chipRow}>
              {Object.values(CHORD_PALETTES).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.choiceChip, chordPalette === item.id && { borderColor: item.chord, backgroundColor: `${item.chord}22` }]}
                  onPress={async () => {
                    await updateOwnProfile(userId, { chord_palette: item.id });
                    onProfileUpdated({ chord_palette: item.id });
                  }}
                >
                  <Text style={[styles.choiceChipText, { color: item.chord }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Bulut yedekleme</Text>
            <Text style={styles.backupMeta}>
              Son yedek: {cloudBackupAt ? new Date(cloudBackupAt).toLocaleString('tr-TR') : 'Henüz alınmadı'}
            </Text>
            <TouchableOpacity
              style={styles.secondaryBtn}
              disabled={backupBusy}
              onPress={async () => {
                setBackupBusy(true);
                try {
                  const stamp = await stampCloudBackup(userId);
                  onProfileUpdated({ cloud_backup_at: stamp });
                  setBackupMessage('Profil ve repertuvar damgası buluta işlendi.');
                } catch (err: any) {
                  setBackupMessage(err.message || 'Yedekleme kaydı yazılamadı.');
                }
                setBackupBusy(false);
              }}
            >
              <Text style={styles.secondaryBtnText}>{backupBusy ? 'Yedekleniyor...' : 'Şimdi Yedekle'}</Text>
            </TouchableOpacity>
            {backupMessage ? <Text style={styles.statusOk}>{backupMessage}</Text> : null}
          </View>
        ) : (
          <Text style={styles.lockNote}>Avatar, rozet, palet ve bulut yedekleme Sahne Pro / Band / Admin paketlerine özeldir.</Text>
        )}

        <Text style={styles.label}>Görünen ad</Text>
        <TextInput
          style={[styles.input, nameStatus === 'taken' && styles.inputError]}
          value={nameValue}
          onChangeText={onNameChange}
          onBlur={() => persistName(nameValue)}
          placeholder="Sahne adı veya ad soyad"
          placeholderTextColor="#64748b"
          autoCapitalize="words"
        />
        <View style={styles.statusRow}>
          {(nameStatus === 'checking' || nameStatus === 'saving') && (
            <ActivityIndicator color="#38BDF8" size="small" />
          )}
          {nameMessage ? (
            <Text
              style={[
                styles.statusText,
                nameStatus === 'taken' || nameStatus === 'error' ? styles.statusError : styles.statusOk,
              ]}
            >
              {nameMessage}
            </Text>
          ) : null}
        </View>

        <Text style={styles.label}>Telefon (isteğe bağlı)</Text>
        <TextInput
          style={styles.input}
          value={phoneValue}
          onChangeText={onPhoneChange}
          onBlur={() => persistPhone(phoneValue)}
          placeholder="05xx xxx xx xx"
          placeholderTextColor="#64748b"
          keyboardType="phone-pad"
        />
        <View style={styles.statusRow}>
          {phoneStatus === 'saving' && <ActivityIndicator color="#38BDF8" size="small" />}
          {phoneMessage ? (
            <Text style={[styles.statusText, phoneStatus === 'error' ? styles.statusError : styles.statusOk]}>
              {phoneMessage}
            </Text>
          ) : null}
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Repertuvar listeleri</Text>
          <Text style={styles.statValue}>{playlistCount}</Text>
        </View>

        {onOpenPlaylists ? (
          <TouchableOpacity style={styles.secondaryBtn} onPress={onOpenPlaylists}>
            <Text style={styles.secondaryBtnText}>Listelerimi Aç</Text>
          </TouchableOpacity>
        ) : null}

        {onLogout ? (
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutBtnText}>Güvenli Çıkış Yap</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignSelf: 'stretch',
    width: '100%',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
    maxWidth: 560,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  backBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    alignSelf: 'stretch',
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    padding: 18,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E293B',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  email: {
    color: '#94A3B8',
    fontSize: 12,
  },
  premiumBox: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    gap: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  choiceChip: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#0F172A',
  },
  choiceChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  backupMeta: {
    color: '#64748B',
    fontSize: 11,
    marginBottom: 8,
  },
  lockNote: {
    color: '#64748B',
    fontSize: 11,
    marginBottom: 14,
    lineHeight: 16,
  },
  tierChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#0284C725',
    borderWidth: 1,
    borderColor: '#0284C7',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tierText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
  },
  label: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    alignSelf: 'stretch',
    width: '100%',
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 13,
  },
  inputError: {
    borderColor: '#F87171',
  },
  statusRow: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 11,
    flex: 1,
  },
  statusOk: {
    color: '#34D399',
  },
  statusError: {
    color: '#F87171',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#161F30',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  statValue: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: '#7F1D1D',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#FECACA',
    fontSize: 12,
    fontWeight: '700',
  },
});
