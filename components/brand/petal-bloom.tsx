/**
 * PetalBloom: the Shadow brand mark, matching the iOS app's Aurora logo.
 *
 * Four translucent periwinkle petals sit at the cardinal points and overlap
 * toward the centre, so the diagonal overlaps read a shade deeper (just like
 * the app icon's layered blooms). A small cream dot holds the centre. The
 * petals are semi-transparent so the warm background shows through and the
 * overlaps darken naturally, which keeps the mark flat and understated.
 */

type Tone = "light" | "dark";

const PETAL =
  "M32 2 C 48 10, 52 30, 32 43 C 12 30, 16 10, 32 2 Z";

const ANGLES = [0, 90, 180, 270];

export function PetalBloom({
  size = 22,
  tone = "light",
  centerColor,
  className,
  title
}: {
  size?: number;
  tone?: Tone;
  centerColor?: string;
  className?: string;
  title?: string;
}) {
  const dark = tone === "dark";
  const petalFill = dark ? "hsl(250 55% 72%)" : "hsl(250 50% 68%)";
  const petalOpacity = dark ? 0.5 : 0.52;
  const dot = centerColor ?? (dark ? "hsl(40 33% 94%)" : "hsl(40 36% 97%)");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={className}
    >
      {title ? <title>{title}</title> : null}
      <g style={{ mixBlendMode: dark ? "screen" : "multiply" }}>
        {ANGLES.map((a) => (
          <path
            key={a}
            d={PETAL}
            fill={petalFill}
            fillOpacity={petalOpacity}
            transform={`rotate(${a} 32 32)`}
          />
        ))}
      </g>
      <circle cx="32" cy="32" r="5.1" fill={dot} />
    </svg>
  );
}
