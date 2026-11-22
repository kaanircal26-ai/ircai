# TOZRA v26 — Voice & Identity Update

## Included
- Replaced the app's visible brand marks with one shared TOZRA logo asset (`tozra-logo.svg`).
- Regenerated the PWA/iOS icon files from the same logo artwork.
- Added eight cute animal avatar illustrations. Each authenticated account receives a random animal saved in Supabase user metadata, so it remains consistent for that account.
- Replaced the top-right account initial with the animal avatar and used the same avatar in the profile screen.
- Added persistent Light / Dark theme selection to the Profile screen. The default remains the existing light theme.
- Refreshed navigation, quick-tool and plugin-style icon treatments to use a consistent TOZRA icon language.
- Increased the motion of the home assistant orb with layered orbit, halo, particle and core animations.
- Connected the home-page conversation button directly to the existing full-screen Realtime Voice experience.
- Added microphone-level visualization to the voice screen orb and cleaned up its animation resources when a call ends.
- Bumped the service-worker cache and voice script cache versions.

## Preserved
- Existing project, chat, Creative Studio, tasks/calendar, authentication, Supabase sync, memory, API routes and stored user data.
- Existing Realtime WebRTC session endpoint and server-side API key handling.

## Checks performed
- JavaScript syntax checked for all inline scripts and `voice.js`.
- CSS parsed without top-level syntax errors.
- SVG assets and both manifest JSON files validated.
- HTML parsed; no duplicate element IDs found.
- ZIP integrity checked after packaging.

## Not verified in this environment
- A live microphone permission flow and real OpenAI Realtime call (requires the deployed API key, HTTPS origin, microphone permission and available API credits).
- Cross-device avatar metadata persistence against the user's live Supabase project.
- Visual checks on physical iPhone and Android devices.
