// src/services/aiArrangerService.ts

// Vercel veya yerel ortam değişkenlerinden API anahtarını alır
const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

export type ReharmonizeStyle = 'jazz' | 'bossa' | 'lofi' | 'rock_ballad';

export interface ReharmonizeResult {
  style: ReharmonizeStyle;
  content: string;
  notes: string;
}

const STYLE_PROMPTS: Record<ReharmonizeStyle, string> = {
  jazz: 'Neo-Soul ve Caz armonisi: Maj7, m9, 11, 13 ve tritone substitution (ikame) akorları kullanarak sofistike ve zengin bir armoni oluştur.',
  bossa: 'Bossa Nova ve Latin armonisi: Yumuşak 6/9, m7, altered dominant akorlar (7b9, 7#5) kullanarak ritmik ve akıcı bir hava ver.',
  lofi: 'Lo-Fi / Akustik Chill: Sade ama duygusal sus2, sus4, add9 ve açık tel hissi veren minimal akorlar seç.',
  rock_ballad: 'Epik Rock Ballad: Güçlü bas yürüyüşleri, ters akorlar (inversion: C/E, G/B) ve dramatik dominant geçişleri ekle.',
};

export async function reharmonizeSong(
  title: string,
  artist: string,
  content: string,
  style: ReharmonizeStyle
): Promise<ReharmonizeResult> {
  if (!apiKey) {
    throw new Error('Gemini API anahtarı yapılandırılmamış (EXPO_PUBLIC_GEMINI_API_KEY eksik).');
  }

  const prompt = `
Sen profesyonel bir aranjör ve müzik teorisyenisin.
Aşağıda verilen şarkının söz ve akor formatını bozmadan, belirtilen tarza göre AKORLARINI YENİDEN HARMONİZE ET (Reharmonization).

Şarkı: ${title} - ${artist}
Hedef Tarz: ${STYLE_PROMPTS[style]}

Kurallar:
1. Şarkı sözlerinin hece yapısını ve akorların sözün tam üzerindeki yerleşimini KESİNLİKLE BOZMA.
2. Çıktı sadece ve sadece formatlanmış şarkı sözü ve yeni akorlardan oluşsun.
3. Giriş veya çıkışta fazladan sohbet cümlesi yazma.
4. En alta tek satır halinde "ARANJÖR NOTU: [Kullanılan temel teknikler ve armoni özeti]" ekle.

Şarkı İçeriği:
${content}
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gemini API hatası: ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Aranjör notunu ayıkla
  const noteMatch = rawText.match(/ARANJÖR NOTU:\s*(.+)$/m);
  const notes = noteMatch ? noteMatch[1].trim() : 'Yeni armoni başarıyla uygulandı.';
  const cleanedContent = rawText.replace(/ARANJÖR NOTU:\s*.+$/m, '').trim();

  return {
    style,
    content: cleanedContent || content,
    notes,
  };
}