
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Sadece POST isteği destekleniyor."
    });
  }

  try {
    const { prompt, history = [] } = req.body || {};

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

    const safeHistory = Array.isArray(history)
      ? history
          .filter(item =>
            item &&
            ["user", "assistant"].includes(item.role) &&
            typeof item.content === "string"
          )
          .slice(-10)
      : [];

    const messages = [
      {
        role: "system",
        content: `
Sen Tozra adında gelişmiş bir yapay zekâ asistanısın.

Görevlerin:
- Kullanıcıya Türkçe cevap ver.
- Açık, anlaşılır ve faydalı ol.
- Yaratıcı fikirler üret.
- Soruları dikkatlice analiz et.
- Gereksiz uzun cevaplardan kaçın.
- Bilmediğin konularda uydurma bilgi verme.

Kendini Tozra olarak tanıt.
        `.trim()
      },
      ...safeHistory,
      {
        role: "user",
        content: prompt.trim()
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
          model: "openai/gpt-oss-20b",
          messages: messages,
          temperature: 0.7,
          max_tokens: 2048
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
      answer: answer
    });

  } catch (error) {
    console.error("Tozra server error:", error);

    return res.status(500).json({
      success: false,
      error: "Sunucu hatası oluştu."
    });
  }
};
