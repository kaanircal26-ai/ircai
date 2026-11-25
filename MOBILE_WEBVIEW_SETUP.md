# TOZRA Mobile — Web parity build

Bu sürüm, ayrı React Native ekranları göstermek yerine yayındaki TOZRA web uygulamasını mobil uygulamanın içinde açar.

- Uygulama başlangıç adresi: https://ircai.vercel.app/
- Mobil içerik: Android/iOS WebView
- JavaScript ve DOM storage açık
- Oturum çerezleri paylaşılır
- Android geri tuşu web gezinme geçmişini kullanır
- Aşağı çekerek yenileme açıktır
- Ağ hatasında yeniden deneme ekranı gösterilir

## Test

1. ZIP'i tamamen çıkar.
2. Proje klasöründe terminal aç.
3. `npm.cmd install`
4. `npx.cmd expo start -c`
5. Expo Go ile QR kodu okut.

`react-native-webview` bu projenin package.json ve package-lock.json dosyalarında zaten bulunur.

## Önemli

Bu sürümde TOZRA'nın arayüzü Vercel'den yüklenir. Bu nedenle web sitesinde yayınlanan tasarım ve özellikler mobil uygulamada da aynı kaynaktan görünür. Web sitesi veya onun API uç noktaları erişilemiyorsa uygulama da bağlantı hatası gösterir. Bu çalışma ortamından `ircai.vercel.app` DNS çözümlemesi yapılamadığı için canlı sunucuya uçtan uca erişim testi gerçekleştirilemedi; gerçek telefon testinde Wi-Fi/mobil veri ile doğrulanmalıdır.
