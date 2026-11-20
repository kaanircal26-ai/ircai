const { requireUser } = require("./_auth");

module.exports = async function handler(req, res) {
  const user = await requireUser(req, res);
  if (!user) return;

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Sadece POST isteği destekleniyor."
    });
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "GROQ_API_KEY sunucu ayarlarında bulunamadı."
      });
    }

    const body = req.body || {};
    const audio = body.audio;
    const mimeType = typeof body.mimeType === "string"
      ? body.mimeType
      : "audio/webm";

    if (typeof audio !== "string" || !audio.length) {
      return res.status(400).json({
        success: false,
        error: "Ses kaydı gönderilmedi."
      });
    }

    const allowedTypes = [
      "audio/webm",
      "audio/mp4",
      "audio/ogg",
      "audio/wav",
      "audio/mpeg",
      "audio/mpga",
      "audio/m4a"
    ];
    const normalizedType = mimeType.split(";")[0].toLowerCase();

    if (!allowedTypes.includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        error: "Desteklenmeyen ses formatı."
      });
    }

    const estimatedBytes = Math.floor(audio.length * 3 / 4);
    if (estimatedBytes > 3 * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        error: "Ses kaydı 3 MB sınırını aşıyor."
      });
    }

    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(audio)) {
      return res.status(400).json({
        success: false,
        error: "Ses verisi geçersiz."
      });
    }

    const buffer = Buffer.from(audio, "base64");
    const extension = normalizedType === "audio/mp4" || normalizedType === "audio/m4a"
      ? "m4a"
      : normalizedType === "audio/ogg"
        ? "ogg"
        : normalizedType === "audio/wav"
          ? "wav"
          : normalizedType === "audio/mpeg" || normalizedType === "audio/mpga"
            ? "mp3"
            : "webm";

    const form = new FormData();
    form.append(
      "file",
      new Blob([buffer], { type: normalizedType }),
      `tozra-voice.${extension}`
    );
    form.append("model", "whisper-large-v3-turbo");
    form.append("language", "tr");
    form.append("response_format", "json");
    form.append("temperature", "0");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    let response;
    try {
      response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`
        },
        body: form,
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    const raw = await response.text();
    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      return res.status(502).json({
        success: false,
        error: "Ses servisi geçerli bir yanıt vermedi."
      });
    }

    if (!response.ok) {
      console.error("Groq transcription error:", result);
      return res.status(response.status === 429 ? 429 : 502).json({
        success: false,
        error: result.error?.message || "Ses yazıya dönüştürülemedi."
      });
    }

    const text = typeof result.text === "string" ? result.text.trim() : "";
    if (!text) {
      return res.status(502).json({
        success: false,
        error: "Konuşmadan metin çıkarılamadı."
      });
    }

    return res.status(200).json({
      success: true,
      text,
      model: "whisper-large-v3-turbo"
    });
  } catch (error) {
    console.error("TOZRA transcription error:", error);
    return res.status(error.name === "AbortError" ? 504 : 500).json({
      success: false,
      error: error.name === "AbortError"
        ? "Ses işleme zaman aşımına uğradı."
        : "Ses işlenirken beklenmeyen bir hata oluştu."
    });
  }
};
