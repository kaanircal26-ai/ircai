# TOZRA AI ve Hafıza — Aşama 2

## Değişiklikler
- Sohbet geçmişi bağlam penceresi 10 mesajdan 16 mesaja çıkarıldı.
- Yanıt üretim bütçesi 1.400'den 4.096 completion token'a çıkarıldı.
- Hafıza eşleştirmesi tam kelime ağırlıklı hâle getirildi.
- İstekle eşleşmeyen hafıza kayıtları artık otomatik olarak son kayıtlardan seçilmiyor; ilgisiz hafıza bağlamı gönderilmiyor.
- Sistem yönergesi, hafıza içeriğinin talimat değil güvenilmeyen bağlam verisi olduğunu daha açık tanımlıyor.
- Mevcut hafıza API'sini doğrulayan otomatik test eklendi.

## Korunanlar
- Model ve sağlayıcı değiştirilmedi.
- Kişisel hafıza arayüzü ve kayıt formatı değiştirilmedi.
- Hesap doğrulama ve bulut senkronizasyon akışı değiştirilmedi.
- Yeni kullanıcı özelliği eklenmedi.

## Doğrulama
- `npm run check` ile mevcut JavaScript kontrolleri, Atlas yapılandırma testi ve hafıza testi çalıştırılmalıdır.
- Canlı Groq/Supabase bağlantısı ve gerçek kullanıcı hesabı olmadan üretim servisi doğrulanmış sayılmaz.
