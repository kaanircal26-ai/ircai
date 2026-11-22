# TOZRA v27 — Fix Pack

- Google OAuth sign-in and registration actions added through Supabase Auth. Requires Google provider configuration in Supabase; see GOOGLE_OAUTH_KURULUM.md.
- Avatar rendering hardened with eager loading, fallback image, and stable per-account metadata assignment.
- Realtime voice requires a valid signed-in session with a clear login prompt, uses the existing low-cost GPT-Realtime-2.1-mini session, explicitly requests audio output, adds initial greeting, improves mobile audio element setup and connection diagnostics.
- Shared icon styling aligned across desktop navigation, mobile dock, and creative tool icon components.
- Service worker cache bumped and voice script cache-busted to avoid stale mobile/desktop JS.

The currently active minimal-home markup intentionally contains no right-side plugin rail; the previous workspace rail was removed when the home screen was simplified. This fix pack keeps the home screen minimal and styles the existing visible navigation/tool icon components instead of restoring extra home content.
