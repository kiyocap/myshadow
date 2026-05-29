import Link from "next/link";

import { CreateProxyFlow } from "@/components/proxy/create-proxy-flow";

export default function CreateShadowPage() {
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
