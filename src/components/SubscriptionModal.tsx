import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
} from 'react-native';
import { X, CheckCircle2, ShieldCheck } from 'lucide-react-native';
import { requestPlanUpgrade, loadCheckoutPlans } from '../services/subscriptionService';
import { startPaytrCheckout } from '../services/paytrService';
import {
  FALLBACK_PLANS,
  TIER_CATALOG,
  formatPlanPrice,
  planCodeFor,
  type BillingPeriod,
  type BillingPlan,
  type PaidTier,
} from '../services/billingService';

interface Props {
  visible: boolean;
  onClose: () => void;
  currentUser: { id: string; email?: string | null } | null;
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
  const [period, setPeriod] = useState<BillingPeriod>('annual');
  const [selectedTier, setSelectedTier] = useState<PaidTier>('napp');
  const [plans, setPlans] = useState<BillingPlan[]>(FALLBACK_PLANS);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [busy, setBusy] = useState(false);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setIframeUrl(null);
      return;
    }
    setLoadingPlans(true);
    loadCheckoutPlans()
      .then(setPlans)
      .finally(() => setLoadingPlans(false));
  }, [visible]);

  const selectedPlan = useMemo(() => {
    const code = planCodeFor(selectedTier, period);
    return plans.find((row) => row.plan_code === code);
  }, [plans, selectedTier, period]);

  const priceFor = (tier: PaidTier) => {
    const code = planCodeFor(tier, period);
    return plans.find((row) => row.plan_code === code)?.amount_kurus || 0;
  };

  const handleCheckout = async () => {
    if (selectedTier === undefined) return;
    if (!currentUser) {
      onClose();
      onOpenAuth();
      return;
    }
    const planCode = planCodeFor(selectedTier, period);
    setBusy(true);
    try {
      const checkout = await startPaytrCheckout(planCode);
      setIframeUrl(checkout.iframe_url);
    } catch (err: any) {
      if (err?.code === 'paytr_not_configured' || String(err.message || '').includes('PayTR')) {
        try {
          await requestPlanUpgrade(currentUser.id, planCode);
          alert('PayTR henüz canlı değil. Talebiniz yöneticiye iletildi.');
          onSuccess();
          onClose();
        } catch (requestErr: any) {
          alert(requestErr.message || err.message || 'Ödeme başlatılamadı.');
        }
      } else {
        alert(err.message || 'Ödeme başlatılamadı.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalBox}>
              <View style={styles.header}>
                <View>
                  <Text style={styles.headerTitle}>Morpheus Üyelik</Text>
                  <Text style={styles.headerSub}>Basic · Net · Napp · Band</Text>
                </View>
                <TouchableOpacity onPress={onClose}>
                  <X color="#94A3B8" size={18} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <View style={styles.periodRow}>
                  <TouchableOpacity
                    style={[styles.periodBtn, period === 'monthly' && styles.periodBtnOn]}
                    onPress={() => setPeriod('monthly')}
                  >
                    <Text style={[styles.periodText, period === 'monthly' && styles.periodTextOn]}>Aylık</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.periodBtn, period === 'annual' && styles.periodBtnOn]}
                    onPress={() => setPeriod('annual')}
                  >
                    <Text style={[styles.periodText, period === 'annual' && styles.periodTextOn]}>Yıllık</Text>
                  </TouchableOpacity>
                </View>

                {loadingPlans ? (
                  <ActivityIndicator color="#F59E0B" style={{ marginVertical: 20 }} />
                ) : (
                  <View style={styles.grid}>
                    {TIER_CATALOG.map((pack) => {
                      const paid = pack.tier !== 'basic';
                      const active = paid && selectedTier === pack.tier;
                      return (
                        <TouchableOpacity
                          key={pack.tier}
                          style={[styles.pack, active && styles.packOn, pack.tier === 'napp' && styles.packFeatured]}
                          onPress={() => paid && setSelectedTier(pack.tier)}
                          disabled={!paid}
                        >
                          {pack.tier === 'napp' ? (
                            <Text style={styles.featuredLabel}>ÖNERİLEN</Text>
                          ) : null}
                          <Text style={styles.packName}>{pack.name}</Text>
                          <Text style={styles.packTag}>{pack.tagline}</Text>
                          <Text style={styles.packPrice}>
                            {paid ? formatPlanPrice(priceFor(pack.tier)) : '0 TL'}
                          </Text>
                          <Text style={styles.packPeriod}>{paid ? (period === 'annual' ? '/ yıl' : '/ ay') : 'süresiz'}</Text>
                          {pack.features.map((line) => (
                            <View key={line} style={styles.featRow}>
                              <CheckCircle2 color="#34D399" size={12} />
                              <Text style={styles.featText}>{line}</Text>
                            </View>
                          ))}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {iframeUrl && Platform.OS === 'web' ? (
                  <View style={styles.iframeWrap}>
                    {React.createElement('iframe', {
                      title: 'PayTR',
                      src: iframeUrl,
                      style: { width: '100%', height: 420, border: 0, borderRadius: 8, background: '#fff' },
                    })}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.checkoutBtn, busy && { opacity: 0.6 }]}
                    disabled={busy}
                    onPress={handleCheckout}
                  >
                    {busy ? (
                      <ActivityIndicator color="#0F172A" />
                    ) : (
                      <Text style={styles.checkoutBtnText}>
                        {!currentUser
                          ? 'Önce giriş yapın'
                          : `${selectedPlan?.title || 'Paketi'} ile öde`}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}

                <View style={styles.securityNote}>
                  <ShieldCheck color="#64748B" size={12} />
                  <Text style={styles.securityText}>
                    Kart bilgisi PayTR iframe’inde alınır. Anahtarlar sunucuda kalır. Band 10 kişilik ortak lisans içerir.
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 12 },
  modalBox: { width: '100%', maxWidth: 720, maxHeight: 640, backgroundColor: '#0F172A', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1E293B' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' },
  headerSub: { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  periodRow: { flexDirection: 'row', backgroundColor: '#161F30', borderRadius: 8, padding: 3, marginBottom: 12, gap: 4 },
  periodBtn: { flex: 1, paddingVertical: 7, borderRadius: 6, alignItems: 'center' },
  periodBtnOn: { backgroundColor: '#F59E0B' },
  periodText: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
  periodTextOn: { color: '#0F172A' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  pack: { width: '48%', minWidth: 148, flexGrow: 1, backgroundColor: '#161F30', borderWidth: 1, borderColor: '#334155', borderRadius: 8, padding: 10 },
  packOn: { borderColor: '#F59E0B', backgroundColor: '#1E1B4B' },
  packFeatured: { borderColor: '#38BDF8' },
  featuredLabel: { color: '#38BDF8', fontSize: 8, fontWeight: '900', marginBottom: 2 },
  packName: { color: '#F8FAFC', fontSize: 14, fontWeight: '800' },
  packTag: { color: '#94A3B8', fontSize: 10, marginBottom: 6 },
  packPrice: { color: '#F8FAFC', fontSize: 16, fontWeight: '900' },
  packPeriod: { color: '#64748B', fontSize: 10, marginBottom: 8 },
  featRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  featText: { color: '#E2E8F0', fontSize: 10, flex: 1 },
  iframeWrap: { marginBottom: 10 },
  checkoutBtn: { backgroundColor: '#F59E0B', paddingVertical: 11, borderRadius: 6, alignItems: 'center' },
  checkoutBtnText: { color: '#0F172A', fontWeight: '900', fontSize: 13 },
  securityNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  securityText: { color: '#64748B', fontSize: 10, flex: 1 },
});
