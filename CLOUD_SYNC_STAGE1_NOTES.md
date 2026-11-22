# TOZRA Stage 1 — Cloud sync

This build adds authenticated JSON backup/sync through `public.user_data` for:
- projects and project notes/messages
- general conversation history
- Tasks & Calendar (tasks + events)
- personal-home tasks, notes, weekly plan
- TOZRA personal memory

## Setup required
1. In Supabase SQL Editor, inspect existing `public.user_data` rows before running `TOZRA_CLOUD_SYNC_STAGE1.sql`. If a table already exists with a different schema, do not blindly replace it; compare columns and adapt it.
2. Ensure RLS is enabled and each authenticated user can access only the row where `user_id = auth.uid()`.
3. Deploy the project. No service-role key is used in the browser.

## Behavior
- Guest data remains local.
- Authenticated data is stored under a user-specific localStorage namespace.
- First sync uploads that account's existing local data if no cloud row exists; an existing cloud row is treated as authoritative and hydrated locally.
- Subsequent local saves are debounced and upserted to the user's row.
- If the table is unavailable, the app continues using local storage and logs a cloud-sync warning; no local data is deleted.

## Important limitations in this stage
- This is a single JSON document per account, not a multi-device real-time merge engine. The most recently uploaded account snapshot becomes the cloud snapshot. Avoid editing the same account simultaneously on multiple devices until conflict-aware merging is implemented.
- Database availability, RLS, deployed API configuration, and actual cross-device behavior must be verified in the user's Supabase project.
