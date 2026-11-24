# TOZRA Mobile 1.9 — TOZRA Connect UI

## Bu sürüm
- Ana mobil gezinmeye Connect sekmesi eklendi.
- Connect alanında Keşfet, Takip, Mesajlar ve Toplantılar bölümleri tasarlandı.
- Yaratıcı profil kartları, arama alanı, takip/takibi bırak etkileşimi eklendi.
- Takip seçimleri kullanıcı bazlı yerel depolamaya ve mevcut `user_data` senkronizasyonuna eklendi.
- Profil fotoğrafı seçme özelliği önceki sürümden korundu.
- Mevcut ana modüller ve API akışları yeniden yazılmadı.

## Önemli sınırlar
Bu paket Connect'in mobil arayüz prototipidir. Keşfet bölümündeki profiller örnek tasarım verisidir; gerçek kullanıcı dizini değildir.
Gerçek kullanıcı arama/takip, arkadaşlık istekleri, mesajlaşma, bildirim ve görüntülü toplantı için Supabase tablo/RLS politikaları ve gerçek zamanlı mesajlaşma/video sağlayıcısı ayrıca kurulmalıdır.
Mesajlar ve Toplantılar sekmeleri bu entegrasyonlar tamamlanana kadar bilgilendirme/planlama ekranıdır.

## Test
Bu kaynak paketi cihaz üzerinde Expo Go ile test edilmiş değildir. Kurulum:
1. `npm.cmd install`
2. `npx.cmd expo install --fix`
3. `npx.cmd expo-doctor`
4. `npx.cmd expo start -c`
