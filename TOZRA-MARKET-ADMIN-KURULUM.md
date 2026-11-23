# TOZRA Market yönetici inceleme paneli

## Eklenenler
- Market başlığında yalnızca yetkili hesaba görünen “İnceleme paneli” düğmesi.
- `pending` durumundaki ürünleri Supabase'ten listeleme.
- Yüklenen dosyayı özel `market-files` bucket'ından kontrol için indirme/açma.
- Ürünü `published` yaparak yayınlama veya `rejected` durumuna alma.
- Normal kullanıcıların yönetim paneline erişimi Supabase RLS ile engellenir.

## Kurulum
1. Supabase Dashboard > SQL Editor bölümünü açın.
2. `TOZRA_MARKET_ADMIN_REVIEW.sql` dosyasındaki SQL'i çalıştırın. Son `INSERT` satırı yorum satırı olarak bırakılmıştır.
3. Authentication > Users bölümünden yönetici olacak kendi hesabınızın User UID değerini kopyalayın.
4. SQL dosyasının en altındaki örnek satırdaki `BURAYA-AUTH-UID` alanını gerçek UID ile değiştirin ve satırın başındaki `--` işaretlerini kaldırarak çalıştırın:

   `insert into public.market_admins (user_id) values ('GERCEK-UID');`

5. TOZRA'da aynı hesapla oturum açın ve Market sayfasını yenileyin. “İnceleme paneli” düğmesi görünmelidir.

## Güvenlik notları
- UID yalnızca Supabase Auth kullanıcı kimliğidir; gizli anahtar değildir. Yine de herkese açık paylaşmayın.
- `SUPABASE_SECRET_KEY` veya `service_role` anahtarını tarayıcıya/Vercel frontend değişkenlerine koymayın.
- Paneldeki dosya kontrolü özel Storage bucket'ından dosya indirir. Güvenli ve tanınmayan dosyaları açarken dikkatli olun.
- Yayına alma `market_templates.status = 'published'`, ret `status = 'rejected'` olarak kaydedilir.
- Ürün onaylandıktan sonra genel Market görünürlüğü, mevcut `market_templates` SELECT RLS politikasının `published` ürünleri herkese açmasına bağlıdır.

## Doğrulama
Bu güncellemede statik JavaScript sözdizimi ve ZIP bütünlüğü kontrol edilecektir. Canlı Supabase yetkilendirme/inceleme akışı, SQL ve yönetici UID tanımlandıktan sonra hesapta test edilmelidir.
