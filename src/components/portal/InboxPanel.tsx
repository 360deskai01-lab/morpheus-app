import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchInboxItems, sendSupportMessage, type InboxItem } from '../../services/inboxService';

interface Props {
  userId: string;
  onBack: () => void;
}

export default function InboxPanel({ userId, onBack }: Props) {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setItems(await fetchInboxItems(userId));
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [userId]);

  const send = async () => {
    setSending(true);
    setStatus('');
    try {
      await sendSupportMessage(userId, draft);
      setDraft('');
      setStatus('Not kaydedildi.');
      await load();
    } catch (err: any) {
      setStatus(err.message || 'Mesaj gönderilemedi. Destek kutusu henüz açılmamış olabilir.');
    }
    setSending(false);
  };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Mesaj Kutusu</Text>
        <TouchableOpacity style={styles.back} onPress={onBack}>
          <Text style={styles.backText}>Sahneye Dön</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>Sahne notlarınız ve düzeltme bildirimleri burada toplanır.</Text>
      <TextInput
        style={styles.input}
        value={draft}
        onChangeText={setDraft}
        placeholder="Destek veya sahne notu yazın..."
        placeholderTextColor="#64748b"
        multiline
      />
      <TouchableOpacity style={styles.send} onPress={send} disabled={sending}>
        <Text style={styles.sendText}>{sending ? 'Gönderiliyor...' : 'Notu Kaydet'}</Text>
      </TouchableOpacity>
      {status ? <Text style={styles.status}>{status}</Text> : null}
      {loading ? (
        <ActivityIndicator color="#38BDF8" style={{ marginTop: 20 }} />
      ) : items.length === 0 ? (
        <Text style={styles.empty}>Henüz mesaj yok.</Text>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardBody}>{item.body}</Text>
            {item.created_at ? <Text style={styles.cardMeta}>{item.created_at}</Text> : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' },
  back: { backgroundColor: '#1E293B', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  backText: { color: '#38BDF8', fontSize: 12, fontWeight: '700' },
  hint: { color: '#64748B', fontSize: 12, marginBottom: 12 },
  input: {
    minHeight: 80,
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    color: '#F8FAFC',
    padding: 10,
    textAlignVertical: 'top',
  },
  send: { marginTop: 8, backgroundColor: '#0284C7', borderRadius: 6, paddingVertical: 10, alignItems: 'center' },
  sendText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  status: { color: '#34D399', fontSize: 11, marginTop: 8 },
  empty: { color: '#64748B', marginTop: 20 },
  card: { backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B', borderRadius: 8, padding: 12, marginTop: 10 },
  cardTitle: { color: '#F8FAFC', fontWeight: '700', fontSize: 13 },
  cardBody: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  cardMeta: { color: '#64748B', fontSize: 10, marginTop: 6 },
});
