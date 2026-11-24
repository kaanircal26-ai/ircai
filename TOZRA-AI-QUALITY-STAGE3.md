# TOZRA AI Yanıt Kalitesi — Aşama 3

## Yapılan iyileştirmeler
- Sistem yönergesine doğrudan cevap, kapsam ayarı, tekrar azaltma, varsayım belirtme ve test/araç iddialarında doğruluk kuralları eklendi.
- İstek türü algılamasına yazım/düzenleme görevi eklendi.
- Kaynaklı araştırma, yazım, analiz ve planlama görevleri için daha belirgin çıktı yönergeleri eklendi.
- Sohbet geçmişi en fazla 16 mesajla ve toplam 18.000 karakterlik ek bir bütçeyle sınırlandırıldı.
- En yeni geçmiş mesajları korunurken mevcut kullanıcı isteğinin bağlam bütçesini tüketmesi engellendi.
- API yanıtına kullanılan geçmiş mesajı sayısını gösteren `contextMessages` tanılama alanı eklendi.
- Sohbet kalite akışını doğrulayan otomatik API testi eklendi.

## Korunanlar
- Model ve sağlayıcı değiştirilmedi.
- API uç noktası ve istek biçimi korundu.
- Arayüz, mevcut sohbet, proje ve hafıza özellikleri değiştirilmedi.
- Yeni kullanıcı özelliği eklenmedi.

## Testler
- `node --check api/chat.js`
- `node tests/chat-quality.test.js`
- `npm run check` (Atlas, hafıza, sohbet kalite testleri ve mevcut JavaScript sözdizimi kontrolleri)

## Doğrulama sınırı
Testler sahte Supabase ve Groq yanıtlarıyla yerel olarak çalıştırılmıştır. Gerçek Groq modeli, canlı Supabase hesabı, Vercel dağıtımı ve gerçek cihaz yanıt kalitesi bu testlerle doğrulanmış sayılmaz.
