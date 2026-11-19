
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Sadece GET isteği destekleniyor."
    });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return res.status(500).json({
      success: false,
      error: "Supabase yapılandırması eksik."
    });
  }

  return res.status(200).json({
    success: true,
    supabaseUrl: url,
    supabaseKey: key
  });
};
