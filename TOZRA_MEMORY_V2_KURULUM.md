# TOZRA Advanced Memory v2 — Kurulum

## Bu pakette neler değişti?
- Hafıza kayıtları yerel önbellekte tutulur ve giriş yapılmışsa Supabase `user_memories` tablosuyla eşitlenir.
- Her kayıt `user_id` ile kullanıcı hesabına bağlanır; RLS politikaları kullanıcıların yalnızca kendi kayıtlarına erişmesine izin verir.
- Sohbet isteği gönderilirken son kayıtlar körlemesine gönderilmez; mesajla kelime bakımından daha ilgili en fazla 12 hafıza kaydı seçilir.
- Hafıza panelinden kayıt ekleme, düzenleme ve silme yapılabilir.
- Eski `tozra-personal-memory-v1` kayıtları v2 anahtarına taşınır.
- Oturum açma/kapatma sırasında hafıza aktif hesaba göre yeniden yüklenir.
- Şifre, API anahtarı, token ve benzeri gizli bilgileri kaydetme girişimleri engellenir.

## 1. Supabase kurulumu
1. Supabase Dashboard → SQL Editor bölümünü aç.
2. `TOZRA_MEMORY_V2_SUPABASE.sql` dosyasındaki SQL kodunun tamamını çalıştır.
3. Table Editor'da `user_memories` tablosunun oluştuğunu doğrula.

Bu geliştirme için `service_role` anahtarı gerekmez. Mevcut `SUPABASE_URL` ve `SUPABASE_PUBLISHABLE_KEY` (veya `SUPABASE_ANON_KEY`) ayarları kullanılır.

## 2. Projeyi yayınlama
ZIP içindeki proje dosyalarını GitHub ana proje köküne yükle. `index.html`, `memory.js` ve `api/` klasörü aynı proje kökünde bulunmalı. Ardından Vercel deploy işlemini bekle.

## 3. Test
1. TOZRA hesabına giriş yap.
2. Hafıza panelinden bir tercih kaydet.
3. Durum metninde “Hafıza hesabınla buluta senkronize.” yazdığını doğrula.
4. Sayfayı yenile; kayıt görünmeli.
5. Aynı hesapla başka bir cihazdan giriş yap; kayıt görünmeli.
6. Bir kaydı düzenle ve sil; diğer cihazda yenileyerek değişikliği kontrol et.
7. Sohbette hafızadaki tercihle ilgili bir soru sor; TOZRA'nın ilgili bilgiyi kullanıp kullanmadığını kontrol et.

## Önemli notlar
- SQL kurulmadan önce hafıza yalnızca cihazdaki yerel depoda çalışır; arayüz durum metni bunu belirtir.
- Bu sürüm otomatik olarak sohbetlerden yeni kişisel bilgi çıkarıp kaydetmez. Kullanıcı hafıza panelinden hangi bilgilerin saklanacağını kendisi seçer.
- Hafıza arama işlemi bu sürümde yerel, anahtar kelime temellidir; anlamsal vektör araması değildir.
