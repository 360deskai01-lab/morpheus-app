import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  GraduationCap,
  PlusCircle,
  PlayCircle,
  CheckCircle,
  Tag,
  BookOpen,
  ArrowLeft,
  Crown,
} from 'lucide-react-native';
import {
  fetchApprovedCourses,
  fetchCourseLessons,
  createCourseSubmission,
  MorpheusCourse,
  CourseLesson,
  CourseLevel,
} from '../services/courseService';
import { UserProfile } from '../services/authService';

interface Props {
  visible: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
}

const INSTRUMENTS = ['Tümü', 'Gitar', 'Bas', 'Piyano', 'Vokal', 'Teori'];

export default function CoursesModal({ visible, onClose, currentUser, onOpenAuth }: Props) {
  const [courses, setCourses] = useState<MorpheusCourse[]>([]);
  const [selectedInstrument, setSelectedInstrument] = useState('Tümü');
  const [activeCourse, setActiveCourse] = useState<MorpheusCourse | null>(null);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State'leri
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instrument, setInstrument] = useState('Gitar');
  const [level, setLevel] = useState<CourseLevel>('BEGINNER');
  const [priceAmount, setPriceAmount] = useState('0');
  const [previewVideoUrl, setPreviewVideoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCourses();
      setIsSubmitOpen(false);
      setSubmitSuccess(false);
      setActiveCourse(null);
    }
  }, [visible, selectedInstrument]);

  const loadCourses = async () => {
    setLoading(true);
    const data = await fetchApprovedCourses(selectedInstrument);
    setCourses(data);
    setLoading(false);
  };

  const openCourseDetail = async (course: MorpheusCourse) => {
    setActiveCourse(course);
    setLoading(true);
    const lessonData = await fetchCourseLessons(course.id);
    setLessons(lessonData);
    setLoading(false);
  };

  const handleCreateCourse = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!title.trim() || !description.trim()) {
      alert('Kurs başlığı ve açıklaması zorunludur.');
      return;
    }

    const price = parseFloat(priceAmount) || 0;

    try {
      setSubmitting(true);
      await createCourseSubmission({
        instructor_id: currentUser.id,
        title: title.trim(),
        description: description.trim(),
        instrument,
        level,
        price_amount: price,
        is_free: price === 0,
        preview_video_url: previewVideoUrl.trim() || undefined,
      });

      setSubmitSuccess(true);
      setTitle('');
      setDescription('');
      setPriceAmount('0');
      setPreviewVideoUrl('');
    } catch (err: any) {
      alert('Kurs gönderilemedi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {activeCourse ? (
                <TouchableOpacity onPress={() => setActiveCourse(null)} style={styles.backBtn}>
                  <ArrowLeft color="#38BDF8" size={18} />
                </TouchableOpacity>
              ) : (
                <GraduationCap color="#38BDF8" size={20} />
              )}
              <Text style={styles.headerTitle} numberOfLines={1}>
                {activeCourse ? activeCourse.title : 'Morpheus Müzik Akademisi'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              {!activeCourse && !isSubmitOpen && (
                <TouchableOpacity
                  style={styles.addCourseBtn}
                  onPress={() => {
                    if (!currentUser) onOpenAuth();
                    else setIsSubmitOpen(true);
                  }}
                >
                  <PlusCircle color="#FFFFFF" size={14} />
                  <Text style={styles.addCourseBtnText}>Eğitmen Ol / Kurs Ekle</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X color="#94A3B8" size={18} />
              </TouchableOpacity>
            </View>
          </View>

          {/* İÇERİK BÖLÜMÜ */}
          {isSubmitOpen ? (
            <ScrollView style={styles.body} contentContainerStyle={{ padding: 16 }}>
              {submitSuccess ? (
                <View style={styles.successBox}>
                  <CheckCircle color="#10B981" size={44} />
                  <Text style={styles.successTitle}>Kurs Başvurusu Alındı!</Text>
                  <Text style={styles.successDesc}>
                    Kursunuz ve müfredatınız akademisyenlerimiz tarafından incelendikten sonra onaylanıp platformda yayınlanacaktır.
                  </Text>
                  <TouchableOpacity
                    style={styles.backToListBtn}
                    onPress={() => {
                      setIsSubmitOpen(false);
                      setSubmitSuccess(false);
                    }}
                  >
                    <Text style={styles.backToListText}>Kurs Listesine Dön</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.formTitle}>Yeni Kurs Yayını Başlat</Text>
                  <Text style={styles.formSub}>Kendi müfredatınızı oluşturun ve müzisyen topluluğuyla paylaşın.</Text>

                  <Text style={styles.label}>Kurs Başlığı *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Örn: Elektro Gitarda Solo Teknikleri ve Pentatonik Skalalar"
                    placeholderTextColor="#64748B"
                    value={title}
                    onChangeText={setTitle}
                  />

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Enstrüman</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Gitar, Bas, Piyano vb."
                        placeholderTextColor="#64748B"
                        value={instrument}
                        onChangeText={setInstrument}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Seviye</Text>
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as CourseLevel[]).map((lvl) => (
                          <TouchableOpacity
                            key={lvl}
                            style={[styles.levelBtn, level === lvl && styles.levelBtnActive]}
                            onPress={() => setLevel(lvl)}
                          >
                            <Text style={[styles.levelBtnText, level === lvl && styles.levelBtnTextActive]}>
                              {lvl === 'BEGINNER' ? 'Giriş' : lvl === 'INTERMEDIATE' ? 'Orta' : 'İleri'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Fiyat (TL) - 0 ise Ücretsiz</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0"
                        placeholderTextColor="#64748B"
                        value={priceAmount}
                        onChangeText={setPriceAmount}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Tanıtım Video URL (Youtube vb.)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="https://..."
                        placeholderTextColor="#64748B"
                        value={previewVideoUrl}
                        onChangeText={setPreviewVideoUrl}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <Text style={styles.label}>Kurs Açıklaması & Müfredat Detayı *</Text>
                  <TextInput
                    style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                    placeholder="Bu kursta öğrenciler neleri öğrenecek? Gereksinimler nelerdir?"
                    placeholderTextColor="#64748B"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                  />

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    <TouchableOpacity
                      style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                      disabled={submitting}
                      onPress={handleCreateCourse}
                    >
                      <Text style={styles.submitBtnText}>{submitting ? 'Kaydediliyor...' : 'Onaya Gönder'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsSubmitOpen(false)}>
                      <Text style={styles.cancelBtnText}>İptal</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          ) : activeCourse ? (
            /* KURS DETAY VE DERSLER */
            <View style={styles.body}>
              <ScrollView style={{ flex: 1, padding: 16 }}>
                <View style={styles.detailCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailTitle}>{activeCourse.title}</Text>
                      <Text style={styles.instructorText}>
                        Eğitmen: {activeCourse.instructor?.full_name || 'Morpheus Akademi'}
                      </Text>
                    </View>

                    <View style={styles.priceTag}>
                      <Text style={styles.priceText}>
                        {activeCourse.is_free ? 'Ücretsiz' : `${activeCourse.price_amount} TL`}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.detailDesc}>{activeCourse.description}</Text>
                </View>

                <Text style={styles.sectionHeader}>Ders Müfredatı ({lessons.length} Ders)</Text>

                {lessons.map((les) => (
                  <View key={les.id} style={styles.lessonRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <PlayCircle color={les.is_preview ? '#10B981' : '#64748B'} size={18} />
                      <Text style={styles.lessonTitle}>{les.lesson_order}. {les.title}</Text>
                    </View>
                    <Text style={styles.lessonDur}>{les.duration_min} dk</Text>
                  </View>
                ))}

                {lessons.length === 0 && (
                  <Text style={styles.emptyNote}>Bu kurs için henüz ders videosu yüklenmemiş.</Text>
                )}
              </ScrollView>
            </View>
          ) : (
            /* KURS LİSTESİ */
            <View style={styles.body}>
              <View style={styles.instFilterBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {INSTRUMENTS.map((inst) => (
                    <TouchableOpacity
                      key={inst}
                      style={[styles.instChip, selectedInstrument === inst && styles.instChipActive]}
                      onPress={() => setSelectedInstrument(inst)}
                    >
                      <Text style={[styles.instChipText, selectedInstrument === inst && styles.instChipTextActive]}>
                        {inst}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {loading ? (
                <View style={styles.center}><ActivityIndicator color="#38BDF8" size="large" /></View>
              ) : (
                <ScrollView style={{ flex: 1, padding: 14 }}>
                  {courses.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={styles.courseCard}
                      onPress={() => openCourseDetail(c)}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <View style={styles.instBadge}><Text style={styles.instBadgeText}>{c.instrument}</Text></View>
                          <Text style={styles.levelText}>
                            {c.level === 'BEGINNER' ? 'Başlangıç' : c.level === 'INTERMEDIATE' ? 'Orta' : 'İleri'}
                          </Text>
                        </View>
                        <Text style={styles.courseTitle}>{c.title}</Text>
                        <Text style={styles.courseDesc} numberOfLines={2}>{c.description}</Text>
                      </View>

                      <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', paddingLeft: 8 }}>
                        <View style={styles.priceTag}>
                          <Text style={styles.priceText}>
                            {c.is_free ? 'Ücretsiz' : `${c.price_amount} TL`}
                          </Text>
                        </View>
                        <View style={styles.viewBadge}>
                          <BookOpen color="#38BDF8" size={13} />
                          <Text style={styles.viewBadgeText}>İncele</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}

                  {courses.length === 0 && (
                    <Text style={styles.emptyNote}>Bu enstrümanda henüz yayınlanmış kurs bulunamadı.</Text>
                  )}
                </ScrollView>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 840, height: 580, backgroundColor: '#0F172A', borderRadius: 12, borderWidth: 1, borderColor: '#1E293B', overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#161F30', borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  headerTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: 'bold', maxWidth: 450 },
  closeBtn: { padding: 4 },
  backBtn: { padding: 4, marginRight: 4 },
  addCourseBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#0284C7', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 5 },
  addCourseBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },

  body: { flex: 1, backgroundColor: '#090E1A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  instFilterBar: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#0B1120', borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  instChip: { backgroundColor: '#161F30', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 5 },
  instChipActive: { backgroundColor: '#0284C7' },
  instChipText: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold' },
  instChipTextActive: { color: '#FFFFFF' },

  courseCard: { flexDirection: 'row', backgroundColor: '#161F30', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#1E293B' },
  instBadge: { backgroundColor: '#1E293B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  instBadgeText: { color: '#38BDF8', fontSize: 10, fontWeight: 'bold' },
  levelText: { color: '#64748B', fontSize: 10, fontWeight: 'bold' },
  courseTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
  courseDesc: { color: '#94A3B8', fontSize: 11, lineHeight: 16 },
  priceTag: { backgroundColor: '#064E3B', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  priceText: { color: '#34D399', fontSize: 11, fontWeight: 'bold' },
  viewBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 },
  viewBadgeText: { color: '#38BDF8', fontSize: 11, fontWeight: 'bold' },

  detailCard: { backgroundColor: '#161F30', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#1E293B', marginBottom: 16 },
  detailTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  instructorText: { color: '#38BDF8', fontSize: 11, fontWeight: 'bold' },
  detailDesc: { color: '#CBD5E1', fontSize: 12, lineHeight: 18, marginTop: 8 },
  sectionHeader: { color: '#94A3B8', fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
  lessonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#161F30', padding: 10, borderRadius: 6, marginBottom: 6 },
  lessonTitle: { color: '#F8FAFC', fontSize: 12, fontWeight: '600' },
  lessonDur: { color: '#64748B', fontSize: 11 },

  formTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  formSub: { color: '#64748B', fontSize: 11, marginBottom: 12 },
  label: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold', marginBottom: 4, marginTop: 6 },
  input: { backgroundColor: '#161F30', borderWidth: 1, borderColor: '#334155', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, color: '#F8FAFC', fontSize: 12, marginBottom: 8, outlineStyle: 'none' } as any,
  levelBtn: { flex: 1, backgroundColor: '#161F30', paddingVertical: 8, alignItems: 'center', borderRadius: 5 },
  levelBtnActive: { backgroundColor: '#0284C7' },
  levelBtnText: { color: '#94A3B8', fontSize: 10, fontWeight: 'bold' },
  levelBtnTextActive: { color: '#FFFFFF' },
  submitBtn: { backgroundColor: '#0284C7', paddingVertical: 9, paddingHorizontal: 16, borderRadius: 6 },
  submitBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
  cancelBtn: { backgroundColor: '#1E293B', paddingVertical: 9, paddingHorizontal: 16, borderRadius: 6 },
  cancelBtnText: { color: '#94A3B8', fontWeight: 'bold', fontSize: 12 },
  emptyNote: { color: '#64748B', fontSize: 12, textAlign: 'center', marginTop: 30 },

  successBox: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  successTitle: { color: '#10B981', fontSize: 16, fontWeight: 'bold' },
  successDesc: { color: '#94A3B8', fontSize: 12, textAlign: 'center', maxWidth: 360, lineHeight: 18 },
  backToListBtn: { backgroundColor: '#1E293B', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, marginTop: 10 },
  backToListText: { color: '#38BDF8', fontWeight: 'bold', fontSize: 12 },
});