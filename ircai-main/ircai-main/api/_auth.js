async function requireUser(req, res) {
  const authorization = req.headers.authorization || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    res.status(401).json({
      success: false,
      error: "Bu işlem için TOZRA hesabına giriş yapmalısın."
    });
    return null;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    res.status(503).json({
      success: false,
      error: "Supabase sunucu yapılandırması eksik."
    });
    return null;
  }

  try {
    const response = await fetch(`${supabaseUrl.replace(/\/+$/, "")}/auth/v1/user`, {
      method: "GET",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${match[1]}`
      }
    });

    if (!response.ok) {
      res.status(401).json({
        success: false,
        error: "Oturumun geçersiz veya süresi dolmuş. Lütfen yeniden giriş yap."
      });
      return null;
    }

    const user = await response.json();
    if (!user || typeof user.id !== "string") {
      res.status(401).json({
        success: false,
        error: "Kullanıcı oturumu doğrulanamadı."
      });
      return null;
    }

    return user;
  } catch (error) {
    console.error("Supabase auth doğrulama hatası:", error);
    res.status(502).json({
      success: false,
      error: "Hesap doğrulama servisine ulaşılamadı."
    });
    return null;
  }
}

module.exports = { requireUser };
