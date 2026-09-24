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
  // Simüle edilmiş ödeme gecikmesi (1.2 sn)
  await new Promise((resolve) => setTimeout(resolve, 1200));

  if (!details.cardHolder.trim() || details.cardNumber.replace(/\s/g, '').length < 16) {
    throw new Error('Geçerli bir kart sahibi ve 16 haneli kart numarası giriniz.');
  }

  void userId;
  throw new Error(
    'Premium yükseltme artık istemciden yazılamaz. Ödeme onayından sonra yönetici veya sunucu RPC ile tanımlanır.'
  );
}