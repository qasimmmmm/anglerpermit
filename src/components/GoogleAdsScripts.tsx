import Script from "next/script";
import { GOOGLE_ADS_IDS } from "@/lib/google-ads";

/**
 * Loads gtag.js once and configures every Google Ads account ID.
 * Uses beforeInteractive so tags are in the initial HTML from the root layout.
 */
export function GoogleAdsScripts() {
  const primaryId = GOOGLE_ADS_IDS[0];
  const initHtml = [
    "window.dataLayer = window.dataLayer || [];",
    "function gtag(){dataLayer.push(arguments);}",
    "window.gtag = gtag;",
    "gtag('js', new Date());",
    ...GOOGLE_ADS_IDS.map((id) => `gtag('config', '${id}');`),
  ].join("\n");

  return (
    <>
      <Script
        id="google-ads-gtag-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: initHtml }}
      />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${primaryId}`}
        strategy="beforeInteractive"
      />
    </>
  );
}
