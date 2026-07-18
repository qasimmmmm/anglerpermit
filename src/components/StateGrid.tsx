import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import type { StateConfig } from "@/lib/state-config";
import { formatPrice } from "@/lib/format";
import { Card } from "@/components/ui/Card";

/**
 * Grid of available states, discovered dynamically from src/data/states/.
 * Used by the home page and the /states hub.
 */
export function StateGrid({ states }: { states: StateConfig[] }) {
  if (states.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500">
        State pages are being added. Check back soon.
      </p>
    );
  }

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {states.map((state) => {
        const lowestPrice = Math.min(...state.licenses.map((l) => l.price));
        return (
          <li key={state.slug}>
            <Link href={`/${state.slug}`} className="group block h-full">
              <Card className="flex h-full flex-col px-6 py-5 transition-shadow group-hover:shadow-md">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50 text-navy">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-lg font-semibold text-navy">{state.stateName}</h3>
                </div>
                <p className="mt-3 flex-1 text-sm text-slate-600">
                  {state.licenses.length} license option{state.licenses.length === 1 ? "" : "s"} from{" "}
                  {formatPrice(lowestPrice)} official fee · Matched to {state.officialPortalName}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700">
                  Start {state.stateName} application
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Card>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
