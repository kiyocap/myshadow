import Image from "next/image";

import { cn } from "@/lib/utils";

export function ShadowLogoImage({
  className,
  priority = false,
  title,
  sizes = "(max-width: 640px) 70vw, 420px"
}: {
  className?: string;
  priority?: boolean;
  title?: string;
  sizes?: string;
}) {
  return (
    <span
      className={cn("relative inline-block shrink-0", className)}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      role={title ? "img" : undefined}
    >
      <Image
        src="/images/shadow-logo.png"
        alt={title ?? ""}
        fill
        priority={priority}
        sizes={sizes}
        className="object-contain"
      />
    </span>
  );
}
