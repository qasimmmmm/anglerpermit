import { Info } from "lucide-react";

/** The mandatory non-affiliation disclaimer — use verbatim site-wide. */
export const NON_AFFILIATION_DISCLAIMER =
  "AnglerPermit.com is a privately owned license-assistance service and is not affiliated with, endorsed by, or operated by any government agency. Fishing licenses are also available directly from official state agencies, often at a lower cost.";

export function DisclaimerBanner({ className = "" }: { className?: string }) {
  return (
    <div
      role="note"
      aria-label="Non-affiliation notice"
      className={`rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-amber-900">{NON_AFFILIATION_DISCLAIMER}</p>
      </div>
    </div>
  );
}
