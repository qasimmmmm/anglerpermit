/**
 * AnglerPermit logo.
 *
 * Mark concept: the letter "A" with a fish hook hanging from its left leg.
 * The leg's foot curls outward into an open J-bend — shank, bend, point, and
 * barb all read at a second glance — while the forest-green crossbar doubles
 * as the fishing line. Set in white on a deep-navy rounded-square badge with
 * a hairline inner ring so the badge edge stays defined on dark surfaces.
 *
 * Craft rules applied (from the design brief): "A" first, hook second; hook
 * anatomy carried by the open bend + barb; ~5% apex overshoot; one stroke
 * family with rounded terminals; glyph optically centered in the tile (apex
 * sits right of center to counter the hook's left-side mass); counters stay
 * open down to 16px; the mark survives single-color reproduction (all-white
 * / all-black) with the accent removed. Geometry is hand-tuned on a 48×48
 * grid and was render-tested at 16 / 32 / 48 / 96 / 256 px in a headless
 * browser across seven iteration rounds.
 *
 * Wordmark: one typeface (Inter), title case, weight contrast instead of a
 * second family — semibold "Angler" / medium "Permit" — with neutral
 * tracking for a trustworthy utility register.
 */

export interface LogoProps {
  /** Edge length of the badge mark in pixels. */
  size?: number;
  /** "full" = mark + wordmark, "mark" = icon only (with sr-only name). */
  variant?: "full" | "mark";
  className?: string;
  /** Extra classes applied to the <svg> mark itself. */
  markClassName?: string;
}

export function Logo({
  size = 32,
  variant = "full",
  className = "",
  markClassName = "",
}: LogoProps) {
  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={markClassName}
    >
      {/* Navy rounded-square badge (corner radius ~23% of side) */}
      <rect width="48" height="48" rx="11" className="fill-navy" />
      {/* Hairline inner ring — keeps the badge edge defined on navy surfaces */}
      <rect
        x="0.75"
        y="0.75"
        width="46.5"
        height="46.5"
        rx="10.25"
        className="stroke-white/10"
        strokeWidth="1"
      />
      {/* Right leg of the "A" */}
      <path
        d="M26 9.5 L34.4 37.5"
        className="stroke-white"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      {/* Left leg whose foot curls outward into the fish hook — open J-bend,
          point rising clear of the shank */}
      <path
        d="M26 9.5 L18.29 35.2 C 16.79 38.2, 15.29 38.9, 13.99 37.5 C 13.09 36.4, 12.99 34.9, 13.59 33.5 L 14.19 31"
        className="stroke-white"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Barb at the hook point */}
      <path
        d="M14.19 31 L15.79 32.5"
        className="stroke-white"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Forest-green crossbar — the fishing line */}
      <path
        d="M20.93 28.4 H30.77"
        className="stroke-forest-400"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );

  if (variant === "mark") {
    return (
      <span className={`inline-flex ${className}`}>
        {mark}
        <span className="sr-only">AnglerPermit</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {mark}
      <span className="text-lg font-semibold">
        <span className="text-navy">Angler</span>
        <span className="font-medium text-forest-600">Permit</span>
      </span>
    </span>
  );
}
