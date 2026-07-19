import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/**
 * "Apply yourself vs Apply with AnglerPermit" — the license-assistance
 * niche's core persuasion pattern (popularized by iVisa). Written honestly:
 * the DIY route is presented as a legitimate option, not demonized.
 */

const DIY_POINTS = [
  "You pay only the state's fees",
  "You navigate the state licensing system yourself",
  "You figure out which license, stamps, and validations apply to you",
  "No one checks your application before it goes to the state",
];

const WITH_US_POINTS = [
  "One clear total before you pay — no hidden fees",
  "One plain-English guided form — we handle the state system",
  "We surface the right license options and required add-ons for you",
  "A real person reviews your application for errors, usually within 1 business day",
  "We complete the purchase and email your license when the state issues it",
];

export function Comparison() {
  return (
    <section className="py-16 sm:py-20" aria-labelledby="comparison">
      <div className="container-site">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="comparison" className="text-3xl font-bold">
            Two honest ways to get licensed
          </h2>
          <p className="mt-3 text-slate-600">
            Every license we handle can also be purchased directly from the state.
            Here&apos;s exactly what changes when you apply with us.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
          {/* DIY card */}
          <Card className="flex h-full flex-col px-6 py-6">
            <h3 className="text-lg font-semibold text-navy">
              Apply yourself at the state portal
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              State fees only — a fine choice if you know exactly what you need.
            </p>
            <ul className="mt-5 flex-1 space-y-3 text-sm leading-relaxed text-slate-600">
              {DIY_POINTS.map((point) => (
                <li key={point} className="flex gap-2.5">
                  <Minus
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400"
                    aria-hidden="true"
                  />
                  {point}
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-slate-100 pt-4 text-sm font-semibold text-navy">
              Cost: the state&apos;s listed fees
            </p>
          </Card>

          {/* With AnglerPermit card */}
          <Card className="relative flex h-full flex-col border-forest-500 px-6 py-6 ring-1 ring-forest-500">
            <span className="absolute -top-3 left-6 rounded-full bg-forest-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              We handle it
            </span>
            <h3 className="text-lg font-semibold text-navy">Apply with AnglerPermit</h3>
            <p className="mt-1 text-sm text-slate-500">
              For anglers who&rsquo;d rather spend the afternoon on the water, not on a form.
            </p>
            <ul className="mt-5 flex-1 space-y-3 text-sm leading-relaxed text-slate-600">
              {WITH_US_POINTS.map((point) => (
                <li key={point} className="flex gap-2.5">
                  <Check
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-forest-600"
                    aria-hidden="true"
                  />
                  {point}
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-slate-100 pt-4 text-sm font-semibold text-navy">
              Cost: one bundled total, shown before you pay
            </p>
            <Link
              href="/states"
              className={`${buttonClasses("accent", "lg")} mt-4 w-full`}
            >
              Start My Application
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </Card>
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-slate-500">
          AnglerPermit is a private assistance service and is not affiliated with any
          government agency. Every state page links to the official portal so you can
          compare and choose.
        </p>
      </div>
    </section>
  );
}
