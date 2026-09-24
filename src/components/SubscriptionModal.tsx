import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import {
  X,
  Crown,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Lock,
} from 'lucide-react-native';
import { processPremiumSubscription } from '../services/subscriptionService';
import { UserProfile } from '../services/authService';

interface Props {
  visible: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onSuccess: () => void;
  onOpenAuth: () => void;
}

export default function SubscriptionModal({
  visible,
  onClose,
  currentUser,
  onSuccess,
  onOpenAuth,
}: Props) {
  const [plan, setPlan] = useState<'MONTHLY' | 'ANNUAL'>('ANNUAL');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 16);
    const parts = cleaned.match(/[\s\S]{1,4}/g) || [];
    setCardNumber(parts.join(' '));
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) {
      setExpiryDate(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setExpiryDate(cleaned);
    }
  };

  const handleCheckout = async () => {
    if (!currentUser) {
      onClose();
      onOpenAuth();
      return;
    }

    try {
      setLoading(true);
      await processPremiumSubscription(currentUser.id, {
        cardHolder,
        cardNumber,
        expiryDate,
        cvv,
        plan,
      });

      alert('Premium talebiniz yöneticiye iletildi. Onay sonrası hesabınız yükseltilir.');
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Ödeme gerçekleştirilemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalBox}>
              <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Crown color="#F59E0B" size={20} />
                  <Text style={styles.headerTitle}>Morpheus Premium'a Geçin</Text>
                </View>
                <TouchableOpacity onPress={onClose}>
                  <X color="#94A3B8" size={18} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {/* Plan Seçimi */}
                <View style={styles.planSelector}>
                  <TouchableOpacity
                    style={[styles.planCard, plan === 'ANNUAL' && styles.planCardActive]}
                    onPress={() => setPlan('ANNUAL')}
                  >
                    <View style={styles.bestValueBadge}>
                      <Text style={styles.bestValueText}>%40 İNDİRİM</Text>
                    </View>
                    <Text style={styles.planTitle}>Yıllık Plan</Text>
                    <Text style={styles.planPrice}>69 TL <Text style={styles.planPeriod}>/ ay</Text></Text>
                    <Text style={styles.planBilled}>Yıllık 828 TL faturalandırılır</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.planCard, plan === 'MONTHLY' && styles.planCardActive]}
                    onPress={() => setPlan('MONTHLY')}
                  >
                    <Text style={styles.planTitle}>Aylık Plan</Text>
                    <Text style={styles.planPrice}>119 TL <Text style={styles.planPeriod}>/ ay</Text></Text>
                    <Text style={styles.planBilled}>İstediğiniz zaman iptal edin</Text>
                  </TouchableOpacity>
                </View>

                {/* Özellik Listesi */}
                <View style={styles.featuresBox}>
                  <View style={styles.featureItem}>
                    <Sparkles color="#F59E0B" size={14} />
                    <Text style={styles.featureText}>Sınırsız Gemini 3.6 AI Tarz Aranjmanı</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <CheckCircle2 color="#34D399" size={14} />
                    <Text style={styles.featureText}>Gitar, Bas ve Piyano için tam akor şemaları</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <CheckCircle2 color="#34D399" size={14} />
                    <Text style={styles.featureText}>Portal ve Sahne Modu'nda 0 Reklam deneyimi</Text>
                  </View>
                </View>

                {/* Kart Bilgileri */}
                <View style={styles.formSection}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <CreditCard color="#94A3B8" size={14} />
                    <Text style={styles.formSectionTitle}>Ödeme Bilgileri</Text>
                  </View>

                  <TextInput
                    style={styles.input}
                    placeholder="Kart Üzerindeki İsim"
                    placeholderTextColor="#64748B"
                    value={cardHolder}
                    onChangeText={setCardHolder}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Kart Numarası (16 Hane)"
                    placeholderTextColor="#64748B"
                    value={cardNumber}
                    onChangeText={formatCardNumber}
                    keyboardType="numeric"
                  />

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="AA/YY"
                      placeholderTextColor="#64748B"
                      value={expiryDate}
                      onChangeText={formatExpiry}
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="CVV"
                      placeholderTextColor="#64748B"
                      value={cvv}
                      onChangeText={(t) => setCvv(t.slice(0, 3))}
                      keyboardType="numeric"
                      secureTextEntry
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.checkoutBtn, loading && { opacity: 0.6 }]}
                  disabled={loading}
                  onPress={handleCheckout}
                >
                  {loading ? (
                    <ActivityIndicator color="#0F172A" />
                  ) : (
                    <>
                      <Lock color="#0F172A" size={15} />
                      <Text style={styles.checkoutBtnText}>
                        {currentUser ? 'Güvenli Öde ve Yükselt' : 'Önce Giriş Yapın'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.securityNote}>
                  <ShieldCheck color="#64748B" size={12} />
                  <Text style={styles.securityText}>
                    256-Bit SSL korumalı güvenli şifreleme altyapısı.
                  </Text>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalBox: { width: '100%', maxWidth: 440, maxHeight: 580, backgroundColor: '#0F172A', borderRadius: 12, padding: 18, borderWidth: 1, borderColor: '#1E293B' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: 'bold' },

  planSelector: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  planCard: { flex: 1, backgroundColor: '#161F30', borderWidth: 1, borderColor: '#334155', borderRadius: 8, padding: 10, alignItems: 'center' },
  planCardActive: { borderColor: '#F59E0B', backgroundColor: '#1E1B4B' },
  bestValueBadge: { position: 'absolute', top: -8, backgroundColor: '#F59E0B', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  bestValueText: { color: '#0F172A', fontSize: 8, fontWeight: '900' },
  planTitle: { color: '#CBD5E1', fontSize: 11, fontWeight: 'bold', marginTop: 4 },
  planPrice: { color: '#F8FAFC', fontSize: 16, fontWeight: '900', marginTop: 2 },
  planPeriod: { color: '#94A3B8', fontSize: 10, fontWeight: 'normal' },
  planBilled: { color: '#64748B', fontSize: 9, marginTop: 4, textAlign: 'center' },

  featuresBox: { backgroundColor: '#161F30', borderRadius: 8, padding: 10, gap: 8, marginBottom: 14, borderWidth: 1, borderColor: '#1E293B' },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureText: { color: '#E2E8F0', fontSize: 11, fontWeight: '500' },

  formSection: { marginBottom: 14 },
  formSectionTitle: { color: '#CBD5E1', fontSize: 11, fontWeight: 'bold' },
  input: { backgroundColor: '#161F30', borderWidth: 1, borderColor: '#334155', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, color: '#F8FAFC', fontSize: 12, marginBottom: 8, outlineStyle: 'none' } as any,

  checkoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: '#F59E0B', paddingVertical: 10, borderRadius: 6 },
  checkoutBtnText: { color: '#0F172A', fontWeight: '900', fontSize: 12 },

  securityNote: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, marginTop: 10 },
  securityText: { color: '#64748B', fontSize: 10 },
});