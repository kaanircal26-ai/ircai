# TOZRA Visual Refresh

- Preserved the active top-level TOZRA app and its existing IDs, scripts, API routes, auth, projects, chat, memory, and local data logic.
- Refreshed the home workspace styling toward the selected premium creative-workspace reference: forest green, warm light canvas, white cards, natural lime accents (no neon).
- Replaced the splash mark and app icon artwork; updated Apple touch icon, PWA icon, favicon, manifest theme colors, and service-worker cache version.
- Nested duplicate project copies and embedded ZIP backups were intentionally excluded from this clean delivery to prevent accidentally deploying an older copy.

## Deploy
Upload the contents of this folder to the root of the existing GitHub repository, replacing the matching active files. Keep Vercel environment variables and Supabase settings unchanged. After deployment, hard refresh the browser. On iPhone, remove the old home-screen shortcut and add the site to the Home Screen again to refresh the installed icon.

This package was statically checked only; live Vercel/Supabase and physical iPhone tests remain to be done.
