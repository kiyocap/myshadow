# Shadow

Shadow is a premium web app for the idea: "Let your AIs meet first."

It lets people build AI representatives from their values, goals, communication style, and preferences. Before two people meet, their representatives hold a structured conversation and generate a compatibility report.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS with Shadcn-style primitives
- Framer Motion
- PostgreSQL + Prisma
- NextAuth with Google, Apple, and magic link scaffolding
- OpenAI API scaffolding for profile generation, meetings, reports, and embeddings
- Stripe checkout and webhook scaffolding
- Resend magic-link email support

## Run

```bash
cp .env.example .env
node /private/tmp/shadow-npm/package/bin/npm-cli.js install
node /private/tmp/shadow-npm/package/bin/npm-cli.js run dev
```

If macOS blocks the local Next/Prisma native engines because of code-signing in this sandboxed environment, use the WASM fallback scripts:

```bash
node /private/tmp/shadow-npm/package/bin/npm-cli.js run dev:wasm
node /private/tmp/shadow-npm/package/bin/npm-cli.js run build:wasm
```

Production integrations are environment-variable gated. Without keys, the app falls back to high-quality preview data so the full product experience stays explorable.

## Waitlist landing page

A standalone pre-launch marketing page lives at the `/waitlist` route (for example `http://localhost:3000/waitlist`). It uses the brand fonts (Fraunces + Inter) and an "Aurora" periwinkle/lavender accent layered on the existing cream-and-ink palette, with an animated glowing orb motif.

- Page: `app/waitlist/page.tsx` rendering `components/marketing/waitlist-landing.tsx`
- Email capture API: `app/api/waitlist/route.ts` (validates with zod)
- Storage: `lib/waitlist-store.ts` persists signups to `data/waitlist.json` (git-ignored). This is a real, working local store, not a fake. It returns a playful queue position (with a small cosmetic head-start) and remaining early-access spots (capped at 1,000).

### Connecting a real email provider

The single integration point is `app/api/waitlist/route.ts`. Signups are already persisted locally; to mirror them to a real provider, fill in the `TODO(integration)` block. The project already depends on `resend`, so the quickest path is Resend audiences:

```ts
if (process.env.RESEND_API_KEY && process.env.RESEND_AUDIENCE_ID) {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.contacts.create({ email, audienceId: process.env.RESEND_AUDIENCE_ID });
}
```

Mailchimp and ConvertKit work the same way (one POST to their list/form endpoint). You can also add a `Waitlist` model to Prisma and persist there instead of the JSON file.

## Product Surfaces

- Landing page with premium positioning, trust cues, and shareable compatibility framing
- Sign-in page for Google, Apple, and magic link
- Dashboard shell with Home, My Shadow, AI Meetings, Reports, and Settings
- Create Shadow flow with guided answer selection and LLM Import
- Live AI Meeting UI with animated representative nodes and transcript
- Compatibility report titled "What Your AIs Learned"

## Data Model

The Prisma schema includes Auth.js models, Shadow profiles, imports, embeddings, meetings, transcript messages, compatibility reports, subscriptions, and share cards.
