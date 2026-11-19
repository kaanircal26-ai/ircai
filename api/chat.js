
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Sadece POST isteği destekleniyor."
    });
  }

  try {
    const prompt = req.body?.prompt;

    if (typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        error: "Lütfen bir mesaj yaz."
      });
    }

    if (prompt.length > 12000) {
      return res.status(400).json({
        error: "Mesaj çok uzun."
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: "Groq API anahtarı bulunamadı."
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `Sen IRCAI adlı yaratıcı dijital proje platformunun yapay zekâ asistanısın.

Kullanıcı fikirlerini analiz et.
Dijital projeler geliştir.
Marka ve strateji önerileri sun.
İçerik fikirleri üret.
Profesyonel, yaratıcı ve uygulanabilir cevaplar ver.
Her zaman Türkçe konuş.`
            },
            {
              role: "user",
              content: prompt.trim()
            }
          ],
          temperature: 0.7,
          max_completion_tokens: 1500
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: data.error?.message || "Groq bağlantı hatası."
      });
    }

    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      return res.status(502).json({
        error: "Yapay zekâ boş yanıt döndürdü."
      });
    }

    return res.status(200).json({
      success: true,
      answer
    });

  } catch (error) {
    return res.status(500).json({
      error: "Sunucu hatası: " + error.message
    });
  }
};
