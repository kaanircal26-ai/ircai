
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Sadece POST isteği destekleniyor."
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: "OPENAI_API_KEY Vercel ortam değişkenlerinde bulunamadı."
    });
  }

  const session = {
    type: "realtime",
    model: "gpt-realtime-2.1",
    instructions: `
Sen TOZRA'sın. Türkçe konuşan profesyonel bir yapay zekâ asistanısın.

- Kullanıcıyla doğal, akıcı ve anlaşılır Türkçe konuş.
- Profesyonel, sakin, sıcak ve yardımcı bir ses tonu kullan.
- Konuşma dilinde cevap ver; gereksiz uzun ve robotik cümlelerden kaçın.
- Basit sorulara kısa, karmaşık konulara açıklayıcı cevaplar ver.
- Kullanıcının sözünü kesme; ancak kullanıcı konuşmaya başladığında doğal biçimde dur ve onu dinle.
- Bilmediğin bilgileri uydurma.
- Kendini TOZRA olarak tanıt.
- Kullanıcı başka bir dilde konuşursa o dilde cevap verebilirsin.
- Güvenli ve yaşa uygun yanıtlar ver.
`,
    output_modalities: ["audio"],
    audio: {
      input: {
        transcription: {
          model: "gpt-4o-mini-transcribe",
          language: "tr"
        },
        turn_detection: {
          type: "server_vad",
          create_response: true,
          interrupt_response: true
        }
      },
      output: {
        voice: "marin"
      }
    }
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          expires_after: {
            anchor: "created_at",
            seconds: 600
          },
          session
        }),
        signal: controller.signal
      }
    );

    const raw = await response.text();
    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      return res.status(502).json({
        success: false,
        error: "Sesli görüşme servisi geçerli bir yanıt vermedi."
      });
    }

    if (!response.ok) {
      console.error("Realtime session error:", data);

      return res.status(response.status).json({
        success: false,
        error:
          data.error?.message ||
          "Gerçek zamanlı ses oturumu oluşturulamadı."
      });
    }

    if (!data.value) {
      return res.status(502).json({
        success: false,
        error: "Sesli görüşme anahtarı oluşturulamadı."
      });
    }

    return res.status(200).json({
      success: true,
      client_secret: data.value,
      expires_at: data.expires_at,
      session: data.session
    });

  } catch (error) {
    console.error("TOZRA realtime error:", error);

    if (error.name === "AbortError") {
      return res.status(504).json({
        success: false,
        error: "Sesli görüşme oturumu zaman aşımına uğradı."
      });
    }

    return res.status(500).json({
      success: false,
      error: "Sesli görüşme başlatılırken sunucu hatası oluştu."
    });

  } finally {
    clearTimeout(timeout);
  }
};
