# TOZRA Vision / API Hata Yönetimi Düzeltmesi

## Değişiklikler
- Aktif `index.html` medya hazırlama akışı, Groq Qwen 3.8 27B'nin istek başına desteklediği en fazla 3 görüntüyle sınırlandı.
- Fotoğraf ve video kareleri aynı 3 görüntülük bütçeyi paylaşır. İstek bu sınırı aşacaksa medya sessizce atlanmak yerine açıklayıcı bir hata gösterilir.
- `api/chat.js` tarafında görüntü sayısı sınırı 15'ten 3'e çekildi.
- Base64 görüntü yükü için sunucu tarafı toplam sınırı 3.000.000 karakter olarak ayarlandı.
- Groq hataları loglara yalnızca durum/kod/tür ve kısaltılmış hata metniyle yazılır; kullanıcı içeriği veya görsel verisi loglanmaz.
- Boş model yanıtları ve çıktı sınırına ulaşma durumu ayrı hata mesajlarıyla ele alınır.
- Başarılı yanıtta `finishReason` bilgisi döndürülür.
- Sohbet API testlerine görsel aktarımı ve 3 görsel üst sınırı testleri eklendi.

## Testler
- `npm run check` başarılı.
- Aktif `index.html` içindeki satır içi JavaScript sözdizimi kontrolü başarılı.
- ZIP bütünlük kontrolü başarılı.

## Sınırlar
- Bu paket, gerçek Groq hesabına bağlanarak canlı görsel isteği çalıştırmaz. Canlı test için Vercel ortamındaki `GROQ_API_KEY` ve dağıtım gereklidir.
- Groq Qwen 3.8 27B bir istekte en fazla 3 görsel kabul eder. Bu nedenle tek bir istekte 15 kare gönderimi devre dışıdır. Daha fazla kareyi birden fazla API çağrısıyla analiz etmek maliyet ve istek sınırlarını artırabileceğinden bu pakette otomatik çoklu çağrı eklenmemiştir.
- Önceki çalışan arayüz, kimlik doğrulama, sohbet ve diğer özellikler korunmuştur; yalnızca aktif kök `index.html`, `api/chat.js` ve test dosyası değiştirilmiştir.
