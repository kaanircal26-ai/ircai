# TOZRA Mobile — workspace refresh

## This update
- Restored the missing `src/theme.js` and `src/supabase.js` modules referenced by `App.js`.
- Added the Expo package manifest and Babel configuration required to install and launch the native app.
- Added the icon, adaptive icon and splash image files referenced by `app.json`.
- Reworked the native home screen into a fuller creative workspace: daily overview, progress, six working-area shortcuts, today's tasks, recent projects and weekly planning.
- Replaced the former green-heavy accents with charcoal, warm gray and restrained champagne/beige accents.
- Kept the existing authentication, chat, project, studio, task, media and storage handlers in `App.js` rather than replacing them with static mock screens.

## Important boundaries
- The native build still needs dependency installation and device testing on the developer machine.
- Atlas, Nexus, Universe, Market and Social are present in the web application but are not implemented as separate native screens in this mobile source. The current native navigation exposes the native screens already present in `App.js`.
- The native Web Studio screen currently creates a structured brief for TOZRA AI; the full HTML editor and preview are in the web application.
- API secrets remain on the server. The app retrieves only the Supabase public client configuration from `/api/config`.

## Local setup
1. Run `npm install`.
2. Run `npx expo install --fix` to align Expo modules with the installed SDK.
3. Run `npx expo-doctor`.
4. Run `npx expo start` and test on a real iPhone/Android device.
5. Test login, chat, media analysis, image generation, project persistence and calendar sync before distributing a beta build.
