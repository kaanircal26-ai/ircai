# TOZRA Market & Social – Supabase integration update

## Market
- Creator uploads require an authenticated TOZRA session.
- Files upload to private `market-files` Storage under `<user_id>/<product_id>/<filename>`.
- Product metadata inserts into `public.market_templates` with `status = pending`.
- Market loads rows visible under table RLS policies and displays creator-owned pending items.
- File downloads use the authenticated Supabase Storage client.
- Existing TOZRA Originals, favorites, and local draft data are preserved.
- Paid listings are not enabled: no checkout or payout is implemented.

## Social
- Creator and Business workspaces, brand/content planning, and analytics remain account-scoped through existing `user_data` cloud sync.
- Social network OAuth, scheduled publishing, and platform analytics are not enabled by this update. They require platform developer apps, OAuth credentials, review/permissions, and server-side token handling.

## Vercel variables
Existing `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are used. Never expose `SUPABASE_SECRET_KEY` to the browser.

## Supabase requirements
Requires `public.market_templates`, private `market-files` bucket, and the RLS policies from the SQL setup.

## Validation limits
Static syntax and packaging checks are performed for this update. Live Supabase upload/download and OAuth flows must be tested after deployment.
