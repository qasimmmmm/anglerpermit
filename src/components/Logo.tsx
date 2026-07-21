import Image from "next/image";

/**
 * AnglerPermit logo — thin wrapper over next/image serving the professional
 * brand package from /public/brand.
 *
 * - variant "full": horizontal lockup (fish-hook mark + "anglerpermit.com")
 * - variant "mark": icon only
 * - theme "white": all-white lockup for dark surfaces (e.g. the navy footer)
 *
 * `width`/`height` are always the asset's INTRINSIC pixel dimensions so the
 * browser can reserve the correct aspect-ratio box before the image loads
 * (no CLS). The rendered size is controlled purely with Tailwind classes
 * (e.g. `h-9 w-auto md:h-12`), which override the intrinsic size while
 * keeping the aspect ratio. Sources are >=2x the largest rendered size
 * (465px tall lockup vs <=48px rendered), so they stay crisp on retina.
 */

export interface LogoProps {
  /** "full" = horizontal lockup, "mark" = icon only. */
  variant?: "full" | "mark";
  /** "color" for light backgrounds, "white" for dark backgrounds. */
  theme?: "color" | "white";
  /**
   * Tailwind classes controlling the rendered size, e.g. "h-9 w-auto md:h-12".
   * Always include a height utility plus `w-auto`.
   */
  className?: string;
  /** Eager-load and preload — use for the above-the-fold header logo. */
  priority?: boolean;
}

// Intrinsic pixel dimensions of the supplied brand assets.
const ASSETS = {
  full: {
    color: "/brand/logo.png",
    white: "/brand/logo-white.png",
    width: 1796,
    height: 465,
  },
  mark: {
    color: "/brand/mark.png",
    white: "/brand/mark.png",
    width: 479,
    height: 481,
  },
} as const;

export function Logo({
  variant = "full",
  theme = "color",
  className = "h-9 w-auto",
  priority = false,
}: LogoProps) {
  const asset = ASSETS[variant];
  const src = theme === "white" ? asset.white : asset.color;

  return (
    <Image
      src={src}
      alt="AnglerPermit"
      width={asset.width}
      height={asset.height}
      priority={priority}
      className={className}
    />
  );
}
