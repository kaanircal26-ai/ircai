# TOZRA Mobile 1.3

Bu paket, TOZRA'nın React Native + Expo mobil uygulamasıdır. WebView sarmalayıcısı değildir.

## Kurulum

1. Bilgisayarda Node.js LTS kurulu olmalı.
2. Bu klasörde terminal açıp `npm install` çalıştır.
3. Ardından `npx expo start -c` çalıştır.
4. Expo Go ile QR kodu okut. Native modül veya SDK uyumsuzluğu görülürse EAS development build gerekir.

## Ekranlar

Ana Sayfa · TOZRA AI · Projeler · Creative Studio · Görevler & Takvim · Atlas · Nexus · Universe · Market · Social · Web Studio · Hesap.

## Servis yapılandırması

Supabase URL ve publishable/anon key, uygulamaya gömülmez. Native uygulama bunları mevcut `https://tozra.com.tr/api/config` endpoint'inden alır. Vercel tarafında `SUPABASE_URL` ve `SUPABASE_PUBLISHABLE_KEY` (veya mevcut `SUPABASE_ANON_KEY`) tanımlı olmalıdır. `SUPABASE_SECRET_KEY` mobil uygulamaya eklenmemelidir.

## Gerçekleştirilen işlevler

- Atlas: kişisel keşif kaydı, arama, katman tercihi ve AI araştırma aktarımı. Bu pakette gerçek harita sağlayıcısı ve canlı konum entegrasyonu yoktur.
- Nexus: fikir düğümleri, proje düğümleri, arama ve ilişkileri ekleme/silme.
- Universe: projeler ve fikirler için Galaxy/Constellation görünümü, seçilen projeye geçiş.
- Market: 20 TOZRA Originals şablonu, kategori/arama, favoriler ve AI ile şablon kullanımı. Ödeme veya herkese açık satıcı pazarı yoktur.
- Social: marka çalışma alanları, içerik taslağı, platform/format, yayın tarihi ve taslak/planlandı kuyruğu. OAuth, otomatik yayınlama ve platform analitiği yoktur.
- Yeni modül verileri hesap bazlı yerel depolama ve `user_data` JSON kaydı üzerinden saklanır.

## Doğrulama sınırı

Kaynak yapısı, ekran/navigasyon kontrolleri ve JSX sözdizimi kontrol edildi. Bu çalışma ortamında npm paketleri indirilemedi; Expo Doctor, Android/iOS derlemesi ve fiziksel cihaz testi yapılmadı. Bu nedenle cihazda çalıştığı doğrulanmış gibi sunulmamaktadır.
