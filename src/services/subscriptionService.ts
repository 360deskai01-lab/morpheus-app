import { supabase } from '../lib/supabase';
import { fetchBillingPlans, type BillingPlan } from './billingService';

export type { BillingPlan };

export async function loadCheckoutPlans(): Promise<BillingPlan[]> {
  return fetchBillingPlans();
}

export async function requestPlanUpgrade(userId: string, planCode: string): Promise<void> {
  const { data: master } = await supabase
    .from('morfeus_profiles')
    .select('id')
    .eq('email', 'master@360bct.com')
    .maybeSingle();

  const { error } = await supabase.from('morfeus_messages').insert({
    sender_id: userId,
    recipient_id: master?.id || userId,
    subject: `Üyelik talep (${planCode})`,
    body: 'PayTR token ucu yanıt vermedi. Yönetici planı elle tanımlayabilir.',
  });

  if (error) throw new Error('Talep iletilemedi: ' + error.message);
}
