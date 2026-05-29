import Link from "next/link";

import { SignInPanel } from "@/components/auth/sign-in-panel";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  const providers = {
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    apple: Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET),
    email: Boolean(process.env.RESEND_API_KEY)
  };

  return (
    <main className="min-h-screen bg-background px-5 py-8 sm:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="text-sm font-semibold">
          Shadow
        </Link>
        <Link href="/" className="text-sm text-muted-foreground">
          Back
        </Link>
      </div>
      <section className="mx-auto grid min-h-[calc(100vh-88px)] max-w-6xl gap-12 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-medium text-blue-700">Secure access</p>
          <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-normal sm:text-6xl">
            Sign in to keep your representative private.
          </h1>
          <p className="mt-6 max-w-lg leading-7 text-muted-foreground">
            Shadow keeps imports, meetings, and reports behind explicit access.
            Continue with a private provider or send yourself a secure magic link.
          </p>
        </div>
        <SignInPanel providers={providers} />
      </section>
    </main>
  );
}
