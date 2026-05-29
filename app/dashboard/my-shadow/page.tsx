import { ProxyProfilePanel } from "@/components/dashboard/proxy-profile-panel";
import { proxyProfile } from "@/lib/sample-data";

export default function MyShadowPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <ProxyProfilePanel profile={proxyProfile} />
    </div>
  );
}
