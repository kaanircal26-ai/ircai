
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

    // Sohbet geçmişini güvenli biçime dönüştür.
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

    // Fotoğrafları ve videodan çıkarılan kareleri birleştir.
    const allImages = [
      ...(Array.isArray(images) ? images : []),
      ...(Array.isArray(videoFrames) ? videoFrames : [])
    ];

    // En fazla 15 görüntü kabul et.
    if (allImages.length > 15) {
      return res.status(400).json({
        success: false,
        error: "Bir istekte en fazla 15 görüntü gönderebilirsin."
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

      // Toplam görüntü boyutunu sınırla.
      if (totalSize > 3500000) {
        return res.status(413).json({
          success: false,
          error: "Görüntülerin toplam boyutu çok büyük. Daha küçük görüntüler dene."
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

GENEL GÖREVLERİN:
- Kullanıcıya Türkçe cevap ver.
- Açık, anlaşılır ve faydalı ol.
- Yaratıcı fikirler üret.
- Soruları dikkatlice analiz et.
- Fotoğrafları ve videodan alınan görüntü karelerini incele.
- Görüntülerdeki nesneleri, yazıları ve ayrıntıları tanımlamaya çalış.
- Görmediğin ayrıntıları uydurma.
- Emin olmadığın durumlarda bunu açıkça belirt.
- Profesyonel ve yardımcı bir üslup kullan.

VİDEO ANALİZİ:
- Sana bir videodan farklı zamanlarda alınmış görüntü kareleri gönderilebilir.
- Kullanıcı zaman damgaları verdiyse bunları dikkate al.
- Kareleri mümkün olduğunca kronolojik sırayla incele.
- Başlangıç, orta ve son bölümlerdeki görsel farklılıkları karşılaştır.
- Nesnelerin konumlarını, sahne değişimlerini ve kamera hareketlerini incele.
- Birbirine benzeyen kareleri otomatik olarak farklı sahneler gibi anlatma.
- Görüntüler arasında belirgin bir değişiklik yoksa bunu açıkça söyle.
- Sadece gönderilen karelere dayanarak videonun tamamı hakkında kesin hüküm verme.
- İncelenemeyen zaman aralıkları varsa bunu belirt.
- Kullanıcı kronolojik özet istediğinde olayları zaman sırasına göre açıkla.

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
