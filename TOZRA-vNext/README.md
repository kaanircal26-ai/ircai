# TOZRA — consolidated release

This folder is the single deployable application root. It combines the authenticated application, personal-memory module, realtime voice module, and API routes without the duplicate nested `ircai-main/` application folder.

## Deploy

1. Upload the **contents of this folder** to the root of the GitHub repository (not the containing `TOZRA-vNext` folder as an extra nested directory).
2. Deploy the repository on Vercel.
3. Add the environment variables listed in `.env.example` under Vercel → Project → Settings → Environment Variables.
4. In Supabase Auth URL Configuration, set the production Site URL and redirect URL to your actual domain.
5. Redeploy after adding or changing environment variables.

See `SUPABASE_KURULUM.md` for account setup and `RELEASE_NOTES.md` for verified scope and known limitations.

## API routes

- `GET /api/config` — public Supabase client configuration (publishable/anon key only)
- `POST /api/chat` — authenticated AI chat
- `POST /api/transcribe` — authenticated audio transcription
- `POST /api/realtime-session` — authenticated ephemeral realtime session setup
- `POST /api/generate-image` — authenticated image generation endpoint (the current UI does not yet expose a dedicated image-generation screen)

## Important

Never put `GROQ_API_KEY`, `OPENAI_API_KEY`, `TAVILY_API_KEY`, or a Supabase service-role/secret key in frontend code or commit them to GitHub. Only the Supabase publishable/anon key belongs in the browser.
