# TOZRA v9 — Mobil Navigasyon Düzeltmesi

## Yapılanlar
- Tek `homePrimaryNav` navigasyonu uygulamanın ortak katmanında bırakıldı; beş sekme tüm uygulama sayfalarında erişilebilir.
- Sayfa değişiminde aktif sekme eşlemesi merkezi hale getirildi: Ana Sayfa, Sohbet, Projeler ve Stüdyo.
- Bu beş ana sekmeyle doğrudan eşleşmeyen sayfalarda yanlışlıkla Ana Sayfa sekmesinin seçili görünmesi düzeltildi.
- Profil düğmesi açıldığında Profil sekmesi aktif gösteriliyor.
- iPhone alt güvenli alanı için gezinme boşluğu ve sabit konum güçlendirildi.
- Karanlık temada gezinme çubuğunun arka planı, kenarlığı ve seçili sekme renkleri koyulaştırıldı.
- Azaltılmış hareket tercihine saygı korunuyor.

## Kontroller
- Tek `homePrimaryNav` HTML öğesi doğrulandı.
- İkinci `mobile-dock` HTML navigasyon öğesi bulunmadı.
- Kök JavaScript dosyaları ve HTML içindeki 10 inline script bloğu `node --check` ile sözdizimi kontrolünden geçti.
- Tam otomatik test paketi çalıştırılmadı; mevcut `package.json` test komutu `api/_context.js` ve `tests/` dosyalarına referans veriyor ancak bunlar bu pakette mevcut değil.
- Gerçek iPhone/Android cihaz testi bu ortamda yapılamadı.

## Değişiklik kapsamı
Yalnızca `index.html` ve bu not dosyası güncellendi. Diğer uygulama dosyaları ve iç içe arşivler korunmuştur.
