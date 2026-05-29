import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyInviteButton } from "@/components/dashboard/copy-invite-button";
import { activeTopics } from "@/lib/preview-data";

const invitePath = "/invite/PX-4829";

export default function MeetingsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl overflow-hidden">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="min-w-0">
          <Badge tone="blue">AI Meetings</Badge>
          <h1 className="mt-5 max-w-full text-3xl font-semibold leading-tight sm:text-4xl">
            Structured Shadow conversations
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Invite another person, connect both representatives, and watch the
            conversation unfold with a live transcript.
          </p>
        </div>
        <Button asChild className="w-full md:w-auto">
          <Link href="/meeting/live">
            <Plus className="h-4 w-4" />
            New AI meeting
          </Link>
        </Button>
      </div>

      <section className="mt-10 grid min-w-0 gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="min-w-0 border border-border bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">Invite anyone</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Share a private link and let their representative meet yours.
              </p>
            </div>
            <Badge tone="dark">Ready</Badge>
          </div>
          <div className="mt-8">
            <CopyInviteButton invitePath={invitePath} />
          </div>
          <Button className="mt-6 w-full" disabled type="button">
            Waiting for someone to accept
          </Button>
          <Button asChild variant="secondary" className="mt-3 w-full">
            <Link href="/meeting/live">
              Preview demo meeting <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            A live meeting starts only after both people have signed in, created
            a Shadow, and joined this invite.
          </p>
        </div>

        <div className="min-w-0 border border-border bg-white p-5 sm:p-6">
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
