import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MorpheusWebPortal from './src/components/MorpheusWebPortal';
import { fetchSharedSongByCode } from './src/services/shareService';

export default function App() {
  const [sharedSongModalVisible, setSharedSongModalVisible] = useState(false);
  const [shareCodeInput, setShareCodeInput] = useState('');
  const [loadingShare, setLoadingShare] = useState(false);
  const [sharedSongData, setSharedSongData] = useState<any | null>(null);

  const handleFetchSharedSong = async () => {
    if (!shareCodeInput.trim()) return;
    setLoadingShare(true);
    try {
      const song = await fetchSharedSongByCode(shareCodeInput.trim());
      if (song) {
        setSharedSongData(song);
      } else {
        alert('Bu paylaşım koduna ait parça bulunamadı.');
      }
    } catch (err: any) {
      alert('Paylaşım kodu sorgulanırken hata oluştu: ' + err.message);
    } finally {
      setLoadingShare(false);
    }
  };

  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />
      
      {/* Ana Web Portalı */}
      <MorpheusWebPortal />

      {/* Paylaşım Kodu ile Parça İnceleme Modalı */}
      <Modal
        visible={sharedSongModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSharedSongModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>🔗 Paylaşım Kodu ile Parça Aç</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: MORPH-A1B2C3D4"
              placeholderTextColor="#64748b"
              value={shareCodeInput}
              onChangeText={setShareCodeInput}
              autoCapitalize="characters"
            />
            
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setSharedSongModalVisible(false);
                  setSharedSongData(null);
                }}
              >
                <Text style={styles.cancelBtnText}>Kapat</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleFetchSharedSong}
                disabled={loadingShare}
              >
                {loadingShare ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Parçayı Getir</Text>
                )}
              </TouchableOpacity>
            </View>

            {sharedSongData && (
              <View style={styles.resultBox}>
                <Text style={styles.resultTitle}>{sharedSongData.title} - {sharedSongData.artist}</Text>
                <Text style={styles.resultKey}>Orijinal Ton: {sharedSongData.original_key || 'Am'}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 14,
    marginBottom: 15,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#1e293b',
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  submitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#0284c7',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  resultBox: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#1e293b',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  resultTitle: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '700',
  },
  resultKey: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
});