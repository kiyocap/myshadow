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
        "inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium",
        tone === "neutral" && "border-border bg-background text-muted-foreground",
        tone === "blue" && "border-blue-200 bg-blue-50 text-blue-700",
        tone === "dark" && "border-foreground bg-foreground text-background",
        className
      )}
    >
      {children}
    </span>
  );
}
