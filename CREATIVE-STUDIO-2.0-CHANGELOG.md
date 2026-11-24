# TOZRA Mobile — Creative Studio 2.0

## Changes
- Reworked the Creative Studio screen into a structured creative workspace.
- Added a guided brief: working title, core brief, target audience, art direction/tone, and platform/use case.
- Added quick-start brief prompts for all six existing modes.
- Added video planning controls for duration, aspect ratio, and scene count; these settings are included in the AI prompt.
- Kept the existing authenticated `/api/generate-image` endpoint for image generation.
- Kept the existing `apiChat` flow for idea, video, brand, content, and campaign work.
- Added saving generated text outputs and image brief metadata into the existing Projects collection. Existing cloud sync already persists Projects.
- Added a follow-up action to continue refining a result in TOZRA AI.
- Kept the UI within the existing dark charcoal / warm neutral / champagne accent theme.

## Honest capability boundary
- Video Studio produces a storyboard and production plan. It does not render a video file.
- Image Studio depends on the existing `/api/generate-image` endpoint and its configured provider.
- No new paid API provider, key, or external service was added.

## Validation
- TypeScript JSX transpilation parse check: passed (0 diagnostics).
- Full Expo dependency install, Expo Doctor, iOS/Android build, and physical-device interaction tests: not run in this environment.
