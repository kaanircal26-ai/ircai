# TOZRA Performans ve Kararlılık — Aşama 4

## Değişiklik
- Bulut senkronizasyonu yazmaları tek uçuş (single-flight) mantığıyla sıraya alındı.
- Bir senkronizasyon devam ederken yeni kayıt isteği gelirse aynı anda ikinci bir upsert başlatılmıyor.
- Devam eden kayıt sırasında yeni değişiklik oluşursa son veri görüntüsü için bir takip yüklemesi yapılıyor.
- Böylece eşzamanlı bulut yazmalarının eski bir veri görüntüsünü daha yeni verinin üzerine yazma riski azaltılıyor.
- Mevcut 700 ms birleştirme gecikmesi, veri şeması, Supabase tablosu ve kullanıcı arayüzü korundu.

## Doğrulama
- `node --check inline-0.js`
- `npm run check`
- Atlas yapılandırma testleri: başarılı
- Hafıza testleri: başarılı
- Sohbet kalite testleri: başarılı
- ZIP arşiv bütünlüğü: başarılı

## Sınırlar
Bu aşamada gerçek Supabase ağı üzerinde eşzamanlı yazma yük testi, Vercel dağıtımı veya iPhone/Android cihaz testi yapılmadı. Bu nedenle canlı performans artışı ölçülmüş değildir; yapılan değişiklik yarış koşullarını ve gereksiz paralel yazmaları önlemeye yöneliktir.
