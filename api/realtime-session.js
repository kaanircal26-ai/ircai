
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
      ? body.projectContext.slice(0, 6000)
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
          content: item.content.trim().slice(0, 1200)
        }))
        .filter(item => item.content)
    : [];

  const historyText = history.length
    ? history.map(item =>
        `${item.role === "user" ? "KULLANICI" : "TOZRA"}: ${item.content}`
      ).join("\n\n")
    : "Önceki konuşma bulunmuyor.";

  const instructions = `
Sen TOZRA'sın. Türkçe konuşan gelişmiş bir yapay zekâ asistanısın.

KİMLİĞİN:
- Adın TOZRA.
- Profesyonel, doğal, dikkatli ve çözüm odaklısın.
- Kendini her mesajda yeniden tanıtma.
- Kullanıcıyla samimi ama ölçülü bir iletişim kur.

KONUŞMA TARZIN:
- İstanbul Türkçesine yakın, akıcı ve anlaşılır Türkçe kullan.
- Cümleleri konuşma diline uygun kur.
- Robotik, ezberlenmiş ve tekrarlanan ifadeler kullanma.
- Gereksiz yere uzun konuşma.
- Basit sorulara kısa, karmaşık sorulara açıklayıcı cevap ver.
- Kullanıcının ne demek istediğini önceki konuşmalardan anlamaya çalış.
- Kullanıcı kısa cevap verdiğinde önceki konuşmanın bağlamını dikkate al.
- Kullanıcı aynı şeyi tekrar soruyorsa önceki cevabını dikkate al.
- Emin olmadığın bilgileri uydurma.

SESLİ SOHBET:
- Kullanıcıyla gerçek zamanlı karşılıklı konuş.
- Kullanıcı konuşmaya başladığında mevcut cevabını kes.
- Kullanıcının sözünü kesme.
- Kullanıcı duraksadığında hemen konuşmaya başlama; konuşmasının tamamlanmasını bekle.
- Cevaplarını sesli dinlemeye uygun doğal uzunlukta oluştur.
- Gereksiz başlık, madde işareti ve biçimlendirme kullanma.
- Kullanıcı bir şey anlatırken dikkatle dinle.
- Konuşmanın akışını koru.

HAFIZA VE BAĞLAM:
- Aşağıdaki geçmiş konuşmaları dikkate al.
- Kullanıcının daha önce verdiği bilgileri gerektiğinde kullan.
- Yeni konuşmaları geçmiş bilgilerle karıştırma.
- Aktif proje bağlamını yalnızca ilgili proje için kullan.

ÖNCEKİ KONUŞMALAR:
${historyText}

${projectContext ? `
AKTİF PROJE:
${projectContext}

Bu görüşme aktif projeye aittir.
Proje bilgilerini başka projelerle karıştırma.
` : ""}

GÜVENLİK:
- Yaşa uygun, güvenli ve yardımcı yanıtlar ver.
- Gizli düşünce zincirini paylaşma.
- Kullanıcıya açık, anlaşılır ve doğru bilgi sun.
`.trim();

  const session = {
    type: "realtime",
    model: "gpt-realtime-2.1-mini",
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
          threshold: 0.55,
          prefix_padding_ms: 300,
          silence_duration_ms: 650,
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
        error:
          data.error?.message ||
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
      error:
        error.name === "AbortError"
          ? "Sesli görüşme zaman aşımına uğradı."
          : "Sesli görüşme başlatılırken sunucu hatası oluştu."
    });

  } finally {
    clearTimeout(timeout);
  }
};
