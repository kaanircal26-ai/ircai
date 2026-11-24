# TOZRA Mobile 1.5.1

Bu klasör React Native + Expo tabanlı yerel iOS/Android uygulamasıdır; WebView değildir.

## Kurulum

1. Node.js 20 veya üzerini kur.
2. Bu klasörde `npm install` çalıştır.
3. Paket sürümlerini Expo SDK ile doğrulamak için `npx expo install --fix` çalıştır.
4. `npx expo-doctor` ile proje kontrollerini yap.
5. `npx expo start -c` komutunu çalıştırıp QR kodunu Expo Go ile okut. Native modül uyumsuzluğu çıkarsa EAS development build gerekir.

## Sunucu bağlantısı

Supabase URL ve public client key uygulamaya yazılmaz. Uygulama bunları `https://tozra.com.tr/api/config` adresinden alır. Vercel ortam değişkenlerinde `SUPABASE_URL` ve `SUPABASE_PUBLISHABLE_KEY` (veya `SUPABASE_ANON_KEY`) tanımlı olmalıdır. `SUPABASE_SECRET_KEY` mobil uygulamaya eklenmemelidir.

## Mevcut mobil ekranlar

Ana Sayfa, TOZRA AI, Projeler, Creative Studio, Görevler/Takvim, TOZRA Web brief alanı ve Hesap. Web sürümünde bulunan Atlas, Nexus, Universe, Market ve Social bu `App.js` sürümünde ayrı mobil ekranlar olarak yer almıyor; sonraki geliştirme aşamalarında ele alınacak.

## Notlar

- `src/supabase.js` mevcut `/api/config` endpoint'inden güvenli istemci yapılandırmasını alır ve oturumu AsyncStorage üzerinde saklar.
- `src/theme.js` mobil tema renklerini tek noktadan yönetir.
- `assets/` klasörü Expo uygulama ikonu, Android adaptive icon ve açılış görselini içerir.
- Açılış animasyonu 4,7 saniyedir.
- Bu paketleme ortamında `npm install` zaman aşımına uğradı; bu nedenle Expo Doctor, native derleme ve gerçek cihaz testi henüz yapılmış değildir.
