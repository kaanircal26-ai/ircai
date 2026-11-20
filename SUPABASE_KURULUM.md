# TOZRA — Supabase Auth v1 kurulumu

## Vercel ortam değişkenleri
Vercel → Project → Settings → Environment Variables bölümünde Production, Preview ve Development için:

- `SUPABASE_URL` — Supabase Project URL
- `SUPABASE_PUBLISHABLE_KEY` — Supabase Publishable key (veya eski projelerde anon key)

Supabase `service_role` / secret anahtarını kesinlikle ekleme; istemciye açılmamalıdır.
Mevcut AI servis anahtarları (`GROQ_API_KEY`, `TAVILY_API_KEY`, `OPENAI_API_KEY`) sunucuda kalmalıdır.

## Supabase Auth
Supabase → Authentication → URL Configuration:
- Site URL: `https://ircai.vercel.app`
- Redirect URL: `https://ircai.vercel.app/**`

Authentication → Providers → Email açık olmalı. E-posta doğrulaması açıksa kayıt sonrası gelen doğrulama bağlantısına tıklanmalıdır.

## Bu sürümde neler var?
- E-posta/şifre ile gerçek Supabase kayıt ve giriş
- Oturumun tarayıcıda korunması ve otomatik token yenileme
- Çıkış yapma
- `/api/chat`, `/api/transcribe`, `/api/realtime-session` için sunucu tarafında Supabase kullanıcı doğrulaması
- API yapılandırmasının `/api/config` üzerinden sunulması
- Proje/sohbet/hafıza depolamasında kullanıcıya özel localStorage anahtarları

## Veri senkronizasyonu notu
Bu sürümde kimlik doğrulama gerçektir; proje ve sohbet verileri hâlâ cihazda yerel saklanır. Supabase veritabanına bulut yedekleme/senkronizasyon henüz eklenmemiştir. Eski anonim tarayıcı kayıtları ilk girişte o hesap için kopyalanır.

## Kontrol
1. Deploy sonrası `/api/config` açıldığında `success: true` dönmeli.
2. Kayıt ve giriş yapmayı dene.
3. Giriş yapmadan API endpoint'leri 401 dönmelidir.
4. Giriş yaptıktan sonra sohbet ve ses özelliklerini test et.
