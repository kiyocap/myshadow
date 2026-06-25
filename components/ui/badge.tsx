import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
  tone?: "neutral" | "blue" | "dark";
};

export function Badge({ children, className, tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full border px-3 text-[11px] font-medium uppercase tracking-[0.16em]",
        tone === "neutral" && "border-border bg-transparent text-muted-foreground",
        tone === "blue" && "border-claret/30 bg-transparent text-claret",
        tone === "dark" && "border-foreground bg-foreground text-background",
        className
      )}
    >
      {children}
    </span>
  );
}
