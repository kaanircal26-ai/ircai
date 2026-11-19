
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Sadece POST isteği destekleniyor."
    });
  }

  try {
    const {
      prompt,
      history = [],
      images = [],
      videoFrames = []
    } = req.body || {};

    if (typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: "Lütfen bir mesaj yaz."
      });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "Groq API anahtarı bulunamadı."
      });
    }

    // Geçmiş mesajlardan desteklenmeyen tüm alanları temizle.
    const safeHistory = Array.isArray(history)
      ? history
          .filter(item =>
            item &&
            ["user", "assistant"].includes(item.role) &&
            typeof item.content === "string"
          )
          .slice(-10)
          .map(item => ({
            role: item.role,
            content: item.content
          }))
      : [];

    // Fotoğraflar ve videodan çıkarılan kareler.
    const allImages = [
      ...(Array.isArray(images) ? images : []),
      ...(Array.isArray(videoFrames) ? videoFrames : [])
    ];

    if (allImages.length > 3) {
      return res.status(400).json({
        success: false,
        error: "Bir istekte en fazla 3 görüntü gönderebilirsin."
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
          error: "Görüntülerin toplam boyutu çok büyük. Daha küçük dosyalar dene."
        });
      }

      imageParts.push({
        type: "image_url",
        image_url: {
          url: image
        }
      });
    }

    const systemMessage = {
      role: "system",
      content: `
Sen TOZRA adında gelişmiş bir yapay zekâ asistanısın.

Görevlerin:
- Kullanıcıya Türkçe cevap ver.
- Açık, anlaşılır ve faydalı ol.
- Yaratıcı fikirler üret.
- Soruları dikkatlice analiz et.
- Fotoğrafları ve videodan alınan görüntü karelerini incele.
- Görüntülerdeki nesneleri, yazıları ve ayrıntıları tanımlamaya çalış.
- Görmediğin ayrıntıları uydurma.
- Emin olmadığın durumlarda bunu açıkça belirt.
- Gereksiz uzun cevaplardan kaçın.
- Profesyonel ve yardımcı bir üslup kullan.

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

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "qwen/qwen3.8-27b",
          messages,
          temperature: 0.7,
          max_completion_tokens: 2048
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API error:", data);

      return res.status(response.status).json({
        success: false,
        error: data.error?.message || "Groq API bağlantı hatası."
      });
    }

    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      return res.status(502).json({
        success: false,
        error: "Yapay zekâ cevap oluşturamadı."
      });
    }

    return res.status(200).json({
      success: true,
      answer
    });

  } catch (error) {
    console.error("TOZRA server error:", error);

    return res.status(500).json({
      success: false,
      error: "Sunucu hatası oluştu."
    });
  }
};
