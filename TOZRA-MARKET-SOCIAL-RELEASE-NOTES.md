# TOZRA Market & Social – Release Notes

## Base
- Built on the latest TOZRA Nexus–Universe update package.
- Existing workspace, chat, projects, Creative Studio, tasks/calendar, Nexus, Universe, authentication and Realtime files were retained.

## TOZRA Market
- Added a premium marketplace page and navigation entry.
- Added 20 TOZRA Originals starter template listings across business, social, design, project, education and productivity categories.
- Added search, category filters, sorting, favorites and template detail previews.
- Added template download as a structured JSON starter specification.
- Added a creator upload flow with metadata, category and free/paid selection.
- Uploaded files are stored in browser IndexedDB (up to 5 MB); listing metadata is account-scoped and included in the existing cloud JSON sync.
- Creator uploads remain local drafts in this release. Public listing, moderation, server file storage and payment/payout processing are not implemented.

## TOZRA Social
- Added Creator and Business modes in one Social workspace.
- Added multiple brand workspaces and per-brand content records.
- Added content composer for platform, content type, text, schedule date and draft/planned status.
- Added monthly calendar, content queue, recent content and local planning analytics.
- Added account center UI for Instagram, TikTok, YouTube, Facebook, LinkedIn and X.
- Account connection buttons clearly indicate that official OAuth/API configuration is required. No false connected state or automatic publishing is presented.
- Team invitations, roles, approval workflows and platform analytics are future server/API work.

## Persistence
- Added `tozra-market-v1` and `tozra-social-v1` to the existing account-scoped JSON cloud sync key list.
- User-uploaded binary files remain on the device in IndexedDB; only upload metadata syncs.

## Validation performed
- All inline JavaScript blocks passed `node --check`.
- Existing `npm run check` suite passed: context, chat API mock (text/vision limits), and Realtime API mock.
- HTML id audit found no duplicate IDs and confirmed both new page containers.
- Full browser interaction testing against a live authenticated Supabase account and platform OAuth credentials was not possible in this environment.
