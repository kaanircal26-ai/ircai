# TOZRA — Kişisel Asistan Bulut Senkronizasyonu

Bu sürüm görevleri, haftalık programı ve notları mevcut Supabase `user_data` tablosundaki
`data` JSON alanının `tozra_assistant` anahtarı altında saklar. Mevcut `data` içeriğinin
diğer anahtarlarını korur.

## Beklenen tablo
- `id` (primary key)
- `user_id` (uuid, auth.users ile ilişkili)
- `data` (jsonb)
- `updated_at` (timestamp/timestamptz)

## RLS
`user_data` tablosunda RLS açık olmalı. Kullanıcı yalnızca kendi satırını okuyup
ekleyebilmeli ve güncelleyebilmeli. `user_id = auth.uid()` koşulunu SELECT,
INSERT ve UPDATE politikalarında kullanın. Service role anahtarını tarayıcıya koymayın.

Örnek politikalar (mevcut politikalar varsa aynı amaçlı ikinci politikalar oluşturmayın;
önce Supabase Table Editor > user_data > Policies bölümünden kontrol edin):

```sql
alter table public.user_data enable row level security;

create policy "user_data_select_own"
on public.user_data for select
to authenticated
using (auth.uid() = user_id);

create policy "user_data_insert_own"
on public.user_data for insert
to authenticated
with check (auth.uid() = user_id);

create policy "user_data_update_own"
on public.user_data for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

## Senkronizasyon davranışı
- İlk girişte, bu tarayıcıdaki eski kişisel asistan verileri hesaba aktarılır.
- Hesapta bulut verisi varsa bulut verisi esas alınır.
- Sonraki değişiklikler yerel depoya anında, Supabase'e kısa gecikmeyle kaydedilir.
- Oturum yoksa yalnızca yerel depolama kullanılır.
- `assistantWeekSaved` satırı bulut senkronizasyon durumunu gösterir.

## Test
1. Bir hesapla giriş yapıp görev, not ve haftalık program ekleyin.
2. Aynı hesaptan başka tarayıcı/cihazda giriş yapın.
3. Verilerin gelmesini doğrulayın.
4. İkinci cihazda bir notu değiştirin; ilk cihazda sayfayı yenileyip güncel halini kontrol edin.
