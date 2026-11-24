# TOZRA AI Reliability — Stage 8

## Scope
Improve the existing chat engine without adding user-facing features or changing the provider/model.

## Changes
- Kept the current Groq model (`qwen/qwen3.8-27b`) and existing API contract.
- Removed broad research triggers that treated a standalone year (2025–2027) or every comparison request as a web-search request. Explicit research/current-information and price/news/regulatory phrases still trigger the existing Tavily path.
- Added a server-side Groq request helper with consistent JSON parsing, empty-response checks, provider status handling, and retry-after propagation.
- Preserved the existing 15-image request capability while respecting Qwen 3.8 27B's documented three-image-per-request limit: images are analyzed in batches of up to three, then synthesized into one answer.
- Prevented API/network error notices from being stored as assistant messages in general and project conversation histories, so transient failures no longer contaminate future AI context.
- Kept existing UI, chat endpoint, authentication, model, and user-facing features unchanged.

## Verification
- `npm run check`
- Chat API regression test verifies normal 2026 project prompts do not require Tavily.
- Chat API regression test verifies four images are handled as two vision batches plus one synthesis request, with no request exceeding three images.
- Existing syntax, memory, voice, Atlas, and inline-script tests remain part of the check suite.

## Limits
Tests use mocked Supabase and Groq responses. Live Groq/Tavily credentials, live Vercel deployment, and real device tests are not available in this environment. Multi-image requests use additional model calls and may take longer than single-image requests.
