# TOZRA AI Motoru — Aşama 1

## Yapılan değişiklikler
- Sohbet geçmişi sunucu tarafında son 10 yerine son 16 mesajı kapsayacak şekilde genişletildi.
- Yanıt üretim bütçesi 800 yerine 4096 completion token olarak ayarlandı.
- Hava durumu ve hava tahmini ifadeleri mevcut Tavily kaynaklı araştırma akışına eklendi.
- Sistem yönergesine hava durumu yanıtlarında kaynaklara dayanma ve konum/zaman belirsizliğini açıkça belirtme kuralı eklendi.
- Model kimliği ve sağlayıcı değişmedi; qwen/qwen3.8-27b korunmuştur.
- API anahtarları veya kullanıcı verileri değiştirilmedi.

## Gerekli ortam değişkenleri
- `GROQ_API_KEY`: sohbet servisi
- `TAVILY_API_KEY`: güncel araştırma ve hava durumu sorguları

Anahtarlar yalnızca sunucu ortam değişkenlerinde tutulmalıdır.

## Doğrulama
- `api/chat.js` JavaScript sözdizimi kontrolü yapıldı.
- Yalnızca ana dağıtım kökündeki `ircai-main/api/chat.js` değiştirildi.
- İç içe geçmiş eski kopyalar değiştirilmedi.
- Gerçek Groq/Tavily anahtarları ve canlı Vercel dağıtımı olmadan gerçek servis testi yapılmadı.
