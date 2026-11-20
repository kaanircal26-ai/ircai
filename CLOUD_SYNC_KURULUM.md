# TOZRA — Bulut Senkronizasyonu (düzeltilmiş)

Bu sürüm `public.user_data` tablosunu kullanır ve tabloyu şu alanlarla bekler:
- `user_id` (uuid; kullanıcı başına tek satır olmalı, UNIQUE)
- `data` (jsonb)
- `updated_at` (timestamp veya timestamptz)

Kod `id` sütununa ihtiyaç duymaz. Mevcut tabloda `user_id` zaten UNIQUE değilse,
Supabase SQL Editor'de önce aynı kullanıcıya ait birden fazla satır bulunmadığını
kontrol edin, ardından `user_id` için UNIQUE kısıtı ekleyin:

```sql
select user_id, count(*)
from public.user_data
group by user_id
having count(*) > 1;
```

Sorgu sonuç döndürmüyorsa:

```sql
alter table public.user_data
add constraint user_data_user_id_key unique (user_id);
```

RLS açık olmalı. Supabase Dashboard > Table Editor > user_data > Policies
bölümünde kullanıcıların yalnızca kendi satırlarını okuyup ekleyip güncelleyebildiğini
doğrulayın. Örnek:

```sql
alter table public.user_data enable row level security;

create policy "user_data_select_own"
on public.user_data for select to authenticated
using (auth.uid() = user_id);

create policy "user_data_insert_own"
on public.user_data for insert to authenticated
with check (auth.uid() = user_id);

create policy "user_data_update_own"
on public.user_data for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

Mevcut aynı amaçlı politikalar varsa tekrar oluşturmayın. `service_role` anahtarını
tarayıcıya eklemeyin.

## Neler senkronize edilir?
- Görevler
- Haftalık program
- Kişisel notlar

İlk girişte bu tarayıcıdaki eski yerel veriler hesaba aktarılır. Hesapta zaten bulut
verisi varsa bulut verisi kullanılır. Oturum yoksa yerel kayıt devam eder.

## Test
1. Bilgisayarda hesabınıza giriş yapın; haftalık programa bir metin yazın.
2. Kayıt durumunda "Buluta kaydediliyor…" ardından "Bulutla senkronize" görünmeli.
3. Aynı hesapla telefondan giriş yapın ve sayfayı yenileyin.
4. Haftalık program metni görünmeli.
5. Telefonda yeni bir not ekleyin; bilgisayarda sayfayı yenileyip kontrol edin.
