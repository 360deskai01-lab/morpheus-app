import { InfoPageId } from '../utils/portalRouting';

export interface InfoPage {
  id: InfoPageId;
  title: string;
  subtitle: string;
  paragraphs: string[];
}

export const INFO_PAGES: Record<InfoPageId, InfoPage> = {
  hakkimizda: {
    id: 'hakkimizda',
    title: 'Hakkımızda',
    subtitle: 'Morpheus Sahne Omurgası',
    paragraphs: [
      'Morpheus, 360DESK Müzik Teknolojileri bünyesinde geliştirilen bir akor, söz ve canlı sahne portalıdır. Amacımız sahnedeki müzisyenin söz, akor, transpoze ve enstrüman diyagramlarını tek bir istasyonda toplamak.',
      'Kütüphane yerli ve yabancı repertuvarı, Gemini destekli yeniden armonizasyonu, dijital akort aletini ve repertuvar listelerini aynı sahne görünümünde birleştirir.',
      'Proje hâlâ büyüyor: forum, eğitimler, etkinlik takvimi ve mağaza aynı omurga üzerinde çalışır. Yanlış veya eksik akor gördüğünüzde düzeltme önerisi gönderebilirsiniz.',
    ],
  },
  iletisim: {
    id: 'iletisim',
    title: 'İletişim & Destek',
    subtitle: 'info@360bct.com',
    paragraphs: [
      'İçerik hataları, üyelik ve teknik destek için bize e-posta ile ulaşabilirsiniz: info@360bct.com',
      'Şarkı sözü veya akor düzeltmesi için portal içindeki “Düzeltme Önerisinde Bulun” formunu kullanmanız daha hızlıdır; öneriler yönetici havuzuna düşer.',
      'Reklam, sponsorluk ve kurumsal iş birlikleri için aynı adrese “Sponsorluk” konu başlığıyla yazabilirsiniz.',
    ],
  },
  kunye: {
    id: 'kunye',
    title: 'Künye',
    subtitle: '360DESK Müzik Teknolojileri A.Ş.',
    paragraphs: [
      'Yayıncı: 360DESK Müzik Teknolojileri A.Ş.',
      'Ürün: Morpheus Pro Ecosystem — web portalı (stagemorpheus.com) ve yaklaşan mobil uygulama.',
      'İçerik, kullanıcı katkıları ve yönetici onaylı düzeltmelerle güncellenir. Yayınlanan akorlar performans kolaylığı içindir; resmi nota yerine geçmez.',
    ],
  },
  sponsorluk: {
    id: 'sponsorluk',
    title: 'Sponsorluk Başvurusu',
    subtitle: 'Sahne omurgasında görünürlük',
    paragraphs: [
      'Portal üzerinde standart reklam alanları (728×90 üst şerit ve 300×250 yan paneller) bulunur. Bu alanlar enstrüman, pedagoji ve sahne ekipmanı markalarına açılabilir.',
      'Başvuru için info@360bct.com adresine marka, dönem ve hedef kitle bilgisi gönderin. Uygun görülen iş birlikleri yayın takvimine alınır.',
      'Topluluk etkinlikleri ve eğitim duyuruları da sponsorluk kapsamında değerlendirilebilir.',
    ],
  },
  'kullanim-kosullari': {
    id: 'kullanim-kosullari',
    title: 'Kullanıcı Sözleşmesi',
    subtitle: 'Morpheus platform kuralları',
    paragraphs: [
      'Morpheus’u kullanarak kütüphaneyi kişisel ve sahne performansınız için kullanmayı kabul etmiş olursunuz. Ticari toplu kopyalama, içerik çalma veya otomatik tarama yasaktır.',
      'Hesap oluştururken verdiğiniz bilgilerin doğru olması gerekir. Üyelik seviyeleri (BASIC, PREMIUM, yönetici) bazı sahne araçlarını sınırlayabilir.',
      'Forum, etkinlik ve mağaza gönderileri topluluk kurallarına tabidir. Hakaret, yasa dışı içerik ve telif ihlali içeren paylaşımlar kaldırılabilir.',
      '360DESK, hizmeti geliştirmek veya bakım için geçici olarak durdurma hakkını saklı tutar.',
    ],
  },
  gizlilik: {
    id: 'gizlilik',
    title: 'Gizlilik Politikası',
    subtitle: 'Verilerinizin kullanımı',
    paragraphs: [
      'Giriş için e-posta ve şifre Supabase Auth üzerinde tutulur. Profil kaydında ad, e-posta ve üyelik seviyesi saklanır.',
      'Repertuvar listeleriniz yalnızca sizin oturumunuza aittir. Şarkı izlenme ve puan bilgileri kütüphane istatistiği olarak toplanır.',
      'Oturum çerezi kimlik doğrulama içindir. Üçüncü taraf analitik veya reklam çerezleri şu an zorunlu değildir; eklendiğinde bu metin güncellenir.',
      'Hesap silme talepleri info@360bct.com üzerinden iletilebilir.',
    ],
  },
  kvkk: {
    id: 'kvkk',
    title: 'KVKK & Çerezler',
    subtitle: '6698 sayılı Kanun aydınlatması',
    paragraphs: [
      'Veri sorumlusu: 360DESK Müzik Teknolojileri A.Ş. İşlenen başlıca veriler: kimlik (ad), iletişim (e-posta), üyelik ve kullanım kayıtları.',
      'Hukuki sebepler: sözleşmenin kurulması (üyelik), meşru menfaat (güvenlik, istatistik) ve açık rıza (isteğe bağlı iletişim).',
      'Haklarınız: KVKK m.11 kapsamında erişim, düzeltme, silme, itiraz ve veri taşınabilirliği. Taleplerinizi info@360bct.com adresine iletebilirsiniz.',
      'Zorunlu çerezler oturumu açık tutmak içindir. Tercih çerezleri ileride eklenecekse onay kutusu ile sunulacaktır.',
    ],
  },
  telif: {
    id: 'telif',
    title: 'Telif Hakları & Lisans',
    subtitle: 'İçerik ve sorumluluk',
    paragraphs: [
      'Şarkı sözleri ve besteler ilgili hak sahiplerine aittir. Morpheus, sahnede kullanım kolaylığı için akor ve söz yerleşimini gösterir; ticari nota satışı yapmaz.',
      'Hak sahibi olduğunuz bir eserin kaldırılmasını istiyorsanız başlık, sanatçı ve kanıt ile info@360bct.com adresine bildirin. İnceleme sonrası içerik yayından alınabilir.',
      'Kullanıcıların gönderdiği düzeltmeler ve forum yazıları gönderene aittir; platform bunları yayınlamak için sınırlı lisans alır.',
    ],
  },
  'akor-kilavuzu': {
    id: 'akor-kilavuzu',
    title: 'Akor Kılavuzu',
    subtitle: 'İçerik ekleme standartları',
    paragraphs: [
      'Akor satırı, sözün tam üzerine hizalanmalıdır. Satırın çoğu token’ı akor ise sistem onu akor satırı sayar.',
      'Ton bilgisi orijinal anahtarı (ör. Am, G) yansıtmalıdır. Transpoze sahne üzerinde yapılır; kütüphane kaydı orijinal tonda tutulur.',
      'Bölüm etiketleri ([Nakarat], [Solo]) köşeli parantezle yazılır. Capo ve BPM varsa metadata alanlarına girilir.',
      'Yanlış basım görürseniz parçanın altındaki düzeltme formunu kullanın. Onaylanan öneri yayına alınır.',
    ],
  },
  yardim: {
    id: 'yardim',
    title: 'Yardım & Teori Merkezi',
    subtitle: 'Sahneyi kullanmak',
    paragraphs: [
      'Soldan parça seçin. Ortada söz ve akorlar, üstte transpoze, punto ve enstrüman diyagramları (piyano, gitar, bas) vardır.',
      'Otomatik kaydırma sahnede eli serbest bırakır. AI Aranje, seçilen tarza göre akorları yeniden yazar; “Orijinal Akorlara Dön” ile geri alınır.',
      'Repertuvar listeleri giriş yaptıktan sonra oluşur. Sahne Modu ve tuner, üyelik seviyesine göre açılır.',
      'Daha fazla yardım için İletişim sayfasını veya forumu kullanın.',
    ],
  },
};
