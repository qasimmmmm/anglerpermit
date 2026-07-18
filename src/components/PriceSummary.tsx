import type { StateConfig } from "@/lib/state-config";
import { addOnsForLicense } from "@/lib/state-config";
import { formatPrice } from "@/lib/format";
import { Card } from "@/components/ui/Card";

/**
 * Itemized price summary: official license fee + add-ons + our service fee,
 * always shown as SEPARATE lines (transparent-pricing requirement).
 */
export function PriceSummary({
  config,
  licenseId,
  addOnIds,
  className = "",
}: {
  config: StateConfig;
  licenseId?: string;
  addOnIds?: string[];
  className?: string;
}) {
  const license = config.licenses.find((l) => l.id === licenseId);
  const applicable = addOnsForLicense(config, licenseId || undefined);
  const selectedAddOns = applicable.filter(
    (a) => a.required || (addOnIds ?? []).includes(a.id),
  );

  const officialTotal =
    (license?.price ?? 0) + selectedAddOns.reduce((sum, a) => sum + a.price, 0);
  const total = officialTotal + config.serviceFee;

  return (
    <Card className={`bg-navy-50/60 ${className}`}>
      <div className="px-5 py-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-navy">
          Price summary
        </h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-slate-600">
              {license ? `${license.name} (official state fee)` : "Official state license fee"}
            </dt>
            <dd className="font-medium text-navy">
              {license ? formatPrice(license.price) : "—"}
            </dd>
          </div>
          {selectedAddOns.map((addOn) => (
            <div key={addOn.id} className="flex items-center justify-between gap-4">
              <dt className="text-slate-600">{addOn.name} (official fee)</dt>
              <dd className="font-medium text-navy">{formatPrice(addOn.price)}</dd>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4">
            <dt className="text-slate-600">AnglerPermit service fee</dt>
            <dd className="font-medium text-navy">{formatPrice(config.serviceFee)}</dd>
          </div>
          <div className="mt-2 flex items-center justify-between gap-4 border-t border-navy-100 pt-3">
            <dt className="font-semibold text-navy">Total due today</dt>
            <dd className="text-lg font-bold text-navy">
              {license ? formatPrice(total) : "—"}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Official fees are passed through to {config.officialAgencyName} at cost. The
          service fee covers our application review, purchase handling, and support.
          Licenses are also available directly from the state at the official fee only.
        </p>
      </div>
    </Card>
  );
}
