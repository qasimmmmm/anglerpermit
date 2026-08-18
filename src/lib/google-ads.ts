/**
 * Google Ads conversion accounts + Purchase conversion labels for AnglerPermit.
 * Every ads ID must be configured site-wide; every send_to must fire on purchase.
 *
 * NOTE: The conversion value reported to Google Ads is 50% of the actual sale
 * amount (see GOOGLE_ADS_VALUE_RATIO). This is a reporting-only adjustment —
 * customer-facing prices and charged amounts are never modified here.
 */

/**
 * Fraction of the sale amount forwarded to Google Ads as the conversion value.
 * Example: a $100 license reports $50; a $200 sale reports $100.
 * Applies to every Google Ads account, every state, and every item, because
 * all Purchase conversions on the site flow through trackGoogleAdsPurchase().
 */
export const GOOGLE_ADS_VALUE_RATIO = 0.5;

export type GoogleAdsConversion = {
  adsId: string;
  sendTo: string;
};

/** All Google Ads tags + Purchase conversion snippets (nothing omitted). */
export const GOOGLE_ADS_CONVERSIONS: readonly GoogleAdsConversion[] = [
  {
    adsId: "AW-18321465982",
    sendTo: "AW-18321465982/JWSRCMzP7N4cEP7EraBE",
  },
  {
    adsId: "AW-18321455140",
    sendTo: "AW-18321455140/cWC3CNLk3N4cEKTwrKBE",
  },
  {
    adsId: "AW-18321425650",
    sendTo: "AW-18321425650/iogVCKyB794cEPKJq6BE",
  },
  {
    adsId: "AW-18321396330",
    sendTo: "AW-18321396330/5h2uCIGy3d4cEOqkqaBE",
  },
  {
    adsId: "AW-18321384768",
    sendTo: "AW-18321384768/x3wvCPHd7d4cEMDKqKBE",
  },
  {
    adsId: "AW-18321333884",
    sendTo: "AW-18321333884/4MBKCJPj794cEPy8paBE",
  },
  {
    adsId: "AW-18321299633",
    sendTo: "AW-18321299633/G_TJCO-v3t4cELGxo6BE",
  },
] as const;

export const GOOGLE_ADS_IDS = GOOGLE_ADS_CONVERSIONS.map((c) => c.adsId);

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

function markFired(transactionId: string): boolean {
  if (typeof window === "undefined") return false;
  const key = `ga_ads_purchase_${transactionId}`;
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
    return true;
  } catch {
    // sessionStorage blocked — still fire; Google dedupes via transaction_id
    return true;
  }
}

/**
 * Fire Purchase conversion for every configured Google Ads account.
 * Safe to call multiple times for the same reference within a tab (sessionStorage).
 *
 * `opts.value` must be the FULL sale amount; the value actually sent to Google
 * is opts.value × GOOGLE_ADS_VALUE_RATIO (50%), rounded to cents.
 */
export function trackGoogleAdsPurchase(opts: {
  transactionId: string;
  value?: number;
  currency?: string;
}): void {
  if (typeof window === "undefined") return;
  const transactionId = opts.transactionId?.trim();
  if (!transactionId) return;
  if (!markFired(transactionId)) return;

  // Forward only 50% of the sale amount to Google Ads (all accounts).
  const value =
    typeof opts.value === "number" && Number.isFinite(opts.value) && opts.value > 0
      ? Math.round(opts.value * GOOGLE_ADS_VALUE_RATIO * 100) / 100
      : 1;
  const currency = opts.currency ?? "USD";

  const fire = (): boolean => {
    if (typeof window.gtag !== "function") return false;
    for (const c of GOOGLE_ADS_CONVERSIONS) {
      window.gtag("event", "conversion", {
        send_to: c.sendTo,
        value,
        currency,
        transaction_id: transactionId,
      });
    }
    return true;
  };

  if (fire()) return;

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (fire() || attempts >= 40) window.clearInterval(timer);
  }, 250);
}
