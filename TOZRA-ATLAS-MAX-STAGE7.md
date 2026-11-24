# TOZRA Atlas Maximum — Aşama 7

## Kapsam
Yalnızca mevcut Atlas modülündeki harita motoru, katmanlar, konum araması ve mevcut keşif ekranlarının dayanıklılığı iyileştirildi. Yeni modül veya menü eklenmedi.

## Yapılan iyileştirmeler
- Cesium ion yapılandırması tek-uçuş (single-flight) hale getirildi; eşzamanlı çağrılar aynı isteği paylaşır.
- Yapılandırma isteği başarısız olursa durum hatalı biçimde kalıcı olarak kilitlenmez; sonraki denemede yeniden alınabilir.
- Uydu/topoğrafik/sokak haritası seçimi ve katman görünürlük tercihleri cihazda saklanır.
- 3D arazi ve 3D bina yüklemeleri yarış koşullarına karşı korundu. Kullanıcı yükleme sırasında katmanı kapatırsa geç gelen sonuç haritaya eklenmez.
- Arazi ve bina katmanı hata mesajları token, izin ve bağlantı kontrolünü daha açık belirtir.
- Önceden etkinleştirilen arazi/bina katmanları sonraki oturumda yeniden yüklenir.
- Aynı konum sorgusu bellekte önbelleğe alınır; Nominatim aramaları arasında en az 1,1 saniye beklenir.
- Konumum işlevi tekrar kullanıldığında eski arama/konum işaretçileri temizlenir.
- Ülke araması ülkenin resmî adını da kapsar ve ülke verileri henüz gelmediyse yükleme tamamlanınca filtreyi uygular.
- Atlas için regresyon kontrolleri `npm run check` akışına eklendi.

## Korunanlar
- Mevcut Atlas sekmeleri, görünüm ve veri kaynakları korundu.
- Cesium, Esri, OpenStreetMap, Natural Earth, REST Countries, Wikidata ve GDELT kaynakları değiştirilmedi.
- TOZRA'nın diğer modülleri değiştirilmedi.

## Testler
- `node --check atlas.js`
- Atlas yapılandırma testi
- Atlas çalışma zamanı regresyon testi
- Hafıza, sohbet kalitesi, mobil ses ve ana HTML inline JavaScript testleri

## Canlı doğrulama sınırı
Bu paket yerel kod ve regresyon testlerinden geçti. Cesium ion tokeninin gerçek izinleri, Vercel dağıtımı, harita sağlayıcılarının ağ yanıtları ve gerçek iPhone/Android cihaz performansı bu ortamda doğrulanmadı. Canlı haritada arazi/bina katmanları için Cesium ion tokeninin uygun asset erişimleri ve izinli domain/referrer ayarları gerekir.
