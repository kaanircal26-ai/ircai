-- TOZRA Market yönetici inceleme sistemi
-- Önce tabloyu oluşturun; ardından en alttaki INSERT satırına kendi Auth UID değerinizi yazın.

create table if not exists public.market_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.market_admins enable row level security;
grant select on public.market_admins to authenticated;

drop policy if exists "Admins can read own admin record" on public.market_admins;
create policy "Admins can read own admin record"
on public.market_admins for select to authenticated
using (user_id = auth.uid());

-- Yöneticiler inceleme kuyruğundaki tüm kayıtları görebilir.
drop policy if exists "Market admins can review all templates" on public.market_templates;
create policy "Market admins can review all templates"
on public.market_templates for select to authenticated
using (exists (select 1 from public.market_admins a where a.user_id = auth.uid()));

-- Yöneticiler yalnızca moderasyon durumunu güncelleyebilir (uygulama arayüzü status alanını değiştirir).
drop policy if exists "Market admins can moderate templates" on public.market_templates;
create policy "Market admins can moderate templates"
on public.market_templates for update to authenticated
using (exists (select 1 from public.market_admins a where a.user_id = auth.uid()))
with check (exists (select 1 from public.market_admins a where a.user_id = auth.uid()));

-- İnceleme sırasında özel bucket'taki dosyayı yöneticinin indirebilmesi için.
drop policy if exists "Market admins can read submitted files" on storage.objects;
create policy "Market admins can read submitted files"
on storage.objects for select to authenticated
using (
  bucket_id = 'market-files'
  and exists (select 1 from public.market_admins a where a.user_id = auth.uid())
);

-- ÖNEMLİ: Aşağıdaki satırı kendi Supabase Auth UID değerinizle değiştirip çalıştırın.
-- UID: Supabase Dashboard > Authentication > Users > kendi hesabınız > User UID
-- insert into public.market_admins (user_id) values ('BURAYA-AUTH-UID');
