
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Sadece POST isteği destekleniyor."
    });
  }

  const MODEL = "qwen/qwen3.8-27b";

  try {
    const {
      prompt,
      history = [],
      images = [],
      videoFrames = []
    } = req.body || {};

    // Mesaj kontrolü
    if (typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: "Lütfen bir mesaj yaz."
      });
    }

    if (prompt.length > 50000) {
      return res.status(413).json({
        success: false,
        error: "Mesaj çok uzun."
      });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "Groq API anahtarı bulunamadı."
      });
    }

    // Sohbet geçmişini temizle
    const safeHistory = Array.isArray(history)
      ? history
          .filter(item =>
            item &&
            ["user", "assistant"].includes(item.role) &&
            typeof item.content === "string"
          )
          .slice(-12)
          .map(item => ({
            role: item.role,
            content: item.content.slice(0, 12000)
          }))
      : [];

    // Görselleri birleştir
    const allImages = [
      ...(Array.isArray(images) ? images : []),
      ...(Array.isArray(videoFrames) ? videoFrames : [])
    ];

    // Qwen 3.8 en fazla 3 görsel kabul eder
    if (allImages.length > 3) {
      return res.status(400).json({
        success: false,
        error: "Bir istekte en fazla 3 görüntü gönderebilirsin. Video karelerini azaltıp tekrar dene."
      });
    }

    let totalSize = 0;
    const imageParts = [];

    for (const image of allImages) {
      if (typeof image !== "string") {
        return res.status(400).json({
          success: false,
          error: "Geçersiz görüntü dosyası."
        });
      }

      const match = image.match(
        /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/
      );

      if (!match) {
        return res.status(400).json({
          success: false,
          error: "Desteklenmeyen görüntü formatı."
        });
      }

      totalSize += match[2].length;

      if (totalSize > 3500000) {
        return res.status(413).json({
          success: false,
          error: "Görüntülerin toplam boyutu çok büyük."
        });
      }

      imageParts.push({
        type: "image_url",
        image_url: {
          url: image
        }
      });
    }

    // TOZRA ana yapay zekâ kimliği
    const systemMessage = {
      role: "system",
      content: `
Sen TOZRA'sın.

TOZRA, fikirleri geliştiren, analiz eden ve dijital projelere
dönüştüren gelişmiş bir yapay zekâ platformudur.

TEMEL DAVRANIŞLARIN:

1. Kullanıcıyla Türkçe konuş.
2. Soruları dikkatlice analiz et.
3. Karmaşık problemleri mantıklı parçalara ayır.
4. Gerektiğinde alternatif çözümler üret.
5. Eksik bilgileri fark et.
6. Bilmediğin bilgileri uydurma.
7. Yanlış bir varsayım üzerine kesin konuşma.
8. Gereksiz uzun cevaplardan kaçın.
9. Kullanıcının mevcut hedefini ve konuşma bağlamını koru.
10. Önceki mesajlarla çelişen cevaplar verme.

YARATICI ZEKA:

- Fikirleri geliştir.
- Marka ve ürün konseptleri oluştur.
- İçerik stratejileri hazırla.
- Projeleri aşamalara ayır.
- Gerektiğinde profesyonel öneriler sun.
- Sıradan fikirleri daha özgün hâle getirmeye çalış.
- Kullanıcının istemediği özellikleri kendiliğinden ekleme.

PROJE GELİŞTİRME:

- Proje konuşmalarındaki bilgileri dikkate al.
- Proje hedeflerini takip et.
- Kullanıcının verdiği talimatları koru.
- Bir projeye ait bilgileri başka bir projeye taşıma.
- Önceki proje kararlarıyla uyumlu öneriler üret.

KODLAMA:

- Kodları eksiksiz ve çalışabilir hazırlamaya çalış.
- Mevcut altyapıyı gereksiz yere bozma.
- Güvenlik ve hata kontrolünü önemse.
- Kullanıcı tam kod istediğinde parçalı kod verme.
- Bilmediğin dosya veya altyapı ayrıntılarını uydurma.

GÖRSEL ANALİZ:

- Görsellerdeki nesneleri, yazıları ve ayrıntıları incele.
- Görmediğin ayrıntıları uydurma.
- Emin olmadığın noktaları belirt.
- Birden fazla görsel gönderildiğinde karşılaştır.

VİDEO ANALİZİ:

- Gönderilen kareleri kronolojik sırayla değerlendir.
- Zaman damgalarını dikkate al.
- Görsel değişiklikleri karşılaştır.
- Benzer kareleri farklı sahneler gibi anlatma.
- Yalnızca gönderilen karelere dayanarak videonun tamamı hakkında kesin hüküm verme.

YANIT KALİTESİ:

Her cevapta doğruluk, fayda, açıklık ve tutarlılığı önceliklendir.

Kendini TOZRA olarak tanıt.
      `.trim()
    };

    const userContent = [
      {
        type: "text",
        text: prompt.trim()
      },
      ...imageParts
    ];

    const messages = [
      systemMessage,
      ...safeHistory,
      {
        role: "user",
        content: userContent
      }
    ];

    // API isteği
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 60000);

    let response;

    try {
      response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: MODEL,
            messages,

            // Gelişmiş akıl yürütme
            reasoning_effort: "high",
            reasoning_format: "hidden",

            // Yanıt kalitesi
            temperature: 0.6,
            top_p: 0.95,

            // Daha kapsamlı cevaplar
            max_completion_tokens: 8192,

            stream: false
          })
        }
      );
    } finally {
      clearTimeout(timeout);
    }

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API error:", data);

      return res.status(response.status).json({
        success: false,
        error: data.error?.message || "Yapay zekâ bağlantı hatası."
      });
    }

    const answer = data.choices?.[0]?.message?.content;

    if (!answer || typeof answer !== "string") {
      return res.status(502).json({
        success: false,
        error: "Yapay zekâ cevap oluşturamadı."
      });
    }

    return res.status(200).json({
      success: true,
      answer,
      model: MODEL,
      usage: data.usage || null
    });

  } catch (error) {
    console.error("TOZRA server error:", error);

    if (error.name === "AbortError") {
      return res.status(504).json({
        success: false,
        error: "Yapay zekâ isteği zaman aşımına uğradı. Tekrar dene."
      });
    }

    return res.status(500).json({
      success: false,
      error: "Sunucu hatası oluştu."
    });
  }
};
