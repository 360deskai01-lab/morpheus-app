// src/services/aiArranger.ts

export type MusicStyle = 'JAZZ' | 'FLAMENCO' | 'ARABESK' | 'BOSSA_NOVA' | 'REGGAE';

export interface StyleOption {
  id: MusicStyle;
  name: string;
  desc: string;
  badge: string;
}

export const MUSIC_STYLES: StyleOption[] = [
  {
    id: 'JAZZ',
    name: 'Modern Jazz & Blues',
    desc: 'Maj7, m7, 9, 11 ve eksilmiş tansiyon akorları ile zengin armoni.',
    badge: '7th / 9th',
  },
  {
    id: 'FLAMENCO',
    name: 'Flamenko & Endülüs',
    desc: 'Frigyen dominat yürüyüşler, yarım ses inişler ve İspanyol kadansları.',
    badge: 'Frigyen / E-F',
  },
  {
    id: 'ARABESK',
    name: 'Ağır Arabesk & Fantezi',
    desc: 'Koma hissi veren geçişler, derin minör ve hicaz modülasyonları.',
    badge: 'Hicaz / Minör',
  },
  {
    id: 'BOSSA_NOVA',
    name: 'Bossa Nova & Latin',
    desc: 'Akıcı 6/9 ve m7(b5) kadansları ile yumuşak Brezilya salınımı.',
    badge: 'm7b5 / 6/9',
  },
  {
    id: 'REGGAE',
    name: 'Roots Reggae / Dub',
    desc: 'Off-beat senkoplu ritimler, minimal ve vurucu akor geçişleri.',
    badge: 'Off-Beat',
  },
];

export async function reharmonizeWithAI(
  customApiKey: string | undefined,
  title: string,
  artist: string,
  originalKey: string,
  content: string,
  targetStyle: MusicStyle
): Promise<{ newTitle: string; newKey: string; newContent: string; rhythm: string }> {
  const apiKey =
    (customApiKey && customApiKey.trim().length > 10 ? customApiKey.trim() : '') ||
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    '';

  if (!apiKey) {
    throw new Error('Google Gemini API Anahtarı bulunamadı! Lütfen .env dosyasını kontrol edin.');
  }

  const prompt = `Sen profesyonel bir müzik aranjörü ve armoni profesörüsün.
GÖREV: Aşağıda verilen şarkının sözlerini KESİNLİKLE DEĞİŞTİRMEDEN, hecelerin üzerindeki akorları hedeflenen tarza göre sıfırdan yeniden armonize et (reharmonization).

Şarkı Adı: ${title}
Sanatçı: ${artist}
Mevcut Ton: ${originalKey}
Hedef Tarz: ${targetStyle}

İÇERİK:
${content}

KURALLAR:
1. Şarkı sözlerindeki tek bir harfi, heceyi veya satır yapısını dahi değiştirme.
2. Akorları hecelerin üzerine tam oturacak şekilde [Akor] formatında yerleştir (Örn: [Dm7]Akdeniz [G13]akşamları [Cmaj7]bir başka).
3. ${targetStyle} tarzının karakteristik armoni yürüyüşlerini, tansiyon akorlarını (7, 9, 11, b5, dim) ustalıkla kullan.
4. Çıktıyı SADECE geçerli bir JSON formatında ver. Başka hiçbir açıklama, selamlama veya markdown formatı yazma.

İSTENEN JSON FORMATI:
{
  "newTitle": "${title} (${targetStyle} Düzenleme)",
  "newKey": "${originalKey}",
  "rhythm": "Hedef tarza uygun ritim tanımı (Örn: 4/4 Jazz Swing veya 4/4 Frigyen Arpej)",
  "newContent": "Yeniden armonize edilmiş [Akor] söz metninin tamamı"
}`;

  // API hatasında talep edilen güncel model endpoint'i
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gemini API Hatası: ${response.statusText}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Gemini modelinden geçerli bir yanıt alınamadı.');
  }

  try {
    const parsed = JSON.parse(rawText);
    return {
      newTitle: parsed.newTitle || `${title} (${targetStyle} Aranje)`,
      newKey: parsed.newKey || originalKey,
      newContent: parsed.newContent || content,
      rhythm: parsed.rhythm || '4/4',
    };
  } catch (err) {
    throw new Error('Gemini yanıtı JSON olarak çözümlenemedi: ' + rawText.slice(0, 100));
  }
}