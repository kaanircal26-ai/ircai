# TOZRA Web replacement — 2026-11-24

## Included
- Replaced the desktop/web Atlas navigation entry and page with the TOZRA Web workspace.
- Added AI-assisted single-file HTML generation through the existing authenticated `/api/chat` endpoint.
- Added editable HTML/CSS/JS source, isolated live preview, local draft save, reset, and HTML export.
- Added responsive layouts and light/dark theme styling.
- Replaced the mobile Atlas tab and home shortcut with TOZRA Web. The mobile screen sends a structured website brief to TOZRA chat; the full code editor and iframe preview remain in the web experience.
- Removed the mobile Atlas screen and the unused `atlas.js` runtime file. Existing unrelated app modules and old cloud data keys are not rewritten.

## Verification performed
- `npm run check` passes, including syntax checks for the existing server/client JavaScript and TOZRA Web integration assertions.
- `App.js` parsed with TypeScript's JSX parser without syntax diagnostics.

## Known boundaries
- Draft persistence currently uses browser localStorage on the web; cross-device cloud draft sync is not included in this stage.
- HTML export is included. One-click hosting, custom-domain setup, and managed publishing are not included yet.
- Mobile currently provides the AI brief-to-chat workflow, not the full visual code editor/iframe preview.
- A full Expo/iOS/Android build and authenticated live API smoke test could not be run in this workspace because the uploaded archive does not include the `src/` directory or installed project dependencies. Configure the existing environment and run the app build before release.
