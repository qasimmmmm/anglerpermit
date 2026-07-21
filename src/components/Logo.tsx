import Image from "next/image";

/**
 * AnglerPermit logo — thin wrapper over next/image serving the professional
 * brand package from /public/brand.
 *
 * - variant "full": horizontal lockup (fish-hook mark + "anglerpermit.com")
 * - variant "mark": icon only
 * - theme "white": all-white lockup for dark surfaces (e.g. the navy footer)
 *
 * Width is derived from the asset's intrinsic aspect ratio so the artwork is
 * never stretched or squished; Tailwind's `max-width: 100%; height: auto`
 * preflight keeps it proportional on narrow screens.
 */

export interface LogoProps {
  /** "full" = horizontal lockup, "mark" = icon only. */
  variant?: "full" | "mark";
  /** "color" for light backgrounds, "white" for dark backgrounds. */
  theme?: "color" | "white";
  /** Rendered height in pixels. Width follows the asset aspect ratio. */
  height?: number;
  /** Eager-load and preload — use for the above-the-fold header logo. */
  priority?: boolean;
  className?: string;
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
  height = 34,
  priority = false,
  className = "",
}: LogoProps) {
  const asset = ASSETS[variant];
  const src = theme === "white" ? asset.white : asset.color;
  const width = Math.round((height * asset.width) / asset.height);

  return (
    <Image
      src={src}
      alt="AnglerPermit"
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
}
