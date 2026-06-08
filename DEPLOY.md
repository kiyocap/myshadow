# Shadow web deploy (Vercel)

Production URL: `https://tryshadowv1.vercel.app`

## One-click deploy

1. Push `main` to GitHub (or connect the repo in the Vercel dashboard).
2. Import the project in Vercel if not already linked (project name: `shadowdating`).
3. Set the environment variables below in **Project Settings > Environment Variables** for Production (and Preview if you test there).
4. Deploy. After deploy, confirm:
   - `https://tryshadowv1.vercel.app/api/health` returns `{"ok":true,...}`
   - `https://tryshadowv1.vercel.app/terms` and `/privacy` load without placeholders in the page title/branding.

## Required environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Prisma). |
| `NEXTAUTH_URL` | Yes | Production app URL, e.g. `https://tryshadowv1.vercel.app`. |
| `NEXTAUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Yes | Same as `NEXTAUTH_URL`. |
| `OPENAI_API_KEY` | Recommended | Without it: profile generation and field meetings use demo fallbacks; voice transcribe returns 501. |
| `OPENAI_MODEL` | Optional | Default `gpt-4o-mini`. |
| `OPENAI_EMBEDDING_MODEL` | Optional | Default `text-embedding-3-large`. |
| `OPENAI_TRANSCRIBE_MODEL` | Optional | Default `whisper-1`. |
| `REQUIRE_AUTH` | Optional | Set `true` to require sign-in on web routes. |

OAuth, Stripe, and email vars are only needed if you enable those flows on web.

## Build locally

```bash
npm install
npm run typecheck
npm run build
```

## Graceful degradation without OpenAI

| Route / feature | No `OPENAI_API_KEY` behavior |
|-----------------|------------------------------|
| `POST /api/shadow/generate` | Returns demo profile (`embeddingStatus: "demo"`). |
| `POST /api/field/meet` | Returns deterministic demo run. |
| `POST /api/shadow/transcribe` | Returns **501** with a clear message. |
| Real AI meetings (`generateAIMeeting`) | **502** / meeting marked failed. |

Set `OPENAI_API_KEY` before App Store review if reviewers will use voice-note transcription or live AI meetings.

## Legal pages

Terms and Privacy live at `/terms` and `/privacy`. Replace `[COMPANY NAME]`, `[CONTACT EMAIL]`, `[JURISDICTION]`, and `[POSTAL ADDRESS]` in those files before final submission if you have legal entity details.

## CLI deploy (optional)

If the Vercel CLI is installed and authenticated:

```bash
npx vercel --prod
```
