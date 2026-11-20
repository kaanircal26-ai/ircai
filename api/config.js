module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Sadece GET isteği destekleniyor." });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({
      success: false,
      error: "Supabase bağlantısı henüz yapılandırılmadı. Vercel ortam değişkenlerini kontrol et."
    });
  }

  return res.status(200).json({
    success: true,
    supabaseUrl,
    supabaseKey
  });
};
