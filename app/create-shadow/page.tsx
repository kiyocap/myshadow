import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { CreateProxyFlow } from "@/components/proxy/create-proxy-flow";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CreateShadowPage({
  searchParams
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { invite } = await searchParams;

  if (!session?.user) {
    const callbackUrl = invite
      ? `/create-shadow?invite=${encodeURIComponent(invite)}`
      : "/create-shadow";

    redirect(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return (
    <main className="min-h-screen bg-background px-5 py-8 sm:px-8">
      <div className="mx-auto mb-8 flex max-w-7xl items-center justify-between">
        <Link href="/" className="text-sm font-semibold">
          Shadow
        </Link>
        <Link href="/dashboard" className="text-sm text-muted-foreground">
          Dashboard
        </Link>
      </div>
      <div className="mx-auto max-w-7xl">
        <CreateProxyFlow />
      </div>
    </main>
  );
}
