# TOZRA Memory 2.0 — Değişiklikler

## Bu sürümde
- Proje sohbetinde proje bağlamı artık API isteğinin ayrı `projectContext` alanıyla gönderilir.
- Proje bağlamı; proje adı, kategori, açıklama, hedef, yol haritası, görevler ve notları içerir.
- Genel sohbette kullanıcı açıkça bir proje/TOZRA bağlamından söz ettiğinde eşleşen proje veya seçili proje bağlamı gönderilebilir.
- Kişisel hafıza, mesajla alakalı kayıtları seçmek için `getRelevant()` fonksiyonunu kullanır; en fazla 12 kayıt gönderilir.
- Kalıcı tercih/hedef olabilecek bazı mesajlarda hafızaya kaydetme önerisi çıkar. Kayıt yalnızca kullanıcı düğmeye basarsa yapılır.
- Hafızaya gizli veya belirli hassas kişisel bilgi örüntüleri içeren kayıtlar engellenir.
- `memory.js` önbellek sürümü `v=3` olarak güncellendi.
- Mevcut hesap bazlı `user_data` bulut senkronizasyonu korunmuştur.

## Korunanlar
- Mevcut tasarım ve gezinme yapısı
- Mevcut sohbet geçmişi
- Proje kayıtları ve görevleri
- Mevcut Supabase oturum sistemi
- Mevcut Groq/Tavily API bağlantısı

## Dağıtım
Bu arşiv, daha önceki `TOZRA-v9-ai-motor-asama1.zip` sürümünün üzerine hedefli değişiklikler içerir.
Proje köküne yalnızca arşivdeki `ircai-main` klasörünün içeriği yerleştirilmelidir.
GitHub'a yüklemeden önce mevcut sürümün yedeği alınmalıdır.

## Doğrulama
- `memory.js` Node.js sözdizimi kontrolü: başarılı
- Ana uygulama inline JavaScript sözdizimi kontrolü: başarılı
- `inline-0.js` sözdizimi kontrolü: başarılı
- `api/chat.js` sözdizimi kontrolü: başarılı
- Hafıza API birim kontrolü (ekleme, alakalı kayıt seçimi, gizli bilgi engeli): başarılı
- Gerçek Groq/Supabase/Vercel uçtan uca testi: henüz yapılmadı; dağıtım sonrası kullanıcı hesabıyla test edilmeli.
