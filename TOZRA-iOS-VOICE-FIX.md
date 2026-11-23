# TOZRA iOS Voice Fix

- The home and chat voice buttons use the browser voice fallback, not the separate WebRTC function.
- iOS audio output is primed synchronously from the original tap, before asynchronous Supabase session restoration.
- iPhone/iPad use MediaRecorder input and the existing authenticated `/api/transcribe` + `/api/chat` flow.
- Speech synthesis is resumed before playback, prefers an available Turkish voice, and recovers the microphone loop after a speech error.
- Static voice script and service-worker cache versions were incremented to prevent stale code from being served.

No API keys or environment variables were changed.
