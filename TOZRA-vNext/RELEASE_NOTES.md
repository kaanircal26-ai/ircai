# TOZRA consolidated release — 2026-11-21

## Changes in this package

- Promoted the authenticated app from the former nested `ircai-main/` directory to the repository root.
- Consolidated the matching authenticated API handlers, `memory.js`, `voice.js`, icons, manifest, and service worker.
- Removed the duplicate application tree and bundled ZIP files from the deployable project root.
- Retained the existing authenticated image-generation API route.
- Aligned the chat API image limit to 3 images per request, matching the current frontend media preparation and Groq Qwen 3.8 vision limit.
- Increased the default maximum completion budget from 800 to 2048 tokens to reduce premature truncation while remaining bounded.
- Bumped the service-worker cache name so clients fetch the consolidated release instead of reusing the previous cache.
- Added deployment and environment-variable documentation.

## Existing functionality retained

- Supabase email/password account flow
- Authenticated chat, transcription, and realtime-session endpoints
- Local account-scoped conversations/projects and personal memory
- Realtime voice client module
- Existing project workspace UI

## Not implemented or not verified in this package

- Project/chat cloud synchronization to Supabase database (the setup notes describe local browser storage; database sync is not wired end-to-end here).
- Premium subscription checkout, server-side entitlement checks, or advertising.
- A dedicated image-generation screen in the UI (the protected API route is present, but the interface is not connected to it).
- Full creative studio editing tools (the existing project workspace is retained; this is not a full design/video editor).
- Real-device iOS/Android testing, production API tests, and end-to-end browser tests.

## Required environment variables

See `.env.example`. Do not commit real values.
