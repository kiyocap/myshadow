import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyInviteButton } from "@/components/dashboard/copy-invite-button";
import { activeTopics } from "@/lib/sample-data";

const inviteLink = "shadow.ai/invite/PX-4829";

export default function MeetingsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <Badge tone="blue">AI Meetings</Badge>
          <h1 className="mt-5 text-4xl font-semibold">Structured Shadow conversations</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Invite another person, connect both representatives, and watch the
            conversation unfold with a live transcript.
          </p>
        </div>
        <Button asChild>
          <Link href="/meeting/live">
            <Plus className="h-4 w-4" />
            New AI meeting
          </Link>
        </Button>
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="border border-border bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Invite Emily</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Private invite for a two-representative meeting.
              </p>
            </div>
            <Badge tone="dark">Ready</Badge>
          </div>
          <div className="mt-8 flex items-center justify-between border border-border p-4">
            <span className="truncate pr-4 font-mono text-sm">{inviteLink}</span>
            <CopyInviteButton inviteLink={inviteLink} />
          </div>
          <Button asChild className="mt-6 w-full">
            <Link href="/meeting/live">
              Start live AI meeting <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="border border-border bg-white p-6">
          <h2 className="text-lg font-semibold">Topic coverage</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {activeTopics.map((topic) => (
              <div key={topic.topic} className="border border-border p-4">
                <div className="flex items-center gap-2">
                  <span
                    className={
                      topic.status === "complete"
                        ? "h-2 w-2 rounded-full bg-blue-600"
                        : topic.status === "active"
                          ? "h-2 w-2 rounded-full bg-black"
                          : "h-2 w-2 rounded-full bg-muted"
                    }
                  />
                  <p className="text-sm font-medium">{topic.topic}</p>
                </div>
                <p className="mt-3 text-xs capitalize text-muted-foreground">
                  {topic.status}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
