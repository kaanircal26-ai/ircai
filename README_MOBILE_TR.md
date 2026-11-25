# TOZRA Mobile — Native iOS / Android

Bu proje React Native + Expo tabanlı yerel mobil uygulamadır; WebView içine sarılmış web sitesi değildir. Web sürümü `index.html` ve ilişkili istemci dosyalarında, native mobil uygulama `App.js` ve `src/` altında bulunur.

## Mevcut mobil ekranlar

- Ana Sayfa
- TOZRA AI sohbet
- Projeler
- Creative Studio
- Görevler & Takvim
- TOZRA Nexus
- TOZRA Universe
- TOZRA Market
- TOZRA Social
- TOZRA Web Builder
- Profil / Hesap

Alt gezinme web uygulamasının beş ana sekmesini izler: Ana Sayfa, Sohbet, Projeler, Stüdyo, Profil. Diğer modüller üst çubuktaki menüden açılır.

## Kurulum

1. Node.js 20 veya üzerini kur.
2. Proje klasöründe `npm install` çalıştır.
3. Expo paket uyumluluğunu doğrulamak için `npx expo install --fix` çalıştır.
4. `npx expo-doctor` ile proje kontrollerini yap.
5. `npx expo start -c` komutunu çalıştırıp QR kodunu Expo Go ile okut. Native modül uyumsuzluğu çıkarsa EAS development build gerekir.

## Sunucu bağlantısı

Supabase URL ve public client key uygulamaya gömülmez. Uygulama bunları `https://tozra.com.tr/api/config` adresinden alır. Vercel ortam değişkenlerinde `SUPABASE_URL` ve `SUPABASE_PUBLISHABLE_KEY` (veya `SUPABASE_ANON_KEY`) tanımlı olmalıdır. `SUPABASE_SECRET_KEY` mobil uygulamaya eklenmemelidir.

## Parite notu

Bu sürümde ana sayfanın içerik sırası ve beş sekmeli alt gezinme web mobil referansına yaklaştırıldı. Diğer modüller native bileşenlerle çalışır; tüm ekranların piksel düzeyinde birebir olduğu henüz iddia edilmemektedir. Canlı sesli WebRTC, bazı tarayıcıya özgü etkileşimler ve gerçek cihaz görünüm testleri ayrıca tamamlanmalıdır. Ayrıntılar için `PORTING_AUDIT.md` dosyasına bak.
## Web ile mobil gezinme eşleştirmesi

- Ana gezinme: Ana Sayfa, Sohbet, Projeler, Stüdyo ve Profil.
- Diğer çalışma modülleri üst menüdeki TOZRA modülleri alanından açılır: Görevler & Takvim, Nexus, Universe, Market, Social ve TOZRA Web.
- 25.11.2026 parity aşamasında alt gezinme yüzen/yuvarlatılmış yapıya alındı ve ana ekrana yerel tarih eklendi. Ayrıntılı ekran eşleştirmesi ve gerçek cihaz testleri sonraki QA aşamasındadır.
