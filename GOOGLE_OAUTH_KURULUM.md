# TOZRA Google ile Giriş — Supabase kurulumu

Arayüz ve OAuth çağrısı uygulamaya eklendi. Google ile girişin çalışması için Supabase projesinde sağlayıcıyı etkinleştirmen gerekir:

1. Supabase Dashboard → Authentication → Sign In / Providers → Google bölümünü aç.
2. Google provider seçeneğini etkinleştir.
3. Google Cloud Console'da OAuth istemci kimliği oluşturup istemci kimliği ve istemci sırrını Supabase Google provider alanlarına ekle.
4. Supabase'in gösterdiği callback URL'yi Google Cloud Console'daki Authorized redirect URIs listesine ekle.
5. Supabase Authentication → URL Configuration bölümünde TOZRA alan adını Site URL ve Redirect URLs listesine ekle (ör. `https://tozra.com.tr/`).
6. Kaydet ve uygulamada Google ile devam et düğmesini test et.

Google OAuth gizli anahtarını hiçbir zaman tarayıcı koduna veya ZIP içine koyma. OAuth istemci sırrı yalnızca sağlayıcı ayarlarında saklanmalıdır.
