# TOZRA — Birleştirilmiş sürüm

Bu paket, ana TOZRA Creative Intelligence arayüzünü korur ve vNext sürümündeki Supabase hesap girişini bu arayüze entegre eder.

## İçerik
- Ana sürümün koyu siyah-yeşil çalışma alanı ve proje arayüzü
- Supabase e-posta/şifre ile kayıt ve giriş
- Şifre sıfırlama ve e-posta doğrulama akışları
- Hesaba göre ayrılmış yerel sohbet/proje depolaması
- Gelişmiş kişisel hafıza modülü (`memory.js`)
- Kimlik doğrulamalı sohbet ve ses transkripsiyon istekleri
- Mevcut API endpointleri ve PWA dosyaları

## Vercel dağıtımı
1. Bu klasörün içindeki dosyaları GitHub deposunun dağıtım kök dizinine yükleyin.
2. Vercel Project Settings > General > Root Directory değerinin bu dosyaların bulunduğu dizin olduğundan emin olun.
3. Vercel Environment Variables içinde gerekli anahtarları tanımlayın:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY` (veya eski projelerde `SUPABASE_ANON_KEY`)
   - `GROQ_API_KEY`
   - `TAVILY_API_KEY` (araştırma özelliği kullanılıyorsa)
4. Supabase SQL Editor'da `TOZRA_MEMORY_V2_SUPABASE.sql` dosyasını yalnızca hafıza bulut senkronizasyonu isteniyorsa çalıştırın.
5. Deploy sonrası yeni oturumda kayıt/giriş, sohbet ve proje kayıtlarını test edin.

## Önemli
- API anahtarlarını GitHub'a veya istemci tarafındaki HTML/JS dosyalarına yazmayın.
- Premium ödeme ve tam proje bulut senkronizasyonu bu pakette tamamlanmış değildir.
- Görsel/video analizinin çoklu kare sınırları ayrıca ele alınmalıdır.
