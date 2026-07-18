/**
 * AnglerPermit logo.
 *
 * Mark concept: a fish hook drawn as the letter "A" — the hook's shank forms
 * the A's left stroke and curls into a J-bend at the baseline, the right
 * stroke completes the letterform, and a forest-green crossbar doubles as
 * the fishing line the hook reaches for. Set in white on a deep-navy
 * rounded-square badge with a hairline inner ring so the badge edge stays
 * defined on dark surfaces.
 *
 * Geometry is hand-tuned on a 48×48 grid (integer-friendly, no filters) so
 * it stays crisp from 16px favicon to 256px marketing sizes, and it works
 * single-color (all-white) when the accent is unavailable.
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
      {/* Navy rounded-square badge */}
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
      {/* Right stroke of the "A" */}
      <path
        d="M24 10.5 L33.6 37.5"
        className="stroke-white"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      {/* Left stroke curling into a fish-hook J-bend */}
      <path
        d="M24 10.5 L15.6 33.5 A 2.9 2.9 0 1 0 21.3 33.5"
        className="stroke-white"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Forest-green crossbar — the fishing line */}
      <path
        d="M17.4 28.5 H30.4"
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
      <span className="text-lg font-bold tracking-tight">
        <span className="text-navy">Angler</span>
        <span className="text-forest-500">Permit</span>
      </span>
    </span>
  );
}
