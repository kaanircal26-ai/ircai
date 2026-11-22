# TOZRA Auth & Avatar Fix

- Supabase initialization now shares a single in-flight Promise to prevent concurrent callers from observing a premature guest session.
- Authenticated API requests wait for initialization and use the current Supabase session; a refresh is attempted if the access token is missing.
- Auth state changes refresh account UI and ensure a per-user animal avatar.
- Eight local SVG avatar assets are included, avoiding missing `/avatars/*.svg` requests.
- Avatar selection is persisted in Supabase user metadata and locally as a fallback.
- Service worker cache version bumped to v21 and all avatar assets added to the app shell.

## Validation
- `npm run check` passed.
- All inline JavaScript blocks in `index.html` passed `node --check`.
- All eight avatar SVG assets exist and are non-empty.

## Deployment note
After deploying, test Google sign-in and a protected feature (chat / Creative Studio image generation). If the browser still serves an older service worker, reload once after the new deployment; the v21 worker will replace the prior cache.
