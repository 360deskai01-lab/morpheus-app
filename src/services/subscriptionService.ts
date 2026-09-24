import { supabase } from '../lib/supabase';

export interface PaymentDetails {
  cardHolder: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  plan: 'MONTHLY' | 'ANNUAL';
}

export async function processPremiumSubscription(
  userId: string,
  details: PaymentDetails
): Promise<{ success: boolean; message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  if (!details.cardHolder.trim() || details.cardNumber.replace(/\s/g, '').length < 16) {
    throw new Error('Geçerli bir kart sahibi ve 16 haneli kart numarası giriniz.');
  }

  const { data: master } = await supabase
    .from('morfeus_profiles')
    .select('id')
    .eq('email', 'master@360bct.com')
    .maybeSingle();

  const { error } = await supabase.from('morfeus_messages').insert({
    sender_id: userId,
    recipient_id: master?.id || userId,
    subject: `Premium talep (${details.plan})`,
    body: 'Kart bilgisi saklanmadı. Onay sonrası yönetici üyelik seviyesini tanımlar.',
  });

  if (error) {
    throw new Error('Talep iletilemedi: ' + error.message);
  }

  return {
    success: true,
    message: 'Premium talebiniz yöneticiye iletildi. Onay sonrası hesabınız yükseltilir.',
  };
}
