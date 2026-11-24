# TOZRA Connect 2.0 — Gerçek Profil Altyapısı

## Bu pakette
- Profil düzenleme: kullanıcı adı, görünen ad, biyografi, yetenekler ve ilgi alanları
- Gizli profil varsayılanı ve açık/gizli profil tercihi
- Profil fotoğrafını galeriden seçme, küçültme ve Supabase Storage'a yükleme
- Profil verisini `public.profiles` tablosuna kullanıcı kimliğiyle kaydetme
- Profil e-postasını herkese açık alanda göstermeme

## Kurulum zorunluluğu
1. Supabase Dashboard > SQL Editor bölümünü aç.
2. `TOZRA_CONNECT_2_PROFILES.sql` dosyasının tamamını çalıştır.
3. SQL başarılı olduktan sonra Expo uygulamasını yeniden başlat.
4. Hesap > Connect profilin bölümünden kullanıcı adını ve diğer alanları doldurup Profili kaydet'e dokun.

## Güvenlik
- Profil kayıtları Supabase Auth kullanıcı UUID'sine bağlanır.
- RLS etkin; kullanıcı yalnızca kendi profilini ekleyebilir/değiştirebilir.
- Yeni profiller gizli başlar.
- Fotoğraflar `profile-avatars/<auth-user-id>/...` yoluna yüklenir.
- Bu aşama henüz Connect keşfet listesini gerçek profillere bağlamaz; o, sonraki takip/keşif aşamasıdır.

## Test durumu
Kaynak dosya ve SQL paketi oluşturuldu. Bu ortamda gerçek Supabase projesine bağlanıp SQL çalıştırma veya iPhone/Android üzerinde Expo derlemesi yapma imkânı olmadığı için canlı bağlantı ve cihaz testi yapılmış değildir.
