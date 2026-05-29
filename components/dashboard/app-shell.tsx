import Link from "next/link";
import { BarChart3, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardMobileNav, DashboardNav } from "@/components/dashboard/dashboard-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f8f8]">
      <aside className="fixed inset-y-0 left-0 hidden w-56 border-r border-border bg-white px-4 py-5 lg:block">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
          <span className="relative flex h-6 w-6 items-center justify-center rounded-full border border-black/25">
            <span className="h-2.5 w-2.5 rounded-full border border-black" />
            <span className="absolute -right-0.5 bottom-1 h-1.5 w-1.5 rounded-full bg-black" />
          </span>
          Shadow
        </Link>
        <div className="mt-7">
          <Button asChild className="w-full justify-start rounded-md">
            <Link href="/create-shadow">
              <Plus className="h-4 w-4" />
              Create Shadow
            </Link>
          </Button>
        </div>
        <div className="mt-8">
          <DashboardNav />
        </div>
        <div className="absolute bottom-5 left-4 right-4 rounded-lg border border-border bg-[#fafafa] p-4">
          <p className="text-sm font-medium">Upgrade to Pro</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Unlimited meetings, deeper model review, and PDF exports.
          </p>
          <Button asChild variant="secondary" size="sm" className="mt-4 w-full">
            <Link href="/dashboard/settings">Upgrade</Link>
          </Button>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-56">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white/90 px-5 backdrop-blur sm:px-8">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Shadow OS</p>
            <Link href="/dashboard" className="block truncate text-sm font-medium">
              Let your AIs meet first.
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" size="icon" aria-label="Create shadow">
              <Link href="/create-shadow">
                <Plus className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="icon" aria-label="Open reports">
              <Link href="/dashboard/reports">
                <BarChart3 className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </header>
        <DashboardMobileNav />
        <main className="max-w-full overflow-x-hidden px-4 py-8 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
