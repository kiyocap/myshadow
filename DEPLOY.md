# Shadow web deploy (Vercel)

Production URL: `https://shadowdating.vercel.app`

## One-click deploy

1. Push `main` to GitHub (or connect the repo in the Vercel dashboard).
2. Import the project in Vercel if not already linked (project name: `shadowdating`).
3. Set the environment variables below in **Project Settings > Environment Variables** for Production (and Preview if you test there).
4. Deploy. After deploy, confirm:
   - `https://shadowdating.vercel.app/api/health` returns `{"ok":true,...}`
   - `https://shadowdating.vercel.app/terms` and `/privacy` load without placeholders in the page title/branding.

## Required environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Prisma). |
| `NEXTAUTH_URL` | Yes | Production app URL, e.g. `https://shadowdating.vercel.app`. |
| `NEXTAUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Yes | Same as `NEXTAUTH_URL`. |
| `OPENAI_API_KEY` | Recommended | Without it: profile generation and field meetings use demo fallbacks; voice transcribe returns 501. |
| `OPENAI_MODEL` | Optional | Default `gpt-4o-mini` (turn dialogue + verdict). |
| `OPENAI_TURN_MODEL` | Optional | Override turn-by-turn dialogue model only. |
| `OPENAI_VERDICT_MODEL` | Optional | Override verdict model (e.g. `gpt-4o` for richer reads on Pro plans with `maxDuration` > 60s). |
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

## Live meetings and the 60s serverless cap

Vercel Hobby/Pro default function timeout is **60 seconds**. A live meeting fires many sequential OpenAI calls, so `lib/field/live.ts` caps each conversational stage at **3 turns** (max **10 turns** total) so `/api/field/meet/stream` reliably finishes with a verdict before the wall.

- Prefer **`POST /api/field/meet/stream`** (SSE) from the iOS app — it streams turns as they arrive.
- **`POST /api/field/meet`** (one-shot) uses the same engine but often hits the 60s wall because the response is buffered until the end.
- On plans with **`maxDuration = 300`**, you can raise quality by setting `OPENAI_VERDICT_MODEL=gpt-4o` and optionally increasing turn caps in `live.ts`.

## Graceful degradation without OpenAI

| Route / feature | No `OPENAI_API_KEY` behavior |
|-----------------|------------------------------|
| `POST /api/shadow/generate` | Returns demo profile (`embeddingStatus: "demo"`). |
| `POST /api/field/meet` / `meet/stream` | **502** — live agents only, no demo fallback. |
| `POST /api/shadow/transcribe` | Returns **501** with a clear message. |

Set `OPENAI_API_KEY` before App Store review if reviewers will use voice-note transcription or live AI meetings.

## Legal pages

Terms and Privacy live at `/terms` and `/privacy`. Replace `[COMPANY NAME]`, `[CONTACT EMAIL]`, `[JURISDICTION]`, and `[POSTAL ADDRESS]` in those files before final submission if you have legal entity details.

## CLI deploy (optional)

If the Vercel CLI is installed and authenticated:

```bash
npx vercel --prod
```

## Production domain (`shadowdating.vercel.app`)

The Vercel project name is `shadowdating`; the default production hostname is `https://shadowdating.vercel.app`. After a CLI deploy, point that hostname at the same deployment as your latest production build (not an older static deployment):

```bash
cd /path/to/myshadow
npx vercel --prod                    # note the deployment URL, e.g. shadowdating-xxxxx.vercel.app
npx vercel alias set <deployment-url> shadowdating.vercel.app
# optional: keep tryshadowv1 as a secondary alias on the same deployment
npx vercel alias set <deployment-url> tryshadowv1.vercel.app
```

Update **Production** env vars when switching canonical URL:

- `NEXTAUTH_URL` = `https://shadowdating.vercel.app`
- `NEXT_PUBLIC_APP_URL` = `https://shadowdating.vercel.app`

Then redeploy (or `npx vercel --prod`) so NextAuth and metadata use the new base URL.

Verify after aliasing:

- `https://shadowdating.vercel.app/`
- `https://shadowdating.vercel.app/terms`
- `https://shadowdating.vercel.app/privacy`
- `https://shadowdating.vercel.app/api/health`

`tryshadowv1.vercel.app` can remain as an extra alias on the same deployment for bookmarks; it does not need to redirect unless you want a single canonical hostname for SEO.
