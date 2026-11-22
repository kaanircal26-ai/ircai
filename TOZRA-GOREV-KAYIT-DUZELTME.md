# TOZRA Görev ve Takvim Kayıt Düzeltmesi

- Görev ve etkinlik kayıtları artık hesap kapsamlı `ircal_tasks_calendar_v1` anahtarına doğrudan yazılır.
- Yerel kayıt yazıldıktan sonra değer geri okunarak doğrulanır.
- Yerel kayıt başarısız olursa kullanıcıya hata gösterilir; form temizlenmez ve görev listede kalıcıymış gibi gösterilmez.
- Başarılı yerel kayıttan sonra bulut senkronizasyonu planlanır ve en iyi çabayla anında gönderim tetiklenir.
- Kişisel çalışma alanındaki isteğe bağlı not/haftalık plan alanları bulunmadığında betik artık hata verip durmaz.

Not: JavaScript sözdizimi kontrolleri yapıldı. Canlı Supabase/Vercel ortamında gerçek kullanıcı hesabıyla uçtan uca test henüz yapılmadı.
