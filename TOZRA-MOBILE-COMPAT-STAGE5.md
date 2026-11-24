# TOZRA Mobil ve Masaüstü Uyumluluk — Aşama 5

## Düzeltilen mevcut davranış
- iOS/WebKit MediaRecorder tabanlı sesli sohbet yolunda, yapay zekâ yanıt isteği başarısız olduğunda yeniden başlatılan dinleme akışı yanlışlıkla SpeechRecognition API'sine yönleniyordu. Akış artık oturumun MediaRecorder veya SpeechRecognition moduna göre doğru kayıt yöntemini yeniden başlatıyor.
- Tarayıcı konuşma sentezi hata verdiğinde sesli sohbet dinleme döngüsü durabiliyordu. Hata sonrası mevcut ses giriş yöntemi kontrollü gecikmeyle yeniden başlatılıyor.
- Bazı WebKit sürümlerinde açık MIME türü ipuçları MediaRecorder oluşturulurken reddedilebiliyor. Açık MIME seçimi başarısız olursa tarayıcının varsayılan kayıt biçimiyle ikinci kez deneniyor.
- Güncellenen ses dosyasının eski Service Worker önbelleğinden sunulmaması için ses dosyası sürümü ve TOZRA önbellek sürümü artırıldı.

## Korunanlar
- Yeni kullanıcı özelliği eklenmedi.
- Görsel tasarım, gezinme yapısı, API uç noktaları ve veri şemaları değiştirilmedi.
- Sesli sohbetin mevcut MediaRecorder ve SpeechRecognition yolları korundu.

## Yerel doğrulama
- `node --check voice.js`
- `npm run check`
- Atlas yapılandırma testleri: başarılı
- Hafıza testleri: başarılı
- Sohbet kalite testleri: başarılı
- Mobil sesli sohbet regresyon testleri: başarılı

## Doğrulama sınırı
Bu ortamda gerçek iPhone/iPad, Android cihaz, mikrofon izin pencereleri, mobil ağ ve canlı Vercel/Supabase servisleri üzerinde fiziksel cihaz testi yapılamadı. Bu nedenle iOS sesli sohbet sorununun gerçek cihazda tamamen çözüldüğü iddia edilmez; tespit edilen kod akışı hataları giderilmiş ve regresyon testleri eklenmiştir.
