# TOZRA Native Mobile — Birleştirilmiş Modül Sürümü

Bu proje WebView değildir. React Native + Expo ile Android ve iOS için hazırlanmıştır. Web TOZRA'nın mevcut modülleri native ekran ve API entegrasyonlarıyla mobil uygulamaya taşınmıştır.

## Mobilde bulunan modüller

- **Hesap:** Supabase e-posta/şifre kayıt, giriş, oturum yenileme ve çıkış.
- **Ana sayfa:** Görev özeti, hızlı not, haftalık plan ve modül kısayolları.
- **TOZRA AI:** Mevcut `/api/chat` servisi, konuşma bağlamı, kişisel hafıza bağlamı, Agent modu, kaynak sonuçları.
- **Medya analizi:** Galeriden görsel/video seçme, kamerayla fotoğraf/video çekme, videodan üç kronolojik kare çıkarma ve mevcut görsel analiz API'sine gönderme. API'nin 15 görüntü sınırı korunur.
- **Projeler:** Proje oluşturma, kategori, açıklama, hedef, kilometre taşları, proje görevleri, notlar ve AI ile proje üzerinde çalışma.
- **Creative Studio:** Fikir, görsel, video storyboard, marka, içerik ve kampanya çalışma modları. Görsel modu mevcut `/api/generate-image` servisini kullanır.
- **Görevler & Takvim:** Aylık takvim, gün seçimi, görev/etkinlik ekleme, öncelik, tamamlama ve silme.
- **TOZRA Web:** Mobil ekrandan web sitesi briefi hazırlama ve TOZRA AI sohbetine aktarma. Tam kod editörü ve canlı önizleme web sürümündedir.
- **Sesli giriş:** Mikrofonla kayıt ve mevcut `/api/transcribe` servisiyle konuşmayı metne çevirme.
- **Kişisel hafıza:** Kullanıcının eklediği bağlam kayıtları ve hassas bilgileri engelleyen temel filtre.
- **Bulut senkronizasyonu:** Web projesinin kullandığı `public.user_data` tablosu ve aynı JSON anahtarlarıyla projeler, görevler, takvim, notlar, haftalık plan, sohbet ve hafıza verilerinin hesap bazında eşitlenmesi. Tablo/RLS kurulumu yoksa cihaz içi kayıt devam eder ve senkronizasyon hatası konsola yazılır.

## Önemli kapsam notları

- Atlas, Nexus, Universe, Market ve Social modülleri web sürümünde bulunur; bu kaynak paketinde ayrı native ekranlar olarak henüz taşınmamıştır.
- Web'deki WebRTC gerçek zamanlı çift yönlü sesli sohbet bu sürümde native WebRTC olarak taşınmadı. Mobilde mikrofon kaydı → sunucu transkripsiyonu → yazılı AI sohbet akışı vardır.
- Video Studio web sürümünde olduğu gibi senaryo/storyboard/üretim planı oluşturur; doğrudan video render etmez.
- Harici servis anahtarları uygulama içine konulmaz. AI, görsel, transkripsiyon ve Atlas sunucu ayarları mevcut `tozra.com.tr` API'lerinden alınır.

## Kurulum

Bu arşivde mobil kaynakların önceki eksik `src/` ve `assets/` dosyaları tamamlandı. Ana ekran daha kapsamlı bir Creative Workspace düzenine geçirildi.

Node.js 22 veya üzeri gerekir. Paket bağımlılıklarını kurduktan sonra Expo SDK uyumluluğunu `npx expo install --fix` ile eşitle.

```bash
npm install
npx expo install expo-audio expo-file-system expo-image-picker expo-image-manipulator expo-video-thumbnails react-native-maps
npx expo-doctor
npx expo start
```

Expo Go ile ilk ekran/işlev kontrolleri yapılabilir. Mikrofon, medya ve harita özelliklerinin son doğrulaması için development build önerilir.

## Android / iOS derleme

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

Android standalone harita için Google Maps API anahtarını EAS ortam değişkeni olarak `GOOGLE_MAPS_API_KEY` adıyla tanımla. iOS harita varsayılan Apple Maps sağlayıcısını kullanır. iOS App Store derlemesi için Apple Developer üyeliği gerekir.

## Supabase bulut senkronizasyonu

Web projesinin `CLOUD_SYNC_KURULUM.md` ve `TOZRA_CLOUD_SYNC_STAGE1.sql` dosyalarında tanımlanan `public.user_data` tablosu ve kullanıcıya özel RLS politikaları gerekir. Mobil uygulama `user_data` tablosunda yalnızca oturum açmış kullanıcının kendi `user_id` satırını okur/yazar. `service_role` anahtarı mobil uygulamaya eklenmez.

## Test durumu

- Web projesinin mevcut regresyon paketi bu çalışma sırasında çalıştırıldı ve geçti.
- Mobil JavaScript kaynak dosyasında sözdizimi kontrolü yapıldı.
- Bu çalışma ortamında Expo bağımlılıkları kurulamadı; `expo install` işlemi zaman aşımına uğradı. Bu nedenle Expo Doctor, Android/iOS derlemesi ve gerçek cihaz testi **henüz doğrulanmış değildir**.
