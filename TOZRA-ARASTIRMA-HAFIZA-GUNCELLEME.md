# TOZRA Araştırma Hafızası ve Devam Akışı

## Bu sürümde yapılanlar

- Araştırma yanıtları, kaynak başlığı/URL/tarihi yanında sınırlı kaynak metnini de konuşma kaydında taşır.
- Sonraki mesajlarda `Önceki raporunu tamamla`, `kaynakları karşılaştır`, `ikinci bölümü genişlet` gibi devam ifadeleri algılanır.
- Devam isteğinde önceki asistan mesajlarındaki kaynak içerikleri yeniden kullanılır; gereksiz yere Tavily araması tekrarlanmaz.
- `yeniden araştır`, `yeni kaynak bul`, `başka kaynak bul` gibi açık yeni arama taleplerinde yeni Tavily araması yapılır.
- Sohbet ve proje geçmişi yeniden açıldığında kaynak bağlantıları tekrar görüntülenir.
- Kaynak metni geçmişe sınırlı uzunlukta kaydedilir; harici kaynakların içindeki talimatlar güvenilmeyen veri olarak ele alınır.

## Testler

- API dosyalarının Node.js sözdizimi kontrolü geçti.
- `index.html` içindeki üç satır içi JavaScript bloğunun sözdizimi kontrolü geçti.
- Sahte Tavily/Groq yanıtlarıyla entegrasyon testi yapıldı: ilk araştırma kaynakları döndürdü; devam mesajı aynı kaynakları yeniden kullandı ve ikinci Tavily araması yapmadı.
- Gerçek Vercel, Groq ve Tavily ortamında canlı test yapılmadı. Dağıtım sonrası gerçek anahtarlarla doğrulama gerekir.

## Kurulum

ZIP'i açıp içindeki `ircai-main` klasörünün içeriğini mevcut GitHub depo köküne yükleyin. Vercel dağıtımının tamamlanmasını bekleyin. `GROQ_API_KEY` ve `TAVILY_API_KEY` ortam değişkenleri mevcut projedeki gibi tanımlı kalmalıdır.
