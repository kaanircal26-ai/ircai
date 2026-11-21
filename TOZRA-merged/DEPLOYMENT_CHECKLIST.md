# TOZRA dağıtım kontrol listesi

## GitHub / Vercel
- [ ] ZIP'i çıkart.
- [ ] `TOZRA-merged` klasörünün **içindeki** dosyaları GitHub deposunun Vercel Root Directory olarak kullanılan ana dizinine yükle.
- [ ] Depoda `index.html`, `api/`, `memory.js`, `manifest.json`, `sw.js` doğrudan kök seviyede görünsün.
- [ ] Vercel Root Directory ayarının bu dosyaların bulunduğu klasörü gösterdiğini doğrula.
- [ ] Yeni deployment'ın başarılı tamamlandığını doğrula.

## Vercel Environment Variables
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_PUBLISHABLE_KEY` (veya `SUPABASE_ANON_KEY`)
- [ ] `GROQ_API_KEY`
- [ ] `TAVILY_API_KEY` (web araştırması için; kullanılmıyorsa isteğe bağlı)

Anahtarları GitHub dosyalarına koyma. Supabase service-role/secret key'i istemciye verme.

## Supabase Auth
- [ ] Authentication > Providers > Email açık.
- [ ] Authentication > URL Configuration > Site URL doğru domain.
- [ ] Redirect URLs listesine üretim domainini ekle.
- [ ] Test edilen Vercel domainini de Redirect URLs listesine ekle.

## Hafıza bulut senkronizasyonu
- [ ] `TOZRA_MEMORY_V2_SUPABASE.sql` dosyasını Supabase SQL Editor'da çalıştır.
- [ ] `user_memories` tablosu ve RLS politikalarının oluştuğunu doğrula.

## Yayın sonrası test
- [ ] `/api/config` adresi `success: true` döndürüyor.
- [ ] Yeni hesap oluşturma ve e-posta doğrulama.
- [ ] Giriş ve çıkış.
- [ ] Giriş yapmadan sohbet isteğinin 401 dönmesi.
- [ ] Giriş yaptıktan sonra genel sohbet.
- [ ] Proje oluşturma, sayfayı yenileme ve projeyi tekrar açma.
- [ ] Sesli yazıya dönüştürme.
- [ ] Mobil tarayıcı testi.

Not: Bu paket ödeme sistemini, reklamları ve projelerin tam Supabase bulut senkronizasyonunu tamamlamaz.
