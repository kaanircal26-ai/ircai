
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Sadece POST isteği destekleniyor."
    });
  }

  try {
    const { prompt, history = [] } = req.body || {};

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "Mesaj boş olamaz."
      });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Groq API anahtarı bulunamadı."
      });
    }

    const messages = [
      {
        role: "system",
        content: "Sen Tozra adında yardımcı, yaratıcı ve Türkçe iletişim kurabilen bir yapay zekâ asistanısın. Açık, doğru ve faydalı cevaplar ver."
      },
      ...history.slice(-10),
      {
        role: "user",
        content: prompt
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
          model: "llama-3.3-70b-versatile",
          messages,
          temperature: 0.7,
          max_tokens: 2048
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Groq bağlantı hatası."
      });
    }

    return res.status(200).json({
      answer: data.choices?.[0]?.message?.content || ""
    });

  } catch (error) {
    return res.status(500).json({
      error: "Sunucu hatası: " + error.message
    });
  }
};
