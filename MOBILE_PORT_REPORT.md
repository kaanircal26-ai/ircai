# TOZRA native port — implementation record

## Implemented in this package

- Native screens for Home, AI Chat, Projects, Creative Studio, Tasks & Calendar, Atlas and Account.
- Existing Supabase authentication and authenticated server calls to `/api/chat`, `/api/generate-image`, and `/api/transcribe`.
- AI Agent mode, chat history, project context, and user-provided memory context.
- Gallery and camera image/video input. Images are normalized to JPEG; videos are sampled at up to three chronological thumbnail frames each, with the server's combined 15-image/frame limit enforced.
- Project records with goals, milestones, project tasks and notes.
- Creative Studio modes matching the web mode set: idea, image, video storyboard, brand, content and campaign.
- Native calendar with dated tasks and events.
- Native map with satellite/terrain/standard layers, saved locations, place search and building display toggle.
- Account-scoped local persistence and compatibility mapping to the web `public.user_data` JSON document for projects, tasks/events, notes, weekly plan, conversations, personal memory and Atlas saved places/layer preferences.
- Web Atlas local-storage keys are now account-scoped and included in the existing web cloud-sync key list, so the same saved Atlas items/preferences can move between web and native when the existing `user_data` table and RLS policies are configured.

## Not yet one-to-one with the web application

- The Cesium 3D globe, Cesium terrain provider, globe-specific borders/entities and every Atlas discovery panel are not reproduced as native 3D Cesium in this package. Atlas is a native map adaptation with satellite/terrain/building display and saved places.
- The browser WebRTC real-time voice conversation is not a native WebRTC session here. Native voice input is recording plus server transcription, followed by normal AI chat.
- Video Studio creates scripts/storyboards/production plans; neither web nor this native flow renders a finished video file.

These limitations are explicitly listed rather than represented as complete parity.
