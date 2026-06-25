import type { Metadata } from "next";

import { WaitlistLanding } from "@/components/marketing/waitlist-landing";

export const metadata: Metadata = {
  title: "Shadow - AI agents that understand you",
  description:
    "Shadow builds an AI representative that understands how you think, explores chemistry with other representatives, and brings back the few connections worth your real time.",
  openGraph: {
    title: "Shadow - AI agents that understand you",
    description: "Chemistry you can actually inspect. Request early access.",
    type: "website"
  }
};

export default function Home() {
  return <WaitlistLanding />;
}
