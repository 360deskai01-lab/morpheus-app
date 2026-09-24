import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import ModuleFrame, { type ModulePresentation } from './portal/ModuleFrame';
import {
  X,
  MessageSquare,
  PlusCircle,
  Clock,
  Send,
  Trash2,
  Lock,
  ArrowLeft,
  Crown,
} from 'lucide-react-native';
import {
  fetchForumCategories,
  fetchTopics,
  fetchTopicReplies,
  createTopic,
  createReply,
  deleteTopicByAdmin,
  deleteReplyByAdmin,
  ForumCategory,
  ForumTopic,
  ForumReply,
} from '../services/forumService';
import { UserProfile } from '../services/authService';
import { normalizeTier } from '../utils/membership';

interface Props {
  visible: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  presentation?: ModulePresentation;
  onExpand?: () => void;
}

export default function ForumModal({ visible, onClose, currentUser, onOpenAuth, presentation = 'modal', onExpand }: Props) {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [activeTopic, setActiveTopic] = useState<ForumTopic | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State'leri
  const [isNewTopicOpen, setIsNewTopicOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCatId, setNewCatId] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isModerator = currentUser?.is_master_admin || false;
  const isActive = visible || presentation === 'stage';

  useEffect(() => {
    if (isActive) {
      loadInitial();
    }
  }, [isActive]);

  useEffect(() => {
    if (isActive && !activeTopic) {
      loadTopics();
    }
  }, [selectedCat, isActive, activeTopic]);

  const loadInitial = async () => {
    setLoading(true);
    const cats = await fetchForumCategories();
    setCategories(cats);
    if (cats.length > 0) setNewCatId(cats[0].id);
    await loadTopics();
    setLoading(false);
  };

  const loadTopics = async () => {
    setLoading(true);
    const data = await fetchTopics(selectedCat);
    setTopics(data);
    setLoading(false);
  };

  const openTopicDetail = async (topic: ForumTopic) => {
    setActiveTopic(topic);
    setLoading(true);
    const rep = await fetchTopicReplies(topic.id);
    setReplies(rep);
    setLoading(false);
  };

  const handleCreateTopic = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!newTitle.trim() || !newContent.trim()) {
      alert('Başlık ve içerik gereklidir.');
      return;
    }

    try {
      setSubmitting(true);
      await createTopic(newCatId, currentUser.id, newTitle.trim(), newContent.trim());
      setNewTitle('');
      setNewContent('');
      setIsNewTopicOpen(false);
      loadTopics();
    } catch (err: any) {
      alert('Konu açılamadı: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!replyContent.trim() || !activeTopic) return;

    try {
      setSubmitting(true);
      await createReply(activeTopic.id, currentUser.id, replyContent.trim());
      setReplyContent('');
      const rep = await fetchTopicReplies(activeTopic.id);
      setReplies(rep);
    } catch (err: any) {
      alert('Cevap gönderilemedi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Bu konuyu silmek istediğinize emin misiniz?')) return;
    try {
      await deleteTopicByAdmin(topicId);
      setActiveTopic(null);
      loadTopics();
    } catch (err: any) {
      alert('Silinemedi: ' + err.message);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('Bu yanıtı silmek istediğinize emin misiniz?')) return;
    try {
      await deleteReplyByAdmin(replyId);
      if (activeTopic) {
        const rep = await fetchTopicReplies(activeTopic.id);
        setReplies(rep);
      }
    } catch (err: any) {
      alert('Silinemedi: ' + err.message);
    }
  };

  return (
    <ModuleFrame visible={visible} presentation={presentation} onClose={onClose} onExpand={onExpand} cardStyle={styles.modalCard}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {activeTopic ? (
                <TouchableOpacity onPress={() => setActiveTopic(null)} style={styles.backBtn}>
                  <ArrowLeft color="#38BDF8" size={18} />
                </TouchableOpacity>
              ) : (
                <MessageSquare color="#38BDF8" size={20} />
              )}
              <Text style={styles.headerTitle} numberOfLines={1}>
                {activeTopic ? activeTopic.title : 'Müzisyenler Forumu'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              {!activeTopic && !isNewTopicOpen && (
                <TouchableOpacity
                  style={styles.newTopicBtn}
                  onPress={() => {
                    if (!currentUser) onOpenAuth();
                    else setIsNewTopicOpen(true);
                  }}
                >
                  <PlusCircle color="#FFFFFF" size={14} />
                  <Text style={styles.newTopicBtnText}>Yeni Konu</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                {presentation === 'stage' ? (
                  <Text style={styles.stageBackText}>Sahneye Dön</Text>
                ) : (
                  <X color="#94A3B8" size={18} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* YENİ KONU FORMU */}
          {isNewTopicOpen ? (
            <ScrollView style={styles.body} contentContainerStyle={{ padding: 16 }}>
              <Text style={styles.formTitle}>Yeni Tartışma Konusu Başlat</Text>

              <Text style={styles.label}>Kategori</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {categories.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.catChip, newCatId === c.id && styles.catChipActive]}
                      onPress={() => setNewCatId(c.id)}
                    >
                      <Text style={[styles.catChipText, newCatId === c.id && styles.catChipTextActive]}>
                        {c.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.label}>Konu Başlığı</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Akustik gitarda 7'li akor yürüyüşleri"
                placeholderTextColor="#64748B"
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={styles.label}>İçerik</Text>
              <TextInput
                style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
                placeholder="Fikirlerinizi, sorularınızı veya paylaşmak istediğiniz akor dizilimlerini yazın..."
                placeholderTextColor="#64748B"
                value={newContent}
                onChangeText={setNewContent}
                multiline
              />

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <TouchableOpacity
                  style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                  disabled={submitting}
                  onPress={handleCreateTopic}
                >
                  <Text style={styles.submitBtnText}>{submitting ? 'Açılıyor...' : 'Konuyu Yayınla'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsNewTopicOpen(false)}>
                  <Text style={styles.cancelBtnText}>İptal</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : activeTopic ? (
            /* KONU DETAY VE CEVAPLAR */
            <View style={styles.body}>
              <ScrollView style={{ flex: 1, padding: 16 }}>
                {/* Ana Konu Gönderisi */}
                <View style={styles.topicMainCard}>
                  <View style={styles.topicUserHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.authorName}>
                        {activeTopic.author?.full_name || 'Müzisyen'}
                      </Text>
                      {activeTopic.author?.is_master_admin && (
                        <View style={styles.masterPill}><Text style={styles.pillText}>ADMIN</Text></View>
                      )}
                      {normalizeTier(activeTopic.author?.membership_tier) === 'premium' && (
                        <View style={styles.proPill}><Text style={styles.pillText}>PRO</Text></View>
                      )}
                    </View>

                    {isModerator && (
                      <TouchableOpacity onPress={() => handleDeleteTopic(activeTopic.id)}>
                        <Trash2 color="#EF4444" size={16} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text style={styles.topicMainContent}>{activeTopic.content}</Text>
                  <Text style={styles.dateStamp}>
                    {new Date(activeTopic.created_at).toLocaleDateString('tr-TR')}
                  </Text>
                </View>

                <Text style={styles.repliesTitle}>Cevaplar ({replies.length})</Text>

                {replies.map((rep) => (
                  <View key={rep.id} style={styles.replyCard}>
                    <View style={styles.topicUserHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.authorName}>{rep.author?.full_name || 'Üye'}</Text>
                        {rep.author?.is_master_admin && (
                          <View style={styles.masterPill}><Text style={styles.pillText}>ADMIN</Text></View>
                        )}
                        {normalizeTier(rep.author?.membership_tier) === 'premium' && (
                          <View style={styles.proPill}><Text style={styles.pillText}>PRO</Text></View>
                        )}
                      </View>

                      {isModerator && (
                        <TouchableOpacity onPress={() => handleDeleteReply(rep.id)}>
                          <Trash2 color="#EF4444" size={14} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.replyContent}>{rep.content}</Text>
                    <Text style={styles.dateStamp}>
                      {new Date(rep.created_at).toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
                ))}
              </ScrollView>

              {/* Alt Yanıt Yazma Alanı */}
              <View style={styles.replyInputBox}>
                {currentUser ? (
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <TextInput
                      style={styles.inlineInput}
                      placeholder="Cevabınızı yazın..."
                      placeholderTextColor="#64748B"
                      value={replyContent}
                      onChangeText={setReplyContent}
                    />
                    <TouchableOpacity
                      style={[styles.sendBtn, submitting && { opacity: 0.5 }]}
                      disabled={submitting}
                      onPress={handleSendReply}
                    >
                      <Send color="#FFFFFF" size={16} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.loginToReply} onPress={onOpenAuth}>
                    <Lock color="#38BDF8" size={14} />
                    <Text style={styles.loginToReplyText}>Tartışmaya katılmak için giriş yapın</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            /* KONU LİSTESİ */
            <View style={styles.body}>
              {/* Kategori Barı */}
              <View style={styles.catBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  <TouchableOpacity
                    style={[styles.catChip, selectedCat === 'ALL' && styles.catChipActive]}
                    onPress={() => setSelectedCat('ALL')}
                  >
                    <Text style={[styles.catChipText, selectedCat === 'ALL' && styles.catChipTextActive]}>
                      Tüm Konular
                    </Text>
                  </TouchableOpacity>

                  {categories.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.catChip, selectedCat === c.id && styles.catChipActive]}
                      onPress={() => setSelectedCat(c.id)}
                    >
                      <Text style={[styles.catChipText, selectedCat === c.id && styles.catChipTextActive]}>
                        {c.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {loading ? (
                <View style={styles.center}><ActivityIndicator color="#38BDF8" size="large" /></View>
              ) : (
                <ScrollView style={{ flex: 1, padding: 14 }}>
                  {topics.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      style={styles.topicCard}
                      onPress={() => openTopicDetail(t)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.topicTitle}>{t.title}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <Text style={styles.topicAuthorText}>
                            {t.author?.full_name || 'Müzisyen'}
                          </Text>
                          <Text style={styles.topicDateText}>
                            {new Date(t.created_at).toLocaleDateString('tr-TR')}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}

                  {topics.length === 0 && (
                    <Text style={styles.emptyText}>Bu kategoride henüz konu açılmadı. İlk sen başlat!</Text>
                  )}
                </ScrollView>
              )}
            </View>
          )}
    </ModuleFrame>
  );
}

const styles = StyleSheet.create({
  modalCard: { height: 580 },
  stageBackText: { color: '#38BDF8', fontSize: 11, fontWeight: '800' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#161F30', borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  headerTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: 'bold', maxWidth: 450 },
  closeBtn: { padding: 4 },
  backBtn: { padding: 4, marginRight: 4 },
  newTopicBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#0284C7', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 5 },
  newTopicBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },

  body: { flex: 1, backgroundColor: '#090E1A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  catBar: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#0B1120', borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  catChip: { backgroundColor: '#161F30', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 5 },
  catChipActive: { backgroundColor: '#0284C7' },
  catChipText: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold' },
  catChipTextActive: { color: '#FFFFFF' },

  topicCard: { backgroundColor: '#161F30', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#1E293B' },
  topicTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: 'bold' },
  topicAuthorText: { color: '#38BDF8', fontSize: 11 },
  topicDateText: { color: '#64748B', fontSize: 11 },

  formTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  label: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold', marginBottom: 4, marginTop: 6 },
  input: { backgroundColor: '#161F30', borderWidth: 1, borderColor: '#334155', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, color: '#F8FAFC', fontSize: 12, marginBottom: 8, outlineStyle: 'none' } as any,
  submitBtn: { backgroundColor: '#0284C7', paddingVertical: 9, paddingHorizontal: 16, borderRadius: 6 },
  submitBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
  cancelBtn: { backgroundColor: '#1E293B', paddingVertical: 9, paddingHorizontal: 16, borderRadius: 6 },
  cancelBtnText: { color: '#94A3B8', fontWeight: 'bold', fontSize: 12 },

  topicMainCard: { backgroundColor: '#161F30', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#1E293B', marginBottom: 16 },
  topicUserHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  authorName: { color: '#F8FAFC', fontSize: 12, fontWeight: 'bold' },
  masterPill: { backgroundColor: '#312E81', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 },
  proPill: { backgroundColor: '#065F46', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 },
  pillText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  topicMainContent: { color: '#CBD5E1', fontSize: 13, lineHeight: 20 },
  dateStamp: { color: '#64748B', fontSize: 10, marginTop: 8 },

  repliesTitle: { color: '#94A3B8', fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
  replyCard: { backgroundColor: '#0F172A', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#1E293B', marginBottom: 8 },
  replyContent: { color: '#E2E8F0', fontSize: 12, lineHeight: 18 },

  replyInputBox: { padding: 12, backgroundColor: '#161F30', borderTopWidth: 1, borderTopColor: '#1E293B' },
  inlineInput: { flex: 1, backgroundColor: '#090E1A', borderWidth: 1, borderColor: '#334155', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, color: '#F8FAFC', fontSize: 12, outlineStyle: 'none' } as any,
  sendBtn: { backgroundColor: '#0284C7', padding: 10, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  loginToReply: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 8 },
  loginToReplyText: { color: '#38BDF8', fontSize: 12, fontWeight: 'bold' },
  emptyText: { color: '#64748B', fontSize: 12, textAlign: 'center', marginTop: 40 },
});