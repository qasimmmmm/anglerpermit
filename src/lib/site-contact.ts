/**
 * Public support contact for the website.
 * Keep display + mailto in sync with email Reply-To defaults.
 */
export const SUPPORT_EMAIL = "support@anglerpermit.com";

export function supportMailto(subject?: string): string {
  if (!subject) return `mailto:${SUPPORT_EMAIL}`;
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
