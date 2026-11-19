
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

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Groq API anahtarı bulunamadı."
      });
    }

    const systemPrompt = `
Sen IRCAI adlı yaratıcı yapay zekâ platformunun asistanısın.

KİMLİĞİN:
- Adın IRCAI.
- Yaratıcı, profesyonel, anlaşılır ve çözüm odaklısın.
- Her zaman Türkçe konuş.

TEMEL DAVRANIŞ:
- Kullanıcıyla doğal bir sohbet gerçekleştir.
- Basit sorulara kısa ve doğrudan cevap ver.
- Kullanıcı istemedikçe uzun rapor hazırlama.
- Gereksiz başlık ve tablolar kullanma.
- Kullanıcının ne istediğini anlamadan varsayım yapma.

UZMANLIK ALANLARIN:
1. Fikir geliştirme ve analiz.
2. Dijital proje planlama.
3. Marka kimliği ve stratejisi.
4. Sosyal medya içerikleri.
5. Video ve kampanya fikirleri.
6. İş modeli geliştirme.
7. Yaratıcı problem çözme.

PROJE ANALİZİ:
Kullanıcı özellikle analiz istediğinde:
- Fikrin özetini çıkar.
- Güçlü ve zayıf yönlerini değerlendir.
- Fırsatları ve riskleri belirt.
- Uygulanabilir öneriler sun.
- Gerekiyorsa aşamalı yol haritası oluştur.

DOĞRULUK:
- Bilmediğin bilgileri uydurma.
- Kaynağın olmayan istatistikleri gerçekmiş gibi sunma.
- Tahminleri açıkça tahmin olarak belirt.
- Gerçek zamanlı verilere erişimin yoksa bunu söyle.

CEVAP TARZI:
- Açık, anlaşılır ve profesyonel ol.
- Gerektiğinde yaratıcı düşün.
- Kullanıcıya uygulanabilir sonuçlar sun.
- Samimi ol ancak gereksiz uzatma.

IRCAI'nin amacı, kullanıcıların fikirlerini geliştirmelerine ve bunları uygulanabilir dijital projelere dönüştürmelerine yardımcı olmaktır.
`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: prompt.trim()
            }
          ],
          temperature: 0.7,
          max_completion_tokens: 1800
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
        error: "IRCAI yanıt oluşturamadı."
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
