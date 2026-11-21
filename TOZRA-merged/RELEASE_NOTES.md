# TOZRA Birleştirilmiş Sürüm — Değişiklikler

## Korunanlar
- Ana `index.html` içindeki orijinal koyu siyah-yeşil Creative Intelligence arayüzü.
- Ana sürümdeki proje oluşturma, proje sohbeti, genel sohbet, dosya ekleri ve mevcut tarayıcı ses yakalama akışı.
- Ana sürümün API endpointleri, logo ve uygulama simgeleri.

## Entegre edilenler
- vNext Supabase auth istemcisi ve hesap akışı.
- E-posta/şifre ile giriş ve kayıt.
- Şifre sıfırlama, doğrulama e-postasını tekrar gönderme ve şifre güncelleme.
- Profil ekranında gerçek hesap bilgisi ve çıkış.
- Sohbet/proje geçmişinin kullanıcıya göre yerel depolama alanında ayrılması.
- İlk girişte eski misafir verilerini kullanıcı alanına taşıma.
- Sohbet ve ses transkripsiyonu API isteklerine Bearer token eklenmesi.
- Ana sürümün gelişmiş Memory v2 modülü ve ilgili hafıza verilerinin sohbet API'sine gönderilmesi.
- Service Worker önbellek sürümünün yenilenmesi.

## Henüz yapılmayanlar
- Premium ödeme sağlayıcısı ve sunucu tarafı abonelik kontrolü.
- Proje ve sohbetlerin tam Supabase bulut senkronizasyonu.
- Çoklu video/görsel karelerini parçalara ayırarak analiz etme.
- Canlı cihazlarda uçtan uca iOS/Android testleri.
