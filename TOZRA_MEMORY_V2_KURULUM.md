# TOZRA Memory 2.0 — Kullanım ve bulut senkronizasyonu

Bu sürüm, kişisel hafızayı `memory.js` üzerinden yönetir. Kayıtlar önce hesaba özel
tarayıcı depolama alanına yazılır; oturum açılmışsa mevcut `TozraCloudSync` mekanizması
bu veriyi `public.user_data` tablosundaki hesap verisiyle senkronize eder.

## Önemli tablo bilgisi
- Çalışan uygulama kodu `public.user_data` tablosunu kullanır.
- `public.user_memories` tablosu bu sürümün sohbet akışında kullanılmaz.
- Bu nedenle yalnızca hafıza özelliğini etkinleştirmek için `TOZRA_MEMORY_V2_SUPABASE.sql`
  dosyasını çalıştırmak gerekmez.
- `user_data` tablosu için `TOZRA_CLOUD_SYNC_STAGE1.sql` ve `CLOUD_SYNC_KURULUM.md`
  dosyalarındaki kurulum/RLS koşulları geçerlidir.
- Tarayıcıya `service_role` anahtarı eklenmemelidir.

## Hafıza davranışı
- Kayıtlar Akıllı Hafıza ekranından kullanıcı tarafından eklenir, düzenlenir veya silinir.
- Sohbet isteğine, mesajla eşleşen en fazla 12 kayıt gönderilir; eşleşme yoksa en fazla
  4 yakın tarihli kayıt bağlam desteği için gönderilebilir.
- TOZRA kalıcı tercih veya hedef olabilecek bazı mesajlar için hafızaya kaydetme önerisi
  gösterir. Hiçbir bilgi kullanıcı tıklamadan kaydedilmez.
- Hassas veya gizli bilgi içeren kayıtlar reddedilir.
- Misafir oturumunda veriler yalnızca aynı cihazın tarayıcısında kalır.
- Hesap oturumunda mevcut `user_data` bulut senkronizasyonu kullanılır.

## Proje hafızası
- Proje adı, açıklaması, hedefi, yol haritası, görevleri ve notları proje kaydında tutulur.
- Proje sohbetinde bu bağlam API'ye ayrı `projectContext` alanıyla gönderilir.
- Genel sohbette, mesaj açıkça bir projeye/TOZRA'ya atıfta bulunuyorsa eşleşen veya seçili proje bağlamı eklenebilir.
- Proje konuşma geçmişi, ilgili projenin mesaj geçmişinden gönderilir; farklı projeler birbirine karıştırılmaz.

## Test
1. Akıllı Hafıza ekranında bir tercih veya hedef kaydet.
2. Aynı bilgiyle ilgili soru sor; yanıtın bu bilgiyi dikkate alıp almadığını kontrol et.
3. Kalıcı bir tercih belirten yeni bir mesaj gönder; hafıza önerisi çıkarsa kaydetme düğmesine bas.
4. Bir proje oluşturup hedef, görev ve not ekle; proje sohbetinde bu bilgileri sor.
5. Genel sohbette açıkça aynı projeye atıfta bulunarak soru sor.
6. Hesapla giriş yaptıysan sayfayı yenile; kayıtların korunduğunu kontrol et.
