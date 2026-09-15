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
  ShoppingBag,
  PlusCircle,
  Tag,
  MapPin,
  Phone,
  CheckCircle,
  Search,
} from 'lucide-react-native';
import {
  fetchApprovedProducts,
  createProductListing,
  StoreProduct,
  ProductCondition,
} from '../services/storeService';
import { UserProfile } from '../services/authService';

interface Props {
  visible: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
}

const CATEGORIES = ['Tümü', 'Gitar', 'Amfi', 'Pedal', 'Klavye', 'Davul', 'Aksesuar'];

export default function StoreModal({ visible, onClose, currentUser, onOpenAuth }: Props) {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Form State'leri
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Gitar');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState<ProductCondition>('USED');
  const [city, setCity] = useState('İstanbul');
  const [contactInfo, setContactInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (visible) {
      loadProducts();
      setIsSubmitOpen(false);
      setSubmitSuccess(false);
    }
  }, [visible, selectedCategory]);

  const loadProducts = async () => {
    setLoading(true);
    const data = await fetchApprovedProducts(selectedCategory);
    setProducts(data);
    setLoading(false);
  };

  const handleCreateListing = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!title.trim() || !price.trim() || !contactInfo.trim()) {
      alert('İlan başlığı, fiyat ve iletişim bilgisi zorunludur.');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      alert('Geçerli bir fiyat giriniz.');
      return;
    }

    try {
      setSubmitting(true);
      await createProductListing({
        seller_id: currentUser.id,
        title: title.trim(),
        description: description.trim(),
        category,
        price: priceNum,
        condition,
        city: city.trim(),
        contact_info: contactInfo.trim(),
      });

      setSubmitSuccess(true);
      setTitle('');
      setDescription('');
      setPrice('');
      setContactInfo('');
    } catch (err: any) {
      alert('İlan eklenemedi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.title.toLocaleLowerCase('tr').includes(searchQuery.toLocaleLowerCase('tr')) ||
    (p.description && p.description.toLocaleLowerCase('tr').includes(searchQuery.toLocaleLowerCase('tr'))) ||
    p.city.toLocaleLowerCase('tr').includes(searchQuery.toLocaleLowerCase('tr'))
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ShoppingBag color="#38BDF8" size={20} />
              <Text style={styles.headerTitle}>Morpheus Müzisyen Pazarı</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              {!isSubmitOpen && (
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => {
                    if (!currentUser) onOpenAuth();
                    else setIsSubmitOpen(true);
                  }}
                >
                  <PlusCircle color="#FFFFFF" size={14} />
                  <Text style={styles.addBtnText}>İlan Ver</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X color="#94A3B8" size={18} />
              </TouchableOpacity>
            </View>
          </View>

          {/* GÖVDE */}
          {isSubmitOpen ? (
            <ScrollView style={styles.body} contentContainerStyle={{ padding: 16 }}>
              {submitSuccess ? (
                <View style={styles.successBox}>
                  <CheckCircle color="#10B981" size={44} />
                  <Text style={styles.successTitle}>İlanınız Onaya Gönderildi!</Text>
                  <Text style={styles.successDesc}>
                    Ekipman ilanınız moderatör kontrolünden geçtikten sonra yayına alınacaktır.
                  </Text>
                  <TouchableOpacity
                    style={styles.backToListBtn}
                    onPress={() => {
                      setIsSubmitOpen(false);
                      setSubmitSuccess(false);
                    }}
                  >
                    <Text style={styles.backToListText}>Pazaryerine Dön</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.formTitle}>Yeni Ekipman İlanı Ekle</Text>
                  <Text style={styles.formSub}>İkinci el veya sıfır müzik ekipmanınızı diğer müzisyenlerle buluşturun.</Text>

                  <Text style={styles.label}>İlan Başlığı *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Örn: Boss DS-1 Distortion Pedalı"
                    placeholderTextColor="#64748B"
                    value={title}
                    onChangeText={setTitle}
                  />

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Kategori</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Gitar, Amfi, Pedal..."
                        placeholderTextColor="#64748B"
                        value={category}
                        onChangeText={setCategory}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Durum</Text>
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        <TouchableOpacity
                          style={[styles.condBtn, condition === 'USED' && styles.condBtnActive]}
                          onPress={() => setCondition('USED')}
                        >
                          <Text style={[styles.condBtnText, condition === 'USED' && styles.condBtnTextActive]}>2. El</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.condBtn, condition === 'NEW' && styles.condBtnActive]}
                          onPress={() => setCondition('NEW')}
                        >
                          <Text style={[styles.condBtnText, condition === 'NEW' && styles.condBtnTextActive]}>Sıfır</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Fiyat (TL) *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Örn: 2500"
                        placeholderTextColor="#64748B"
                        value={price}
                        onChangeText={setPrice}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Şehir *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Örn: İstanbul"
                        placeholderTextColor="#64748B"
                        value={city}
                        onChangeText={setCity}
                      />
                    </View>
                  </View>

                  <Text style={styles.label}>İletişim (Telefon / WhatsApp) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0532..."
                    placeholderTextColor="#64748B"
                    value={contactInfo}
                    onChangeText={setContactInfo}
                  />

                  <Text style={styles.label}>Açıklama (Kozmetik durum, takas vb.)</Text>
                  <TextInput
                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                    placeholder="Ekipmanın durumu, kutu/fatura varlığı..."
                    placeholderTextColor="#64748B"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                  />

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    <TouchableOpacity
                      style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                      disabled={submitting}
                      onPress={handleCreateListing}
                    >
                      <Text style={styles.submitBtnText}>{submitting ? 'Kaydediliyor...' : 'İlanı Yayınla'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsSubmitOpen(false)}>
                      <Text style={styles.cancelBtnText}>İptal</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          ) : (
            <View style={styles.body}>
              {/* Filtre ve Arama */}
              <View style={styles.filterSection}>
                <View style={styles.searchBar}>
                  <Search color="#64748B" size={14} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Ekipman veya şehir ara..."
                    placeholderTextColor="#64748B"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Text style={[styles.catChipText, selectedCategory === cat && styles.catChipTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Ürün Listesi */}
              {loading ? (
                <View style={styles.center}><ActivityIndicator color="#38BDF8" size="large" /></View>
              ) : (
                <ScrollView style={{ flex: 1, padding: 14 }}>
                  {filteredProducts.map((p) => (
                    <View key={p.id} style={styles.productCard}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <View style={styles.catBadge}><Text style={styles.catBadgeText}>{p.category}</Text></View>
                          <View style={[styles.condBadge, p.condition === 'NEW' ? styles.condNew : styles.condUsed]}>
                            <Text style={styles.condBadgeText}>{p.condition === 'NEW' ? 'SIFIR' : '2. EL'}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                            <MapPin color="#64748B" size={11} />
                            <Text style={styles.cityText}>{p.city}</Text>
                          </View>
                        </View>

                        <Text style={styles.productTitle}>{p.title}</Text>
                        {p.description ? (
                          <Text style={styles.productDesc} numberOfLines={2}>{p.description}</Text>
                        ) : null}
                      </View>

                      <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', paddingLeft: 10 }}>
                        <Text style={styles.priceAmount}>
                          {Number(p.price).toLocaleString('tr-TR')} TL
                        </Text>

                        <TouchableOpacity
                          style={styles.contactBtn}
                          onPress={() => Linking.openURL(`tel:${p.contact_info}`)}
                        >
                          <Phone color="#FFFFFF" size={12} />
                          <Text style={styles.contactBtnText}>İletişim</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  {filteredProducts.length === 0 && (
                    <Text style={styles.emptyNote}>Bu filtrede ilan bulunamadı.</Text>
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
  headerTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: 'bold' },
  closeBtn: { padding: 4 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#0284C7', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 5 },
  addBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },

  body: { flex: 1, backgroundColor: '#090E1A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  filterSection: { padding: 12, backgroundColor: '#0B1120', borderBottomWidth: 1, borderBottomColor: '#1E293B', gap: 8 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161F30', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, gap: 6 },
  searchInput: { flex: 1, color: '#F8FAFC', fontSize: 12, outlineStyle: 'none' } as any,

  catChip: { backgroundColor: '#161F30', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 5 },
  catChipActive: { backgroundColor: '#0284C7' },
  catChipText: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold' },
  catChipTextActive: { color: '#FFFFFF' },

  productCard: { flexDirection: 'row', backgroundColor: '#161F30', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#1E293B' },
  catBadge: { backgroundColor: '#1E293B', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  catBadgeText: { color: '#38BDF8', fontSize: 10, fontWeight: 'bold' },
  condBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  condNew: { backgroundColor: '#065F46' },
  condUsed: { backgroundColor: '#1E293B' },
  condBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  cityText: { color: '#64748B', fontSize: 11 },
  productTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
  productDesc: { color: '#94A3B8', fontSize: 11, lineHeight: 16 },

  priceAmount: { color: '#34D399', fontSize: 14, fontWeight: '900' },
  contactBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0284C7', paddingVertical: 5, paddingHorizontal: 8, borderRadius: 4, marginTop: 10 },
  contactBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },

  formTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  formSub: { color: '#64748B', fontSize: 11, marginBottom: 12 },
  label: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold', marginBottom: 4, marginTop: 6 },
  input: { backgroundColor: '#161F30', borderWidth: 1, borderColor: '#334155', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, color: '#F8FAFC', fontSize: 12, marginBottom: 8, outlineStyle: 'none' } as any,
  condBtn: { flex: 1, backgroundColor: '#161F30', paddingVertical: 8, alignItems: 'center', borderRadius: 5 },
  condBtnActive: { backgroundColor: '#0284C7' },
  condBtnText: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold' },
  condBtnTextActive: { color: '#FFFFFF' },

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