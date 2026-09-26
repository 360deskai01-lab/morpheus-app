import { supabase } from '../lib/supabase';

export type PaidTier = 'net' | 'napp' | 'band';
export type BillingPeriod = 'monthly' | 'annual';
export type BillingPlanCode =
  | 'net_monthly'
  | 'net_annual'
  | 'napp_monthly'
  | 'napp_annual'
  | 'band_monthly'
  | 'band_annual';

export interface BillingPlan {
  plan_code: string;
  title: string;
  amount_kurus: number;
  period_days: number;
  tier: PaidTier | 'basic' | string;
  period: BillingPeriod | string;
  seat_count: number;
  is_active: boolean;
  updated_at?: string;
}

export const FALLBACK_PLANS: BillingPlan[] = [
  { plan_code: 'net_monthly', title: 'Net Aylık', amount_kurus: 8990, period_days: 30, tier: 'net', period: 'monthly', seat_count: 1, is_active: true },
  { plan_code: 'net_annual', title: 'Net Yıllık', amount_kurus: 79990, period_days: 365, tier: 'net', period: 'annual', seat_count: 1, is_active: true },
  { plan_code: 'napp_monthly', title: 'Napp Aylık', amount_kurus: 13990, period_days: 30, tier: 'napp', period: 'monthly', seat_count: 1, is_active: true },
  { plan_code: 'napp_annual', title: 'Napp Yıllık', amount_kurus: 119990, period_days: 365, tier: 'napp', period: 'annual', seat_count: 1, is_active: true },
  { plan_code: 'band_monthly', title: 'Band Aylık', amount_kurus: 24990, period_days: 30, tier: 'band', period: 'monthly', seat_count: 10, is_active: true },
  { plan_code: 'band_annual', title: 'Band Yıllık', amount_kurus: 239990, period_days: 365, tier: 'band', period: 'annual', seat_count: 10, is_active: true },
];

export const TIER_CATALOG = [
  {
    tier: 'basic' as const,
    name: 'Basic',
    tagline: 'Ücretsiz',
    features: ['Akor kütüphanesi', 'Transpoze ve diyagramlar', 'Repertuvar listeleri'],
  },
  {
    tier: 'net' as const,
    name: 'Net',
    tagline: 'Web odaklı',
    features: ['Basic’deki her şey', 'Sahne paleti ve rozetler', 'Web portalında tam deneyim'],
  },
  {
    tier: 'napp' as const,
    name: 'Napp',
    tagline: 'Web + mobil uygulama',
    features: ['Net’teki her şey', 'Sahne modu ve tuner', 'iOS / Android uygulama erişimi'],
  },
  {
    tier: 'band' as const,
    name: 'Band',
    tagline: 'Grup / akademi',
    features: ['Napp’taki her şey', '10 kişilik ortak kullanım', 'Topluluk / sahne lisansı'],
  },
];

export function formatPlanPrice(amountKurus: number): string {
  return `${(amountKurus / 100).toLocaleString('tr-TR', {
    minimumFractionDigits: amountKurus % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })} TL`;
}

export function tlToKurus(tl: string | number): number {
  const n = typeof tl === 'number' ? tl : Number(String(tl).replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export function planCodeFor(tier: PaidTier, period: BillingPeriod): BillingPlanCode {
  return `${tier}_${period}`;
}

export async function fetchBillingPlans(): Promise<BillingPlan[]> {
  const { data, error } = await supabase
    .from('morfeus_billing_plans')
    .select('plan_code, title, amount_kurus, period_days, tier, period, seat_count, is_active, updated_at')
    .eq('is_active', true)
    .order('amount_kurus', { ascending: true });

  if (error || !data?.length) return FALLBACK_PLANS;
  const paid = (data as BillingPlan[]).filter((row) =>
    ['net', 'napp', 'band'].includes(String(row.tier || ''))
  );
  return paid.length ? paid : FALLBACK_PLANS;
}

export async function saveBillingPlan(
  planCode: string,
  amountKurus: number,
  periodDays: number,
  title?: string
) {
  const { error } = await supabase.rpc('morfeus_admin_set_billing_plan', {
    p_plan_code: planCode,
    p_amount_kurus: amountKurus,
    p_period_days: periodDays,
    p_title: title || null,
  });
  if (error) throw error;
}

export async function grantBillingPlan(profileId: string, planCode: string) {
  const { error } = await supabase.rpc('morfeus_admin_grant_plan', {
    p_profile_id: profileId,
    p_plan_code: planCode,
  });
  if (error) throw error;
}

export async function expireOverduePremium(): Promise<number> {
  const { data, error } = await supabase.rpc('morfeus_expire_premium');
  if (error) throw error;
  return Number(data || 0);
}
