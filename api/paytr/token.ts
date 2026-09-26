import { clientIp, PAID_PLAN_CODES, paytrTokenHash, siteOrigin } from './_lib';

function restHeaders(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const merchantId = process.env.PAYTR_MERCHANT_ID;
  const merchantKey = process.env.PAYTR_MERCHANT_KEY;
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT;

  if (!supabaseUrl || !anonKey) {
    res.status(500).json({ error: 'supabase_env_missing' });
    return;
  }
  if (!merchantId || !merchantKey || !merchantSalt || !serviceKey) {
    res.status(503).json({
      error: 'paytr_not_configured',
      message: 'PayTR veya service role ortam değişkeni yok. Vercel’e PAYTR_MERCHANT_* ve SUPABASE_SERVICE_ROLE_KEY ekleyin.',
    });
    return;
  }

  const auth = String(req.headers?.authorization || '');
  const jwt = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!jwt) {
    res.status(401).json({ error: 'auth_required' });
    return;
  }

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${jwt}` },
  });
  if (!userRes.ok) {
    res.status(401).json({ error: 'invalid_session' });
    return;
  }
  const user = await userRes.json();
  const userId = String(user?.id || '');
  const email = String(user?.email || '');
  if (!userId || !email) {
    res.status(401).json({ error: 'invalid_user' });
    return;
  }

  const planCode = String(req.body?.plan_code || '');
  if (!PAID_PLAN_CODES.includes(planCode as any)) {
    res.status(400).json({ error: 'invalid_plan' });
    return;
  }

  const planRes = await fetch(
    `${supabaseUrl}/rest/v1/morfeus_billing_plans?plan_code=eq.${encodeURIComponent(planCode)}&is_active=eq.true&select=plan_code,title,amount_kurus,tier,period`,
    { headers: restHeaders(serviceKey) }
  );
  const plans = planRes.ok ? await planRes.json() : [];
  const plan = Array.isArray(plans) ? plans[0] : null;
  if (!plan) {
    res.status(400).json({ error: 'plan_not_found' });
    return;
  }

  const profileRes = await fetch(
    `${supabaseUrl}/rest/v1/morfeus_profiles?id=eq.${encodeURIComponent(userId)}&select=full_name,phone`,
    { headers: restHeaders(serviceKey) }
  );
  const profiles = profileRes.ok ? await profileRes.json() : [];
  const profile = Array.isArray(profiles) ? profiles[0] : null;
  const userName = String(profile?.full_name || '').trim() || email;
  const userPhone = String(profile?.phone || '').replace(/[^\d]/g, '') || '05000000000';

  const merchantOid = `MRF${Date.now()}${userId.replace(/-/g, '').slice(0, 10)}`.slice(0, 64);
  const paymentAmount = String(plan.amount_kurus);
  const userBasket = Buffer.from(
    JSON.stringify([[plan.title, (plan.amount_kurus / 100).toFixed(2), 1]])
  ).toString('base64');
  const testMode = process.env.PAYTR_TEST_MODE === '0' ? '0' : '1';
  const origin = siteOrigin();
  const userIp = clientIp(req);

  const pending = await fetch(`${supabaseUrl}/rest/v1/morfeus_payments`, {
    method: 'POST',
    headers: { ...restHeaders(serviceKey), Prefer: 'return=minimal' },
    body: JSON.stringify({
      merchant_oid: merchantOid,
      user_id: userId,
      plan_code: planCode,
      amount_kurus: plan.amount_kurus,
      status: 'pending',
      provider: 'paytr',
      payload: { tier: plan.tier, period: plan.period },
    }),
  });
  if (!pending.ok) {
    const detail = await pending.text();
    res.status(500).json({ error: 'payment_insert_failed', detail });
    return;
  }

  const tokenPayload = new URLSearchParams({
    merchant_id: merchantId,
    user_ip: userIp,
    merchant_oid: merchantOid,
    email,
    payment_amount: paymentAmount,
    paytr_token: paytrTokenHash({
      merchantId,
      merchantKey,
      merchantSalt,
      userIp,
      merchantOid,
      email,
      paymentAmount,
      userBasket,
      noInstallment: '0',
      maxInstallment: '0',
      currency: 'TL',
      testMode,
    }),
    user_basket: userBasket,
    no_installment: '0',
    max_installment: '0',
    currency: 'TL',
    test_mode: testMode,
    merchant_ok_url: `${origin}/odeme/basarili`,
    merchant_fail_url: `${origin}/odeme/hata`,
    user_name: userName,
    user_address: 'Morpheus Portal',
    user_phone: userPhone,
    timeout_limit: '30',
    debug_on: testMode,
    lang: 'tr',
  });

  const paytrRes = await fetch('https://www.paytr.com/odeme/api/get-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenPayload.toString(),
  });
  const paytrJson = await paytrRes.json().catch(() => null);
  if (!paytrJson || paytrJson.status !== 'success' || !paytrJson.token) {
    res.status(502).json({
      error: 'paytr_token_failed',
      message: paytrJson?.reason || 'PayTR token alınamadı.',
    });
    return;
  }

  res.status(200).json({
    token: paytrJson.token,
    merchant_oid: merchantOid,
    amount_kurus: plan.amount_kurus,
    plan_code: planCode,
    iframe_url: `https://www.paytr.com/odeme/guvenli/${paytrJson.token}`,
  });
}
