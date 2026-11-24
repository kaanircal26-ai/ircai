# TOZRA Mobile 1.3 — gerçek kaynak değişiklikleri

## Bu pakette gerçekten eklenenler
- Eksik `src/theme.js` ve `src/supabase.js` dosyaları eklendi. Önceki App.js bu dosyaları import ediyordu ancak kaynak ZIP'te yoklardı.
- Expo için `package.json` ve gerekli native bağımlılık listesi eklendi.
- `assets/icon.png`, `assets/adaptive-icon.png` ve `assets/splash.png` üretildi.
- Ana mobil navigasyona Atlas, Nexus, Universe, Market ve Social girişleri eklendi.
- Atlas: gerçek native harita görünümü, koordinatla konum kaydetme, işaretçi gösterme ve kayıt silme.
- Nexus: fikir/proje/araştırma düğümleri oluşturma, düğümler arası bağlantı ve arama.
- Universe: yaratıcı evren/koleksiyon oluşturma ve kart görünümü.
- Market: yerel başlangıç şablon kataloğu, kategori/arama, favori ve proje oluşturma.
- Social: sosyal içerik kartları, kanal seçimi, tarih, durum ve yayın akışı yönetimi.
- Yeni modüllerin kayıtları AsyncStorage ve `user_data` JSON alanındaki `tozra-mobile-workspace-v1` anahtarıyla saklanır.
- Renk sistemi nötr antrasit, kırık beyaz ve şampanya tonlarına taşındı; neon/lime vurgu kullanılmadı.

## Açıkça tamamlanmamış / harici yapılandırma isteyenler
- Atlas'ta serbest metin adres araması ve yer sağlayıcısı bağlı değildir; konumlar koordinat ile kaydedilir. Android harita için Google Maps API key gerekir. iOS Apple Maps sağlayıcısını kullanır.
- Market, ödeme alan gerçek bir mağaza değildir; bu sürümde yerel şablon kataloğudur.
- Social, içerik planlayıcısıdır; Instagram/TikTok vb. platformlara otomatik gönderi yapmaz.
- Nexus bağlantıları ve Universe koleksiyonları yerel etkileşimli çalışma alanlarıdır; otomatik AI grafiği/3D dünya değildir.
- Expo bağımlılık kurulumu bu çalışma ortamında zaman aşımına uğradı. Bu nedenle gerçek Expo derlemesi, Expo Doctor ve cihaz testi yapılmadı.

## Kurulum
1. Node.js 20+ kur.
2. Proje klasöründe `npm install` çalıştır.
3. `npx expo-doctor` çalıştır.
4. Android harita için `GOOGLE_MAPS_API_KEY` ortam değişkenini tanımla.
5. `npx expo start` ile Expo Go'da başlat. Harita ve native izinleri son olarak development build üzerinde doğrula.

Supabase yapılandırması `https://tozra.com.tr/api/config` üzerinden alınır. Sunucuda `SUPABASE_URL` ve `SUPABASE_PUBLISHABLE_KEY` (veya `SUPABASE_ANON_KEY`) tanımlı olmalıdır.
