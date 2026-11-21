# TOZRA AI Home Refresh

## Visual updates
- Reworked the opening splash into a soft aqua-to-violet animated gradient with a geometric TOZRA mark.
- Reworked the home workspace hero into a personal AI-assistant landing screen inspired by the supplied reference image.
- Added quick prompt chips and a home voice shortcut that route into the existing chat and voice controls.
- Updated the service-worker cache version and PWA theme colors so deployed clients can load the refreshed interface.

## Preserved
- Existing Supabase authentication and session handling.
- Existing chat, AI API routes, conversation history and memory logic.
- Existing project management and Creative Studio.
- Existing tasks/calendar, settings, membership and voice modules.

## Validation
- `npm run check` passed.
- Inline JavaScript syntax checks passed.
- HTML parse and required element-ID checks passed.
- Live Vercel/Supabase and physical iPhone testing still need to be performed after deployment.

## Deployment
Upload the contents of this ZIP to the root of the existing GitHub repository, replacing matching active files. Keep environment variables and Supabase configuration unchanged. After deployment, hard-refresh the site. For the iPhone home-screen installation, remove the old shortcut and add the site again if it continues to show cached visuals.
