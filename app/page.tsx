import { getServerSession } from "next-auth";

import { ProxyLanding } from "@/components/marketing/proxy-landing";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <ProxyLanding
      userEmail={session?.user?.email ?? null}
      userName={session?.user?.name ?? null}
    />
  );
}
