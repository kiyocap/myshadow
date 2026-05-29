"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  Home,
  MessageSquare,
  Settings
} from "lucide-react";

import { cn } from "@/lib/utils";

export const navItems: Array<{
  href: Route;
  label: string;
  icon: typeof Home;
}> = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/my-shadow", label: "My Shadow", icon: Bot },
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
              "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              active && "bg-blue-50 text-blue-700 hover:bg-blue-50 hover:text-blue-700"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-border bg-white px-5 py-3 sm:px-8 lg:hidden">
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
              "inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-transparent px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground",
              active && "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
