# TOZRA Nexus & Universe — Release Notes

## Added

### TOZRA Nexus
- A separate workspace page for a personal project/idea knowledge graph.
- Existing TOZRA projects are displayed as project nodes.
- Users can add idea nodes, search the network, inspect node details, and create/remove no existing data while adding explicit relationships.
- Relationships and ideas are stored per account in `tozra-nexus-universe-v1`.

### TOZRA Universe
- A separate digital-universe page with two switchable views: cinematic Galaxy view and minimal constellation view.
- Existing projects appear as planets; user-created Nexus ideas appear as stars.
- Selecting a project provides an action to open that project in the existing project workspace.

## Integration and preservation
- Added sidebar navigation entries for Nexus and Universe; the existing five-item mobile primary navigation is unchanged.
- Added the new storage key to the existing cloud-sync allowlist so signed-in users can sync Nexus/Universe data using the current cloud-sync mechanism.
- Existing chat, projects, Creative Studio, tasks/calendar, voice, and authentication code were not intentionally rewritten.
- New pages inherit the existing theme and include dark-theme styles and responsive layouts.

## Validation
- `npm run check` passed (API syntax and existing context/chat/Realtime tests).
- All 12 inline JavaScript blocks passed `node --check`.
- HTML parser validation passed.
- Existing duplicate IDs were found in the source (`authNotice`, `profilePlansButton`, `profileSettingsButton`); `universeGoProjects` is dynamically replaced within its own detail panel and does not coexist with a second instance.
- A headless Chromium smoke run did not complete within the available timeout, so browser interaction and real-device testing are still required.

## Notes / limitations
- Universe Galaxy is a lightweight CSS-based 3D-inspired scene, not a WebGL/Three.js renderer. This keeps the feature dependency-free and lighter on mobile devices.
- Project nodes are derived from the existing project store. Idea nodes and links are managed in Nexus.
- The new modules do not invoke AI APIs and do not add AI usage cost.
