import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Copy, Check, Globe, RefreshCw, X } from 'lucide-react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/** 000000–999999 aralığında, her zaman 6 haneli bağlantı kodu. */
export function generateConnectCode(): string {
  const n = Math.floor(Math.random() * 1_000_000);
  return n.toString().padStart(6, '0');
}

async function copyToClipboard(value: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // panoya yazılamadı
  }
  return false;
}

export default function WebConnectModal({ visible, onClose }: Props) {
  const [code, setCode] = useState(generateConnectCode);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (visible) {
      setCode(generateConnectCode());
      setCopied(false);
    }
  }, [visible]);

  const handleCopy = async () => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } else {
      alert(`Bağlantı kodu: ${code}`);
    }
  };

  const handleRefresh = () => {
    setCode(generateConnectCode());
    setCopied(false);
  };

  const grouped = `${code.slice(0, 3)} ${code.slice(3)}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalCard}>
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Globe color="#38BDF8" size={18} />
                  <Text style={styles.headerTitle}>Web Portala Bağlan</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Kapat">
                  <X color="#94A3B8" size={18} />
                </TouchableOpacity>
              </View>

              <View style={styles.body}>
                <Text style={styles.subtitle}>
                  Bu kodu Morpheus web portalında girerek sahneyi bu oturuma bağlayın. Kod yalnızca bu oturum için geçerlidir.
                </Text>

                <View style={styles.codeBox}>
                  <Text style={styles.codeLabel}>BAĞLANTI KODU</Text>
                  <Text style={styles.codeDigits} selectable>
                    {grouped}
                  </Text>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                    {copied ? <Check color="#FFFFFF" size={14} /> : <Copy color="#FFFFFF" size={14} />}
                    <Text style={styles.copyBtnText}>{copied ? 'Kopyalandı' : 'Kopyala'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
                    <RefreshCw color="#38BDF8" size={14} />
                    <Text style={styles.refreshBtnText}>Yeni Kod</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.footerNote}>
                  Kod 6 hanelidir. Paylaştıktan sonra web tarafta “Cihaz Bağla” alanına yapıştırın.
                </Text>
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
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  codeBox: {
    backgroundColor: '#161F30',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  codeLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  codeDigits: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono, monospace' : 'monospace',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 6,
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  refreshBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footerNote: {
    color: '#64748B',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 15,
  },
});
