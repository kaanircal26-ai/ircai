# TOZRA Stage 1 — Altyapı ve bulut senkronizasyonu

- Added account-scoped cloud snapshot sync via Supabase `user_data`.
- Synced projects, conversations, calendar tasks/events, home tasks/notes/weekly plan, and personal memory.
- Kept guest/local mode intact and retained local data if cloud sync is unavailable.
- Added RLS SQL setup and deployment notes.
- Existing UI and feature flows retained; no visual redesign.

See `CLOUD_SYNC_STAGE1_NOTES.md` and `TOZRA_CLOUD_SYNC_STAGE1.sql`.
