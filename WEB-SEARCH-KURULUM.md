# TOZRA internet araştırması

TOZRA'nın sohbet API'sinde Tavily tabanlı web araması bulunur. Güncel veya doğrulama gerektiren sorularda arama otomatik başlatılır; basit sohbetlerde gereksiz arama yapılmaz.

## Vercel ortam değişkeni

Vercel projesinde Settings → Environment Variables bölümüne şu değişken eklenmelidir:

- Name: `TAVILY_API_KEY`
- Value: Tavily hesabından alınan API anahtarı
- Environments: Production (tercihen Preview ve Development da)

Kaydettikten sonra yeni deployment yapılmalıdır. Anahtarı HTML/JavaScript içine koymayın ve kimseyle paylaşmayın; yalnızca sunucu ortam değişkeninde tutun.

## Çalışma şekli

- Güncel, değişebilir veya kaynakla doğrulanması istenen sorularda Tavily araması yapılır.
- En fazla 8 arama sonucu modele bağlam olarak iletilir.
- Kullanılabilir kaynak bağlantıları sohbet yanıtının altında listelenir.
- Tavily anahtarı yoksa araştırma gerektiren istekte açık hata gösterilir; arama yapılmış gibi davranılmaz.
- Diğer normal sohbet istekleri mevcut Groq modelini kullanmaya devam eder.
