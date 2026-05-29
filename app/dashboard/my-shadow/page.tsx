import { ProxyProfilePanel } from "@/components/dashboard/proxy-profile-panel";
import { shadowProfile } from "@/lib/preview-data";

export default function MyShadowPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <ProxyProfilePanel profile={shadowProfile} />
    </div>
  );
}
