# TOZRA UI refresh — preview source

## Implemented in App.js
- Replaced the home dashboard with a premium charcoal / warm-stone / champagne layout.
- Added a cinematic 4.7-second animated startup sequence using React Native's built-in Animated API.
- Added fade + upward motion when switching main tabs.
- Preserved the existing task, notes, weekly plan, project, chat, studio, calendar, web and profile component routes and handlers.

## Important source-package limitations
The uploaded `ircai-main 12.zip` does not contain `src/supabase.js`, `src/theme.js`, an `assets/` directory, or a dependency manifest with Expo dependencies. App.js imports the first two and app.json references assets. Therefore this upload is a UI source preview, not a self-contained Expo project and has not been built or tested on a device.

## Not claimed as complete
- Internal redesign of every module screen (chat, projects, studio, tasks, web, profile).
- Android/iOS build validation.
- Runtime verification of Supabase, media, audio or API flows.
