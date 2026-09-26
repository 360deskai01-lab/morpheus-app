import { supabase } from '../lib/supabase';

export interface PaytrCheckout {
  token: string;
  merchant_oid: string;
  amount_kurus: number;
  plan_code: string;
  iframe_url: string;
}

export async function startPaytrCheckout(planCode: string): Promise<PaytrCheckout> {
  const { data } = await supabase.auth.getSession();
  const jwt = data.session?.access_token;
  if (!jwt) throw new Error('Ödeme için giriş yapmalısınız.');

  const response = await fetch('/api/paytr/token', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ plan_code: planCode }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = payload?.error || 'paytr_error';
    if (code === 'paytr_not_configured') {
      throw Object.assign(new Error(payload.message || 'PayTR henüz yapılandırılmadı.'), {
        code,
      });
    }
    throw new Error(payload.message || payload.detail || 'PayTR oturumu açılamadı.');
  }
  return payload as PaytrCheckout;
}
