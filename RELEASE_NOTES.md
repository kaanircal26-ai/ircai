# TOZRA AI 2.0 — 2026-11-21

## AI improvements in this update

- Kept the existing Groq model (`qwen/qwen3.8-27b`) and API route; no provider or key change is required.
- Raised the response budget from 800 tokens to 2,048 for general/creative requests and 3,072 for coding, analysis, planning, and agent-mode requests.
- Expanded usable conversation history from 10 to 12 recent messages.
- Added a total history character budget so long conversations do not send unbounded context to the model. The newest messages are retained first.
- Added a total personal-memory character budget to keep the most recent memory entries useful without overloading each request.
- Strengthened system instructions for continuity, resolving references from recent context, preserving project decisions, and avoiding repeated questions.
- Project context is now sent through the dedicated `projectContext` API field instead of being concatenated into the user prompt. This avoids duplicating project details in the current message.
- Kept the existing visual interface, account flow, memory module, image/video upload flow, and voice features unchanged.

## Validation

- `node --check api/chat.js` passed.
- All inline JavaScript blocks in `index.html` passed `node --check`.
- Live Groq, Supabase, Vercel, browser, and real-device tests were not run in this environment.

## Deployment

Deploy the contents of the existing project root as usual. Keep the current `GROQ_API_KEY`, Supabase environment variables, and other existing Vercel settings unchanged. No database migration or new environment variable is required for these AI changes.


## Follow-up reliability fix

- Increased the completion budget for planning, analysis, and agent tasks to 8,192 tokens; coding tasks use 6,144 and general tasks use 3,072.
- Added server-side diagnostics for empty model responses and a clearer message when the model reports token-limit exhaustion.
- This is a targeted API change; the interface, authentication, storage, and other features are unchanged.
