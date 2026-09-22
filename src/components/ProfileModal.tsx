import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { UserRound, X } from 'lucide-react-native';

interface Props {
  visible: boolean;
  email?: string | null;
  fullName?: string | null;
  membershipTier?: string | null;
  isAdmin?: boolean;
  playlistCount?: number;
  onClose: () => void;
  onLogout?: () => void;
  onOpenPlaylists?: () => void;
}

export default function ProfileModal({
  visible,
  email,
  fullName,
  membershipTier,
  isAdmin,
  playlistCount = 0,
  onClose,
  onLogout,
  onOpenPlaylists,
}: Props) {
  const tier = isAdmin ? 'ADMIN' : (membershipTier || 'BASIC').toUpperCase();
  const displayName = fullName || email?.split('@')[0] || 'Üye';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalCard}>
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <UserRound color="#38BDF8" size={18} />
                  <Text style={styles.headerTitle}>Profil Detayları</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Kapat">
                  <X color="#94A3B8" size={18} />
                </TouchableOpacity>
              </View>

              <View style={styles.body}>
                <View style={styles.identity}>
                  <Text style={styles.name}>{displayName}</Text>
                  <Text style={styles.email}>{email}</Text>
                  <View style={styles.tierChip}>
                    <Text style={styles.tierText}>{tier}</Text>
                  </View>
                </View>

                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Repertuvar listeleri</Text>
                  <Text style={styles.statValue}>{playlistCount}</Text>
                </View>

                {onOpenPlaylists ? (
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => {
                      onClose();
                      onOpenPlaylists();
                    }}
                  >
                    <Text style={styles.secondaryBtnText}>Listelerimi Aç</Text>
                  </TouchableOpacity>
                ) : null}

                {onLogout ? (
                  <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
                    <Text style={styles.logoutBtnText}>Güvenli Çıkış Yap</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#161F30',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 20,
    backgroundColor: '#090E1A',
  },
  identity: {
    marginBottom: 16,
  },
  name: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  email: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  tierChip: {
    alignSelf: 'flex-start',
    marginTop: 10,
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
