# TOZRA Mobile 1.4.0 — UI yenilemesi

## Bu sürümde gerçekten değişenler
- Ana ekran yeniden düzenlendi: tarih/çalışma alanı üst satırı, yaratıcı merkez alanı, görev özeti, ilerleme çubuğu ve 10 modüle doğrudan erişim eklendi.
- Günlük odak, not defteri ve haftalık plan aynı ekranda daha belirgin bölümlere ayrıldı.
- Ana ekranın tüm yeni kartları mevcut görev, proje, not ve haftalık plan verisini kullanır; yeni sahte/örnek veri eklemez.
- Ortak native tasarım sistemi güncellendi: başlık hiyerarşisi, kart köşeleri, sohbet balonları, Studio mod seçicileri, proje kartları ve gezinme yüzeyi.
- Atlas, Nexus, Universe, Market ve Social modülleri önceki sürümdeki ayrı native ekranları ve işlevleriyle korunmuştur.
- Marka vurgusu neon/lime yerine antrasit, sıcak gri ve şampanya tonlarında tutulmuştur.
- Paket sürümü 1.4.0 olarak güncellendi.

## Korunan işlevler
- Supabase Auth ve `user_data` senkronizasyonu
- AsyncStorage yerel kayıtları
- TOZRA AI sohbeti, medya seçimi ve sesli giriş akışı
- Projeler, Creative Studio, takvim/görevler, TOZRA Web
- Workspace modüllerinin yerel kayıt yapısı

## Test durumu
- TypeScript parser ile App.js, WorkspaceModules.js, supabase.js ve theme.js JSX/JS sözdizimi kontrolü yapıldı.
- Yerel import yolları kontrol edildi.
- Gerçek Expo derlemesi ve fiziksel iOS/Android testi bu çalışma ortamında henüz doğrulanmadı.
