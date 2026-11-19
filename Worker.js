
const SYSTEM_PROMPT = `
Sen IRCAI adlı yaratıcı dijital proje platformunun yapay zekâ asistanısın.

Görevin:
- Kullanıcının fikirlerini analiz etmek.
- Dijital projeler geliştirmek.
- İçerik fikirleri üretmek.
- Marka ve strateji önerileri sunmak.
- Profesyonel, yaratıcı ve uygulanabilir cevaplar vermek.

Her zaman Türkçe konuş.
Cevaplarını açık, düzenli ve anlaşılır hazırla.
`;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=UTF-8"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }

    if (request.method === "GET") {
      return json({
        status: "online",
        service: "IRCAI API",
        message: "IRCAI API aktif."
      });
    }

    if (request.method !== "POST") {
      return json({
        error: "Desteklenmeyen istek yöntemi."
      }, 405);
    }

    try {
      if (!env.GEMINI_API_KEY) {
        return json({
          error: "GEMINI_API_KEY bulunamadı. Cloudflare Secret ayarını kontrol et."
        }, 500);
      }

      const body = await request.json();
      const prompt = body.prompt;

      if (
        typeof prompt !== "string" ||
        prompt.trim().length === 0
      ) {
        return json({
          error: "Lütfen IRCAI'a bir mesaj yaz."
        }, 400);
      }

      if (prompt.length > 12000) {
        return json({
          error: "Mesaj çok uzun. Lütfen kısalt."
        }, 400);
      }

      const geminiResponse = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                { text: SYSTEM_PROMPT }
              ]
            },
            contents: [
              {
                role: "user",
                parts: [
                  { text: prompt.trim() }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1500
            }
          })
        }
      );

      const result = await geminiResponse.json();

      if (!geminiResponse.ok) {
        return json({
          error: result.error?.message || "Gemini API isteği başarısız.",
          status: geminiResponse.status
        }, 502);
      }

      const answer = result.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();

      if (!answer) {
        return json({
          error: "Gemini boş yanıt döndürdü. Tekrar deneyebilirsin."
        }, 502);
      }

      return json({
        success: true,
        answer
      });

    } catch (error) {
      return json({
        error: error.message || "Beklenmeyen bir sunucu hatası oluştu."
      }, 500);
    }
  }
};
