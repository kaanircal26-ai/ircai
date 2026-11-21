# TOZRA Advanced Memory v2 — Bulut bağlantısı

Bu sürüm, Akıllı Hafıza ekranını Supabase `user_memories` tablosuna bağlar. SQL dosyası önceki kurulumda çalıştırıldıysa yeniden çalıştırman gerekmez.

## GitHub'a yükleme
1. ZIP'i aç. İçindeki `ircai-main` klasörünün içeriğini GitHub'daki ana proje köküne yükle.
2. Özellikle `index.html` ve `memory.js` dosyalarının değiştiğinden emin ol. `api/` klasörünü ve diğer mevcut dosyaları koru.
3. Commit changes yap ve Vercel dağıtımının tamamlanmasını bekle.

## Bulut senkronizasyonu testi
1. TOZRA hesabına giriş yap.
2. Akıllı Hafıza ekranında bir tercih kaydet.
3. Durum satırında “Hafıza hesabınla buluta senkronize.” yazmalı.
4. Supabase → Table Editor → `user_memories` tablosunda aynı `content` kaydını kontrol et.
5. Sayfayı yenile; kayıt ekranda kalmalı. Aynı hesapla başka cihazda da görünmeli.

## Güvenlik ve davranış
- Tarayıcıya yalnızca mevcut Supabase publishable/anon anahtarı kullanılır; `service_role` anahtarı gerekmez ve eklenmemelidir.
- RLS politikaları her kullanıcının yalnızca kendi kayıtlarını görmesini sağlar.
- Giriş yoksa hafıza yalnızca cihazda saklanır; arayüz durumu bunu açıkça belirtir.
- Sohbet isteğine yalnızca mesajla eşleşen en fazla 12 hafıza kaydı eklenir.
- Bu sürüm, sohbetlerden otomatik bilgi çıkarıp kaydetmez; kayıtları kullanıcı Akıllı Hafıza ekranından yönetir.
