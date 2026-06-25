"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  Compass,
  Home,
  MessageSquare,
  Settings
} from "lucide-react";

import { cn } from "@/lib/utils";

export const navItems: Array<{
  href: Route;
  label: string;
  icon: typeof Home;
  badge?: string;
}> = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/my-shadow", label: "My Shadow", icon: Bot },
  { href: "/dashboard/discover", label: "Discover", icon: Compass, badge: "5" },
  { href: "/dashboard/meetings", label: "AI Meetings", icon: MessageSquare },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings }
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href as string));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex h-10 items-center gap-3 border-l-2 border-transparent px-3 text-sm text-muted-foreground transition-colors hover:text-foreground",
              active && "border-claret font-medium text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge && !active && (
              <span className="rounded-full bg-claret px-1.5 py-0.5 text-[10px] font-medium leading-none text-paper">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex max-w-full gap-2 overflow-x-auto border-b border-border bg-card px-4 py-3 sm:px-8 lg:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href as string));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-2 rounded-none border border-transparent px-3 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground",
              active && "border-foreground/20 bg-ink font-medium text-paper hover:border-foreground/20 hover:text-paper"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
            {item.badge && !active && (
              <span className="rounded-full bg-claret px-1.5 py-0.5 text-[10px] font-medium leading-none text-paper">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
