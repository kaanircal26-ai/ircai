export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (request.method !== "POST") {
      return new Response("IRCAI API aktif", {
        headers: cors
      });
    }

    try {
      if (!env.GEMINI_API_KEY) {
        throw new Error("API anahtarı bulunamadı.");
      }

      const { prompt } = await request.json();

      if (!prompt || typeof prompt !== "string") {
        return new Response(JSON.stringify({
          error: "Bir mesaj gerekli."
        }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" }
        });
      }

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{
                text: "Sen IRCAI adlı yaratıcı dijital proje platformunun yapay zekâ asistanısın. Türkçe konuş. Kullanıcının fikirlerini analiz et, geliştir ve uygulanabilir projelere dönüştür. Açık, yaratıcı ve profesyonel ol."
              }]
            },
            contents: [{
              role: "user",
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1200
            }
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return new Response(JSON.stringify({
          error: data.error?.message || "Gemini bağlantı hatası."
        }), {
          status: response.status,
          headers: { ...cors, "Content-Type": "application/json" }
        });
      }

      const answer =
        data.candidates?.[0]?.content?.parts
          ?.map(part => part.text || "")
          .join("") || "Yanıt oluşturulamadı.";

      return new Response(JSON.stringify({ answer }), {
        headers: { ...cors, "Content-Type": "application/json" }
      });

    } catch (error) {
      return new Response(JSON.stringify({
        error: error.message || "Bir hata oluştu."
      }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" }
      });
    }
  }
};
