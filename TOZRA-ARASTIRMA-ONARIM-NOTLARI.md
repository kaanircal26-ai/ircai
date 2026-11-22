# TOZRA – Araştırma Akışı Onarımı

## Bu sürümde yapılanlar
- Araştırma için kaynak içeriği modele gönderilmeden önce sınırlandırıldı: en fazla 5 kaynak, kaynak başına en fazla 3.600 karakter.
- Tam sayfa çıkarımı en fazla 3 kaynakla sınırlandırıldı; başarısız olursa Tavily arama özetleriyle devam edilir.
- İlk Groq yanıtı başarısız olursa, daha küçük bağlamla ve sohbet geçmişi olmadan bir kez daha denenir.
- Araştırma isteğinin ilk ve yedek Groq denemeleri için ayrı süre sınırları tanımlandı.
- Hata yanıtlarına aşama kodu ve varsa kaynak listesi eklendi.
- Arayüz, başarısız araştırma yanıtında bile sunucudan dönen kaynak bağlantılarını gösterebilir.
- Normal sohbetin önceki model/yanıt ayarları korunmuştur.

## Kontroller
- `npm run check`: başarılı.
- `index.html` içindeki 6 satır içi JavaScript bloğu: sözdizimi kontrolünden geçti.
- Simüle edilmiş test: Tavily arama + sayfa çıkarımı + ilk Groq isteğinde hata + küçültülmüş yedek istekte başarılı yanıt senaryosu geçti.

## Önemli sınır
Bu testler yerel/simüle edilmiş kontrollerdir. Gerçek Vercel, Groq ve Tavily anahtarlarıyla canlı ortam testi yapılmamıştır. Canlı ortam sonucu; Vercel ortam değişkenlerine, Groq hesabının model erişimine/kotalarına ve Tavily hesabına bağlıdır.
