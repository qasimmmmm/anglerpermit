import Link from "next/link";
import { ArrowRight, ChevronDown, MapPin } from "lucide-react";
import { getAllStateConfigs } from "@/lib/states";
import { displayPrice } from "@/lib/state-config";
import { FAQ_ITEMS } from "@/data/faq";
import { formatPrice } from "@/lib/format";
import { TrustStrip } from "@/components/TrustStrip";
import { Hero } from "@/components/home/Hero";
import { Comparison } from "@/components/home/Comparison";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Essentials } from "@/components/home/Essentials";
import { Reviews } from "@/components/home/Reviews";
import { FinalCta } from "@/components/home/FinalCta";
import { Card } from "@/components/ui/Card";

export default async function HomePage() {
  const states = await getAllStateConfigs();
  const totalLicenses = states.reduce((sum, s) => sum + s.licenses.length, 0);

  return (
    <>
      {/* 1 — Hero: full-bleed photo, navy scrim, state-selector entry (iVisa checker pattern) */}
      <Hero states={states.map((s) => ({ slug: s.slug, stateName: s.stateName }))} />

      {/* 2 — Trust strip (secure submission / transparent pricing / fast review / disclosure) */}
      <TrustStrip />

      {/* 3 — DIY vs With Us comparison (core persuasion pattern, written honestly) */}
      <Comparison />

      {/* 4 — How it works: 3 numbered steps with real photography */}
      <HowItWorks />

      {/* 5 — Fishing license essentials ("Know before you fish") */}
      <Essentials />

      {/* 6 — States grid (dynamic, clean text cards) */}
      <section
        className="border-y border-slate-200/80 bg-slate-50 py-16 sm:py-20"
        aria-labelledby="states"
      >
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="states" className="text-3xl font-bold">
                States we serve
              </h2>
              <p className="mt-2 max-w-xl text-slate-600">
                Current license data across {states.length} states
                and {totalLicenses} license options — one clear total before you
                pay, no hidden fees.
              </p>
            </div>
            <Link
              href="/states"
              className="text-sm font-semibold text-forest-700 hover:text-forest-500"
            >
              View all states
              <ArrowRight className="ml-1 inline h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {states.map((state) => {
              // "From" price = lowest paid license (some states have free
              // youth/senior licenses — "from $0.00" reads like a bug).
              const paidFees = state.licenses.map((l) => l.price).filter((p) => p > 0);
              const lowestPrice = paidFees.length > 0 ? Math.min(...paidFees) : 0;
              return (
                <li key={state.slug}>
                  <Link href={`/${state.slug}`} className="group block h-full rounded-xl">
                    <Card className="flex h-full flex-col px-6 py-5 transition duration-200 group-hover:-translate-y-0.5 group-hover:border-forest-300 group-hover:shadow-md">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50 text-navy transition-colors group-hover:bg-forest-50 group-hover:text-forest-600">
                            <MapPin className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <h3 className="text-lg font-semibold text-navy">
                            {state.stateName}
                          </h3>
                        </div>
                        <span className="whitespace-nowrap rounded-full bg-navy-50 px-2.5 py-1 text-xs font-semibold text-navy">
                          {state.licenses.length} license{state.licenses.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <dl className="mt-4 flex-1 space-y-1.5 text-sm text-slate-600">
                        <div className="flex items-baseline justify-between gap-3">
                          <dt>Licenses from</dt>
                          <dd className="font-semibold tabular-nums text-navy">
                            {lowestPrice > 0 ? formatPrice(displayPrice(lowestPrice)) : "Free"}
                          </dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-3">
                          <dt className="shrink-0">Portal</dt>
                          <dd className="text-right">{state.officialPortalName}</dd>
                        </div>
                      </dl>
                      <span className="mt-4 inline-flex items-center gap-1.5 border-t border-slate-100 pt-4 text-sm font-semibold text-forest-700 transition-colors group-hover:text-forest-500">
                        Start application
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
        </div>
      </section>

      {/* 7 — Social proof (representative feedback, clearly labeled) */}
      <Reviews />

      {/* 8 — FAQ preview */}
      <section
        className="border-t border-slate-200/80 bg-slate-50 py-16 sm:py-20"
        aria-labelledby="faq-preview"
      >
        <div className="container-site max-w-3xl">
          <h2 id="faq-preview" className="text-center text-3xl font-bold">
            Frequently asked questions
          </h2>
          <div className="mt-8 space-y-3">
            {FAQ_ITEMS.slice(0, 5).map((item) => (
              <details
                key={item.question}
                className="group rounded-xl border border-slate-200 bg-white px-5 py-4 transition-colors hover:border-slate-300 open:border-forest-200"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-navy marker:hidden [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <ChevronDown
                    className="h-5 w-5 flex-shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-center">
            <Link
              href="/faq"
              className="text-sm font-semibold text-forest-700 hover:text-forest-500"
            >
              Read all FAQs
              <ArrowRight className="ml-1 inline h-4 w-4" aria-hidden="true" />
            </Link>
          </p>
        </div>
      </section>

      {/* 9 — Final CTA band over the dock photograph */}
      <FinalCta />
    </>
  );
}
