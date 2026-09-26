import { paytrNotifyHash } from './_lib';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).send('FAIL');
    return;
  }

  const merchantKey = process.env.PAYTR_MERCHANT_KEY || '';
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT || '';
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const body = req.body || {};
  const merchantOid = String(body.merchant_oid || '');
  const status = String(body.status || '');
  const totalAmount = String(body.total_amount || '');
  const hash = String(body.hash || '');

  if (!merchantOid || !hash || !merchantKey || !merchantSalt) {
    res.status(400).send('FAIL');
    return;
  }

  const expected = paytrNotifyHash(merchantOid, merchantSalt, status, totalAmount, merchantKey);
  if (expected !== hash) {
    res.status(400).send('FAIL');
    return;
  }

  if (status !== 'success') {
    if (supabaseUrl && serviceKey) {
      await fetch(
        `${supabaseUrl}/rest/v1/morfeus_payments?merchant_oid=eq.${encodeURIComponent(merchantOid)}`,
        {
          method: 'PATCH',
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'failed', payload: { reason: body.failed_reason_msg || status } }),
        }
      );
    }
    res.status(200).send('OK');
    return;
  }

  if (!supabaseUrl || !serviceKey) {
    res.status(500).send('FAIL');
    return;
  }

  const payRes = await fetch(
    `${supabaseUrl}/rest/v1/morfeus_payments?merchant_oid=eq.${encodeURIComponent(merchantOid)}&select=user_id,plan_code,amount_kurus,status`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );
  const rows = payRes.ok ? await payRes.json() : [];
  const payment = Array.isArray(rows) ? rows[0] : null;
  if (!payment) {
    res.status(404).send('FAIL');
    return;
  }
  if (payment.status === 'paid') {
    res.status(200).send('OK');
    return;
  }
  const paidAmount = Number(body.payment_amount || totalAmount);
  if (!Number.isFinite(paidAmount) || paidAmount < Number(payment.amount_kurus)) {
    res.status(400).send('FAIL');
    return;
  }

  const rpc = await fetch(`${supabaseUrl}/rest/v1/rpc/morfeus_apply_paid_tier`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_user_id: payment.user_id,
      p_merchant_oid: merchantOid,
      p_plan_code: payment.plan_code,
      p_amount_kurus: Number(payment.amount_kurus),
    }),
  });

  if (!rpc.ok) {
    res.status(500).send('FAIL');
    return;
  }

  res.status(200).send('OK');
}
