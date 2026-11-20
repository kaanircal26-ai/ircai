
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

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
      error: "OPENAI_API_KEY bulunamadı."
    });
  }

  const body = req.body || {};
  const projectContext =
    typeof body.projectContext === "string"
      ? body.projectContext.slice(0, 10000)
      : "";

  const history = Array.isArray(body.history)
    ? body.history
        .filter(item =>
          item &&
          ["user", "assistant"].includes(item.role) &&
          typeof item.content === "string"
        )
        .slice(-8)
        .map(item => ({
          role: item.role,
          content: item.content.slice(0, 2000)
        }))
    : [];

  const historyText = history.length
    ? history.map(item =>
        `${item.role === "user" ? "KULLANICI" : "TOZRA"}: ${item.content}`
      ).join("\n\n")
    : "Önceki konuşma bulunmuyor.";

  const instructions = `
Sen TOZRA'sın. Türkçe konuşan profesyonel bir yapay zekâ asistanısın.

İLETİŞİM:
- Doğal, akıcı, profesyonel ve anlaşılır Türkçe konuş.
- Robotik ve ezberlenmiş ifadelerden kaçın.
- Kullanıcıyla gerçek bir sohbet akışında iletişim kur.
- Basit sorulara kısa, karmaşık konulara açıklayıcı cevap ver.
- Kullanıcının sözünü kesme; kullanıcı yeniden konuşmaya başladığında yanıtını doğal biçimde durdur.
- Gereksiz giriş ve kapanış cümleleri kullanma.
- Bilmediğin bilgileri uydurma.
- Güvenli ve yaşa uygun yanıtlar ver.

ASİSTAN KİMLİĞİ:
- Adın TOZRA.
- Kendini TOZRA olarak tanıt.
- Kullanıcının hedeflerine yardımcı ol.
- Sakin, doğal ve profesyonel bir ses tonu kullan.

ÖNCEKİ SOHBET BAĞLAMI:
${historyText}

${projectContext ? `
AKTİF PROJE BAĞLAMI:
${projectContext}

Bu görüşme aktif projeye aittir. Proje bilgilerini başka projelerle karıştırma.
` : ""}

ÖNEMLİ:
- Önceki konuşmaları bağlam olarak kullan.
- Kullanıcının yeni verdiği bilgileri dikkate al.
- Gizli düşünce zincirini paylaşma; kısa ve anlaşılır gerekçeler sun.
- Sesli görüşmede cevaplarını konuşmaya uygun, doğal cümlelerle oluştur.
`.trim();

  const session = {
    type: "realtime",
    model: "gpt-realtime-2.1",
    instructions,
    audio: {
      input: {
        transcription: {
          model: "gpt-4o-mini-transcribe",
          language: "tr"
        },
        noise_reduction: {
          type: "near_field"
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
        error: "Sesli görüşme servisi geçerli yanıt vermedi."
      });
    }

    if (!response.ok) {
      console.error("Realtime API error:", data);

      return res.status(response.status).json({
        success: false,
        error: data.error?.message ||
          "Sesli görüşme oturumu oluşturulamadı."
      });
    }

    if (!data.value) {
      return res.status(502).json({
        success: false,
        error: "Geçici oturum anahtarı oluşturulamadı."
      });
    }

    return res.status(200).json({
      success: true,
      client_secret: data.value,
      expires_at: data.expires_at
    });

  } catch (error) {
    console.error("TOZRA realtime error:", error);

    return res.status(error.name === "AbortError" ? 504 : 500).json({
      success: false,
      error: error.name === "AbortError"
        ? "Sesli görüşme bağlantısı zaman aşımına uğradı."
        : "Sesli görüşme başlatılırken sunucu hatası oluştu."
    });

  } finally {
    clearTimeout(timeout);
  }
};
