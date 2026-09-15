// src/components/EventsModal.tsx
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
  Linking,
} from 'react-native';
import {
  X,
  Calendar,
  MapPin,
  Ticket,
  ExternalLink,
  PlusCircle,
  Clock,
  CheckCircle,
} from 'lucide-react-native';
import { fetchApprovedEvents, createEvent, MorpheusEvent } from '../services/eventService';
import { UserProfile } from '../services/authService';

interface Props {
  visible: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
}

const CITIES = ['Tümü', 'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Eskişehir'];

export default function EventsModal({ visible, onClose, currentUser, onOpenAuth }: Props) {
  const [events, setEvents] = useState<MorpheusEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Tümü');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form State'leri
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('İstanbul');
  const [venue, setVenue] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [ticketPrice, setTicketPrice] = useState('Ücretsiz');
  const [ticketUrl, setTicketUrl] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    if (visible) {
      loadEvents();
      setIsFormOpen(false);
      setFormSuccess(false);
    }
  }, [visible]);

  const loadEvents = async () => {
    setLoading(true);
    const data = await fetchApprovedEvents();
    setEvents(data);
    setLoading(false);
  };

  const handleCreateEvent = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!title.trim() || !venue.trim() || !eventDate.trim()) {
      alert('Lütfen etkinlik adı, mekan ve tarih alanlarını doldurun.');
      return;
    }

    try {
      setFormSubmitting(true);
      await createEvent({
        title: title.trim(),
        description: description.trim(),
        city,
        venue: venue.trim(),
        event_date: new Date(eventDate).toISOString(),
        ticket_price: ticketPrice.trim() || 'Ücretsiz',
        ticket_url: ticketUrl.trim() || undefined,
        created_by: currentUser.id,
      });

      setFormSuccess(true);
      setTitle('');
      setDescription('');
      setVenue('');
      setEventDate('');
      setTicketUrl('');
    } catch (err: any) {
      alert('Etkinlik gönderilemedi: ' + err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredEvents = events.filter((e) => {
    if (selectedCity === 'Tümü') return true;
    return e.city.toLowerCase() === selectedCity.toLowerCase();
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Calendar color="#38BDF8" size={20} />
              <Text style={styles.headerTitle}>Müzik & Sahne Etkinlikleri</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TouchableOpacity
                style={[styles.addEventBtn, isFormOpen && { backgroundColor: '#334155' }]}
                onPress={() => {
                  if (!currentUser) {
                    onOpenAuth();
                  } else {
                    setIsFormOpen(!isFormOpen);
                    setFormSuccess(false);
                  }
                }}
              >
                <PlusCircle color="#FFFFFF" size={14} />
                <Text style={styles.addEventBtnText}>
                  {isFormOpen ? 'Listeye Dön' : 'Etkinlik Ekle'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X color="#94A3B8" size={18} />
              </TouchableOpacity>
            </View>
          </View>

          {/* İÇERİK */}
          {isFormOpen ? (
            <ScrollView style={styles.formContainer} contentContainerStyle={{ padding: 16 }}>
              {formSuccess ? (
                <View style={styles.successBox}>
                  <CheckCircle color="#10B981" size={40} />
                  <Text style={styles.successTitle}>Etkinlik Gönderildi!</Text>
                  <Text style={styles.successText}>
                    Etkinliğiniz incelenmek üzere moderatör onayına iletildi. Onaylandıktan sonra listede yayınlanacaktır.
                  </Text>
                  <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => {
                      setIsFormOpen(false);
                      setFormSuccess(false);
                    }}
                  >
                    <Text style={styles.backBtnText}>Etkinlik Listesine Dön</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.formSectionTitle}>Yeni Sahne / Etkinlik Duyurusu Ekle</Text>
                  <Text style={styles.formDesc}>
                    Eklenen etkinlikler admin incelemesinden sonra portala yansıtılır.
                  </Text>

                  <Text style={styles.inputLabel}>Etkinlik Adı *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Örn: Akustik Sahne Gecesi"
                    placeholderTextColor="#64748B"
                    value={title}
                    onChangeText={setTitle}
                  />

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Şehir</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="İstanbul"
                        placeholderTextColor="#64748B"
                        value={city}
                        onChangeText={setCity}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Mekan / Salon *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Örn: Dorock XL"
                        placeholderTextColor="#64748B"
                        value={venue}
                        onChangeText={setVenue}
                      />
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Tarih & Saat * (YYYY-AA-GG SS:DD)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="2026-10-15 21:00"
                        placeholderTextColor="#64748B"
                        value={eventDate}
                        onChangeText={setEventDate}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Giriş Ücreti</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ücretsiz veya 250 TL"
                        placeholderTextColor="#64748B"
                        value={ticketPrice}
                        onChangeText={setTicketPrice}
                      />
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>Bilet veya Kaynak Bağlantısı (Varsa)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="https://biletix.com/..."
                    placeholderTextColor="#64748B"
                    value={ticketUrl}
                    onChangeText={setTicketUrl}
                    autoCapitalize="none"
                  />

                  <Text style={styles.inputLabel}>Açıklama</Text>
                  <TextInput
                    style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                    placeholder="Etkinlik ve performans hakkında detaylar..."
                    placeholderTextColor="#64748B"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                  />

                  <TouchableOpacity
                    style={[styles.submitBtn, formSubmitting && { opacity: 0.6 }]}
                    disabled={formSubmitting}
                    onPress={handleCreateEvent}
                  >
                    <Text style={styles.submitBtnText}>
                      {formSubmitting ? 'Gönderiliyor...' : 'Onaya Gönder'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          ) : (
            <View style={{ flex: 1 }}>
              {/* ŞEHİR FİLTRESİ */}
              <View style={styles.filterBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {CITIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.cityChip, selectedCity === c && styles.cityChipActive]}
                      onPress={() => setSelectedCity(c)}
                    >
                      <Text style={[styles.cityChipText, selectedCity === c && styles.cityChipTextActive]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* LİSTE */}
              {loading ? (
                <View style={styles.center}><ActivityIndicator color="#38BDF8" size="large" /></View>
              ) : (
                <ScrollView style={{ flex: 1, padding: 14 }}>
                  {filteredEvents.map((item) => {
                    const formattedDate = new Date(item.event_date).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      weekday: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <View key={item.id} style={styles.eventCard}>
                        <View style={styles.eventDateCol}>
                          <Clock color="#38BDF8" size={16} />
                          <Text style={styles.eventDateText}>{formattedDate}</Text>
                        </View>

                        <View style={styles.eventInfoCol}>
                          <Text style={styles.eventTitle}>{item.title}</Text>
                          <View style={styles.eventMetaRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <MapPin color="#94A3B8" size={12} />
                              <Text style={styles.eventMetaText}>{item.venue}, {item.city}</Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Ticket color="#F59E0B" size={12} />
                              <Text style={[styles.eventMetaText, { color: '#F59E0B', fontWeight: 'bold' }]}>
                                {item.ticket_price}
                              </Text>
                            </View>
                          </View>

                          {item.description ? (
                            <Text style={styles.eventDesc} numberOfLines={2}>
                              {item.description}
                            </Text>
                          ) : null}
                        </View>

                        {item.ticket_url && (
                          <TouchableOpacity
                            style={styles.ticketLinkBtn}
                            onPress={() => Linking.openURL(item.ticket_url!)}
                          >
                            <ExternalLink color="#FFFFFF" size={13} />
                            <Text style={styles.ticketLinkText}>Bilet</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}

                  {filteredEvents.length === 0 && (
                    <Text style={styles.emptyText}>Bu filtreye uygun aktif etkinlik bulunamadı.</Text>
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
  modalCard: { width: '100%', maxWidth: 840, height: 560, backgroundColor: '#0F172A', borderRadius: 12, borderWidth: 1, borderColor: '#1E293B', overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#161F30', borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  headerTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: 'bold' },
  closeBtn: { padding: 4 },
  addEventBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#0284C7', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 5 },
  addEventBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },

  filterBar: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#090E1A', borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  cityChip: { backgroundColor: '#161F30', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 5 },
  cityChipActive: { backgroundColor: '#0284C7' },
  cityChipText: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold' },
  cityChipTextActive: { color: '#FFFFFF' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  eventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161F30', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#1E293B', gap: 12 },
  eventDateCol: { width: 110, paddingRight: 8, borderRightWidth: 1, borderRightColor: '#1E293B', alignItems: 'flex-start', gap: 4 },
  eventDateText: { color: '#38BDF8', fontSize: 11, fontWeight: 'bold' },
  eventInfoCol: { flex: 1 },
  eventTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
  eventMetaRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  eventMetaText: { color: '#94A3B8', fontSize: 11 },
  eventDesc: { color: '#64748B', fontSize: 11, lineHeight: 15 },
  ticketLinkBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0284C7', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 5 },
  ticketLinkText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },

  formContainer: { flex: 1, backgroundColor: '#090E1A' },
  formSectionTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  formDesc: { color: '#64748B', fontSize: 11, marginBottom: 14 },
  inputLabel: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold', marginBottom: 4, marginTop: 6 },
  input: { backgroundColor: '#161F30', borderWidth: 1, borderColor: '#334155', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 7, color: '#F8FAFC', fontSize: 12, marginBottom: 6, outlineStyle: 'none' } as any,
  submitBtn: { backgroundColor: '#0284C7', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
  emptyText: { color: '#64748B', fontSize: 12, textAlign: 'center', marginTop: 40 },

  successBox: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  successTitle: { color: '#10B981', fontSize: 16, fontWeight: 'bold' },
  successText: { color: '#94A3B8', fontSize: 12, textAlign: 'center', maxWidth: 360, lineHeight: 18 },
  backBtn: { backgroundColor: '#1E293B', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, marginTop: 8 },
  backBtnText: { color: '#38BDF8', fontWeight: 'bold', fontSize: 12 },
});