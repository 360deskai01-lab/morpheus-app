import { createHmac } from 'crypto';

export const PAID_PLAN_CODES = [
  'net_monthly',
  'net_annual',
  'napp_monthly',
  'napp_annual',
  'band_monthly',
  'band_annual',
] as const;

export function paytrTokenHash(params: {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
  userIp: string;
  merchantOid: string;
  email: string;
  paymentAmount: string;
  userBasket: string;
  noInstallment: string;
  maxInstallment: string;
  currency: string;
  testMode: string;
}) {
  const raw =
    params.merchantId +
    params.userIp +
    params.merchantOid +
    params.email +
    params.paymentAmount +
    params.userBasket +
    params.noInstallment +
    params.maxInstallment +
    params.currency +
    params.testMode +
    params.merchantSalt;
  return createHmac('sha256', params.merchantKey).update(raw).digest('base64');
}

export function paytrNotifyHash(
  merchantOid: string,
  merchantSalt: string,
  status: string,
  totalAmount: string,
  merchantKey: string
) {
  return createHmac('sha256', merchantKey)
    .update(merchantOid + merchantSalt + status + totalAmount)
    .digest('base64');
}

export function clientIp(req: { headers?: Record<string, any> }): string {
  const forwarded = String(req.headers?.['x-forwarded-for'] || '');
  const first = forwarded.split(',')[0]?.trim();
  return first || String(req.headers?.['x-real-ip'] || '127.0.0.1');
}

export function siteOrigin(): string {
  return process.env.PAYTR_SITE_URL || process.env.EXPO_PUBLIC_SITE_URL || 'https://www.stagemorpheus.com';
}
