# TOZRA — Sesli Sohbet İlk Sürümü

## Eklenenler
- Genel sohbet ve proje sohbeti için mikrofonla ses kaydı.
- Groq Whisper Large V3 Turbo ile Türkçe konuşmayı metne dönüştürme.
- Asistan mesajlarında tarayıcı üzerinden Türkçe sesli okuma.
- Mikrofon izinleri, dosya boyutu, format ve zaman aşımı kontrolleri.
- Service Worker önbellek sürümü güncellendi.

## Gerekli ortam değişkeni
Vercel projesinde mevcut `GROQ_API_KEY` değişkeni kullanılmaya devam eder. Yeni bir API anahtarı gerekmez.

## Kullanım
1. Güncellenmiş dosyaları projeye yükle.
2. Vercel'de yeniden deploy et.
3. Siteyi HTTPS üzerinden aç.
4. Mikrofon düğmesine dokunup izin ver.
5. Konuşmayı bitirmek için düğmeye tekrar dokun.
6. Metin kutusuna aktarılan konuşmayı gönder.
7. Asistan yanıtındaki “Sesli dinle” düğmesini kullan.

## Not
Bu sürüm bas-konuş ve yanıtı seslendirme deneyimidir; kesintisiz, gerçek zamanlı çift yönlü sesli görüşme değildir. iOS'ta mikrofon izni için site HTTPS üzerinden açılmalıdır.


## Sürekli sesli sohbet modu (ikinci sürüm)
- Genel sohbet alanına "Sesli sohbeti başlat" kontrolü eklendi.
- Tarayıcının Web Speech API konuşma tanıması ile kullanıcı konuşması otomatik algılanır.
- Tanınan konuşma mevcut `/api/chat` Groq sohbet uç noktasına gönderilir.
- TOZRA yanıtı Türkçe tarayıcı seslendirmesiyle otomatik okunur.
- Yanıt bitince dinleme otomatik yeniden başlar; düğmeyle mod kapatılabilir.
- Mevcut `/api/transcribe` bas-konuş uç noktası korunur.

### Önemli teknik sınır
Bu, sürekli dinleme ve otomatik sesli yanıt sağlayan eller-serbest konuşma döngüsüdür; gerçek zamanlı ses-token akışı veya WebRTC tabanlı düşük gecikmeli full-duplex model oturumu değildir. Konuşma tanıma ve ses kalitesi tarayıcı/işletim sistemi desteğine bağlıdır. Gerçek model seviyesinde canlı ses için ayrıca desteklenen bir realtime ses sağlayıcısı ve sunucu tarafında kısa ömürlü oturum anahtarı oluşturma uç noktası gerekir.
