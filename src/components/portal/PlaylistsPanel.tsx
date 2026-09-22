import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Props {
  playlists: any[];
  newTitle: string;
  creating: boolean;
  onChangeTitle: (v: string) => void;
  onCreate: () => void;
  onLoad: (pl: any) => void;
  onDelete: (pl: any) => void;
  onBack: () => void;
}

export default function PlaylistsPanel({
  playlists,
  newTitle,
  creating,
  onChangeTitle,
  onCreate,
  onLoad,
  onDelete,
  onBack,
}: Props) {
  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Repertuvar Listelerim</Text>
        <TouchableOpacity style={styles.back} onPress={onBack}>
          <Text style={styles.backText}>Sahneye Dön</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.newRow}>
        <TextInput
          style={styles.input}
          placeholder="Yeni liste adı (Örn: Akustik Bar Seti)"
          placeholderTextColor="#64748b"
          value={newTitle}
          onChangeText={onChangeTitle}
        />
        <TouchableOpacity style={styles.create} onPress={onCreate} disabled={creating}>
          <Text style={styles.createText}>{creating ? '...' : '+ Oluştur'}</Text>
        </TouchableOpacity>
      </View>

      {playlists.length === 0 ? (
        <Text style={styles.empty}>Henüz repertuvar listeniz yok. Yukarıdan oluşturun.</Text>
      ) : (
        playlists.map((pl) => (
          <View key={pl.id} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{pl.title}</Text>
              <Text style={styles.cardSub}>{pl.song_count || 0} Parça</Text>
            </View>
            <TouchableOpacity style={styles.open} onPress={() => onLoad(pl)}>
              <Text style={styles.openText}>Sahneye Yükle</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.del} onPress={() => onDelete(pl)}>
              <Text style={styles.delText}>Sil</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 8, flexWrap: 'wrap' },
  title: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' },
  back: { backgroundColor: '#1E293B', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  backText: { color: '#38BDF8', fontSize: 12, fontWeight: '700' },
  newRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  input: { flex: 1, backgroundColor: '#090D16', color: '#F8FAFC', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#334155', fontSize: 12 },
  create: { backgroundColor: '#0284C7', paddingHorizontal: 14, borderRadius: 6, justifyContent: 'center' },
  createText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  empty: { color: '#64748B', fontSize: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0F172A', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#1E293B' },
  cardTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: '700' },
  cardSub: { color: '#64748B', fontSize: 11, marginTop: 2 },
  open: { backgroundColor: '#1E293B', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 },
  openText: { color: '#38BDF8', fontSize: 11, fontWeight: '700' },
  del: { backgroundColor: '#7F1D1D20', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: '#7F1D1D' },
  delText: { color: '#F87171', fontSize: 11, fontWeight: '700' },
});
