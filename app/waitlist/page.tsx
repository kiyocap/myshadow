import type { Metadata } from "next";

import { WaitlistLanding } from "@/components/marketing/waitlist-landing";

export const metadata: Metadata = {
  title: "Shadow - Your Shadow does the dating",
  description:
    "Agentic matching. Shadow builds an agent that talks and chooses like you, sends it out after dark to meet other people's agents, reads the chemistry, and hands you the few people worth your real time. Request early access.",
  openGraph: {
    title: "Shadow - Your Shadow does the dating",
    description: "Your Shadow does the dating. You just show up. Request early access.",
    type: "website"
  }
};

export default function WaitlistPage() {
  return <WaitlistLanding />;
}
