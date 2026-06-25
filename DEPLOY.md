# Shadow web deploy (Vercel)

Production URL: `https://meetmyshadow.vercel.app`

## One-click deploy

1. Push `main` to GitHub (or connect the repo in the Vercel dashboard).
2. Import the project in Vercel if not already linked (project name: `shadowdating`).
3. Set the environment variables below in **Project Settings > Environment Variables** for Production (and Preview if you test there).
4. Deploy. After deploy, confirm:
   - `https://meetmyshadow.vercel.app/api/health` returns `{"ok":true,...}`
   - `https://meetmyshadow.vercel.app/terms` and `/privacy` load without placeholders in the page title/branding.

## Required environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Prisma). |
| `NEXTAUTH_URL` | Yes | Production app URL, e.g. `https://meetmyshadow.vercel.app`. |
| `NEXTAUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Yes | Same as `NEXTAUTH_URL`. |
| `MOBILE_APPLE_AUDIENCE` | Yes | iOS Sign in with Apple audience / bundle id. For this app: `com.humanityone.shadow`. `APPLE_BUNDLE_ID` or `IOS_BUNDLE_ID` can also be used, but set this explicitly for release. |
| `OPENAI_API_KEY` | Recommended | Without it: profile generation and field meetings use demo fallbacks; voice transcribe returns 501. |
| `OPENAI_MODEL` | Optional | Default `gpt-4o-mini` (turn dialogue + verdict). |
| `OPENAI_TURN_MODEL` | Optional | Override turn-by-turn dialogue model only. |
| `OPENAI_VERDICT_MODEL` | Optional | Override verdict model (e.g. `gpt-4o` for richer reads on Pro plans with `maxDuration` > 60s). |
| `OPENAI_EMBEDDING_MODEL` | Optional | Default `text-embedding-3-large`. |
| `OPENAI_TRANSCRIBE_MODEL` | Optional | Default `whisper-1`. |
| `SAFETY_REPORT_EMAIL` | Recommended | Inbox for safety report email notifications. Reports are stored in DB even if email vars are absent. |
| `RESEND_API_KEY` | Optional | Needed only for magic-link email and safety report email delivery. |
| `EMAIL_FROM` | Optional | Required with `RESEND_API_KEY` for outbound email, e.g. `Shadow <support@yourdomain.com>`. |
| `REQUIRE_AUTH` | Optional | Set `true` to require sign-in on web routes. |

Stripe vars are only needed if web checkout is enabled: `STRIPE_SECRET_KEY`, `STRIPE_PREMIUM_PRICE_ID`, and `STRIPE_WEBHOOK_SECRET`.

## Build locally

```bash
npm install
npm run typecheck
npm run build
```

## Database migrations for this RC

These migrations must be applied to the production database before the iOS RC is tested:

- `20260622111500_add_mobile_chat` — `ChatThread`, `ChatMessage`, `MatchLike`
- `20260625100000_add_mobile_blocks` — `UserBlock`
- `20260625103000_add_safety_reports` — `SafetyReport`

The current Vercel build script runs `prisma db push && prisma generate && next build`, which will push schema changes. For a stricter production deploy, run Prisma migrations against production before deploy instead.

## Release smoke test

After deploying the backend and applying schema changes, run:

```bash
SHADOW_BASE_URL=https://meetmyshadow.vercel.app \
SHADOW_DATABASE_URL="$DATABASE_URL" \
node scripts/check-mobile-chat-rc.mjs
```

This creates temporary RC test users/sessions, confirms guest rejection, mutual-match chat, message persistence, report storage, server-side blocking, hidden blocked chat lists, and direct API block enforcement.

## Live meetings and latency

First meetings run **two quick exchanges** (surface + friction test). Each stage opens with an instant line, then one live model reply (~8–15s server-side total). The extra verdict LLM pass is **off by default**; set `SHADOW_SKIP_LIVE_VERDICT=0` and `OPENAI_VERDICT_MODEL=gpt-4o` on Pro/`maxDuration` > 60s for richer grading.

- Prefer **`POST /api/field/meet/stream`** from iOS — turns arrive as they are generated.
- **`POST /api/field/meet`** (one-shot) buffers until the end and often hits the 60s wall.

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

## Production domain (`meetmyshadow.vercel.app`)

The Vercel project name is `shadowdating`; the default production hostname is `https://meetmyshadow.vercel.app`. After a CLI deploy, point that hostname at the same deployment as your latest production build (not an older static deployment):

```bash
cd /path/to/myshadow
npx vercel --prod                    # note the deployment URL, e.g. shadowdating-xxxxx.vercel.app
npx vercel alias set <deployment-url> meetmyshadow.vercel.app
# optional: keep tryshadowv1 as a secondary alias on the same deployment
npx vercel alias set <deployment-url> tryshadowv1.vercel.app
```

Update **Production** env vars when switching canonical URL:

- `NEXTAUTH_URL` = `https://meetmyshadow.vercel.app`
- `NEXT_PUBLIC_APP_URL` = `https://meetmyshadow.vercel.app`

Then redeploy (or `npx vercel --prod`) so NextAuth and metadata use the new base URL.

Verify after aliasing:

- `https://meetmyshadow.vercel.app/`
- `https://meetmyshadow.vercel.app/terms`
- `https://meetmyshadow.vercel.app/privacy`
- `https://meetmyshadow.vercel.app/api/health`

`tryshadowv1.vercel.app` can remain as an extra alias on the same deployment for bookmarks; it does not need to redirect unless you want a single canonical hostname for SEO.
