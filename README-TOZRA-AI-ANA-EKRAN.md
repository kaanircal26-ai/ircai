# TOZRA AI ana ekran yenilemesi

Bu paket, mevcut TOZRA Mobile SDK 58 aktarım paketinin üzerine hazırlanmıştır.

- Açılış animasyonunda uygulamanın mevcut TOZRA ikon görseli kullanılır; logo merkezde büyüyerek görünür.
- Ana ekranda TOZRA AI karşılama alanı, mesaj kutusu, hızlı başlangıç kartları ve Creative Studio/Projeler kısayolları bulunur.
- Sohbet, Studio, Projeler, Takvim, TOZRA Web, Connect, Profil, Supabase Auth, yerel kayıt ve bulut senkronizasyonu gibi mevcut ekran ve servis kodları korunmuştur.

## Uygulama
1. Proje klasörünü yedekle.
2. ZIP içindeki `tozra-sdk58-overlay/App.js` dosyasını proje kökündeki `App.js` ile değiştir.
3. ZIP içindeki `assets/icon.png` dosyasını proje kökündeki `assets/icon.png` ile eşleştir (aynı TOZRA simgesi).
4. Projede README'deki SDK 58 paketlerinin kurulu olduğundan emin ol.
5. `npx.cmd expo start -c` ile başlat.

Not: Bu arşiv mevcut kaynakların üzerinde düzenleme içerir; gerçek iPhone/Android cihazında çalıştırma testi bu ortamda yapılamadı.
