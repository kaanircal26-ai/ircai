const { requireUser } = require("./_auth");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Sadece POST isteği destekleniyor." });
  }

  const user = await requireUser(req, res);
  if (!user) return;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      success: false,
      error: "OPENAI_API_KEY bulunamadı. Vercel ortam değişkenlerini kontrol et."
    });
  }

  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  if (!prompt) {
    return res.status(400).json({ success: false, error: "Görsel açıklaması boş olamaz." });
  }
  if (prompt.length > 5000) {
    return res.status(413).json({ success: false, error: "Görsel açıklaması en fazla 5000 karakter olabilir." });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  try {
    const upstream = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-flare",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "medium",
        output_format: "png"
      }),
      signal: controller.signal
    });

    const payload = await upstream.json().catch(() => ({}));
    const requestId = upstream.headers.get("x-request-id") || undefined;

    if (!upstream.ok) {
      const providerMessage = String(payload?.error?.message || "").slice(0, 500);
      console.error("TOZRA image provider error:", {
        status: upstream.status,
        requestId,
        message: providerMessage
      });

      let userMessage = "Görsel sağlayıcısından yanıt alınamadı.";
      if (upstream.status === 401) {
        userMessage = "OpenAI API anahtarı geçersiz. Vercel OPENAI_API_KEY ayarını kontrol et.";
      } else if (upstream.status === 429) {
        userMessage = "Görsel API kotası veya bakiyesi yetersiz ya da istek sınırına ulaşıldı.";
      } else if (upstream.status === 400) {
        userMessage = providerMessage
          ? `OpenAI görsel isteğini reddetti: ${providerMessage}`
          : "OpenAI görsel isteğini kabul etmedi. Model ve istek ayarlarını kontrol et.";
      } else if (upstream.status === 403) {
        userMessage = "Bu API projesinin görsel oluşturma erişimi yok.";
      } else if (upstream.status >= 500) {
        userMessage = "OpenAI görsel servisi geçici olarak hata verdi. Biraz sonra tekrar dene.";
      }

      return res.status(upstream.status === 429 ? 429 : 502).json({
        success: false,
        error: userMessage,
        requestId
      });
    }

    const imageBase64 = payload?.data?.[0]?.b64_json;
    if (typeof imageBase64 !== "string" || !imageBase64) {
      console.error("TOZRA image API returned no image data.", requestId);
      return res.status(502).json({
        success: false,
        error: "OpenAI yanıt verdi ancak görsel verisi dönmedi.",
        requestId
      });
    }

    return res.status(200).json({
      success: true,
      image: `data:image/png;base64,${imageBase64}`,
      requestId
    });
  } catch (error) {
    console.error("TOZRA image generation route error:", error);
    if (error?.name === "AbortError") {
      return res.status(504).json({
        success: false,
        error: "Görsel oluşturma zaman aşımına uğradı. Tekrar deneyebilirsin."
      });
    }
    return res.status(500).json({
      success: false,
      error: "Görsel oluşturulurken sunucu hatası oluştu."
    });
  } finally {
    clearTimeout(timeout);
  }
};
