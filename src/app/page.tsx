import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileCheck2,
  Lock,
  Mail,
  MapPin,
  Receipt,
} from "lucide-react";
import { getAllStateConfigs } from "@/lib/states";
import { FAQ_ITEMS } from "@/data/faq";
import { formatPrice } from "@/lib/format";
import { TrustStrip } from "@/components/TrustStrip";
import { Logo } from "@/components/Logo";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/**
 * Subtle topographic / water-contour texture for navy bands.
 * Single hue (white) at very low opacity — no gradients, no imagery.
 */
function ContourTexture({ opacity = 0.05 }: { opacity?: number }) {
  const lines = [
    "M-80 120 C 160 60, 380 170, 640 110 S 1060 170, 1290 90",
    "M-80 200 C 180 150, 400 250, 660 195 S 1080 250, 1290 175",
    "M-80 285 C 200 235, 420 335, 680 280 S 1090 330, 1290 260",
    "M-80 370 C 210 325, 430 420, 690 368 S 1100 415, 1290 345",
    "M-80 455 C 220 415, 440 505, 700 455 S 1110 500, 1290 430",
    "M-80 540 C 230 505, 450 590, 710 540 S 1120 585, 1290 515",
  ];
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <g stroke="#FFFFFF" strokeOpacity={opacity} strokeWidth="1">
        {lines.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}

const HOW_IT_WORKS = [
  {
    icon: MapPin,
    title: "Choose your state",
    body: "Pick your state and license type. Our forms mirror each state's official application, so everything is exactly where you expect it.",
  },
  {
    icon: ClipboardList,
    title: "Fill one simple form",
    body: "Guided steps, itemized pricing, and clear explanations for everything we ask — including why a state may require your SSN.",
  },
  {
    icon: Mail,
    title: "We handle the rest",
    body: "We review your application, purchase your license from the official state portal, and email it to you as soon as it's issued.",
  },
];

export default async function HomePage() {
  const states = await getAllStateConfigs();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy text-white">
        <ContourTexture />
        <div className="container-site relative grid items-center gap-14 py-20 sm:py-24 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-forest-300 sm:tracking-[0.2em]">
              <span aria-hidden="true" className="h-px w-8 shrink-0 bg-forest-300/60" />
              <span>
                Private license-assistance service{" "}
                <span className="whitespace-nowrap">— {states.length} states</span>
              </span>
            </p>
            <h1 className="mt-5 max-w-xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Get your fishing license without the paperwork
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">
              Choose your state, fill out one simple form, and our team purchases your
              official fishing license from the state portal on your behalf — delivered
              to your inbox.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/states" className={buttonClasses("accent", "lg")}>
                Start Application
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                See how it works
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-forest-300" aria-hidden="true" />
                256-bit SSL
              </li>
              <li className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-forest-300" aria-hidden="true" />
                Itemized official + service fees
              </li>
              <li className="flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-forest-300" aria-hidden="true" />
                Forms matched to official state portals
              </li>
            </ul>
          </div>

          {/* Floating application-summary card — reinforces transparent pricing */}
          <div className="relative mx-auto w-full max-w-md">
            <div
              aria-hidden="true"
              className="absolute inset-x-6 -bottom-3 top-8 rounded-xl bg-white/5 ring-1 ring-white/10"
            />
            <div className="relative rounded-xl bg-white text-slate-700 shadow-2xl">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <Logo variant="mark" size={26} />
                  <p className="text-sm font-semibold text-navy">Application summary</p>
                </div>
                <span className="rounded-full bg-forest-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-forest-700">
                  Example
                </span>
              </div>
              <dl className="space-y-3 px-6 py-5 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-slate-500">License</dt>
                  <dd className="text-right font-medium text-navy">Resident annual fishing</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-slate-500">Official state fee</dt>
                  <dd className="font-medium tabular-nums text-navy">$30.00</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-slate-500">Service fee</dt>
                  <dd className="font-medium tabular-nums text-navy">$29.00</dd>
                </div>
                <div aria-hidden="true" className="border-t border-dashed border-slate-200" />
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="font-semibold text-navy">Total due today</dt>
                  <dd className="text-lg font-bold tabular-nums text-navy">$59.00</dd>
                </div>
              </dl>
              <div className="flex items-center justify-between gap-3 rounded-b-xl border-t border-slate-100 bg-slate-50 px-6 py-3.5">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Lock className="h-3.5 w-3.5 text-forest-600" aria-hidden="true" />
                  Secure checkout
                </span>
                <span className="rounded-full bg-navy-50 px-2.5 py-1 font-mono text-[11px] font-medium text-navy">
                  Ref AP-2417
                </span>
              </div>
            </div>
            <div className="absolute -top-3 right-4 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-forest-700 shadow-lg ring-1 ring-slate-900/5">
              <CheckCircle2 className="h-4 w-4 text-forest-600" aria-hidden="true" />
              Reviewed &amp; submitted
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <TrustStrip />

      {/* How it works — 3 steps */}
      <section className="py-16 sm:py-20" aria-labelledby="how-it-works">
        <div className="container-site">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="how-it-works" className="text-3xl font-bold">
              How it works
            </h2>
            <p className="mt-3 text-slate-600">
              Three simple steps between you and the water.
            </p>
          </div>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <li key={step.title} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-full top-[46px] hidden w-6 border-t-2 border-dashed border-slate-300 md:block"
                  />
                )}
                <Card className="h-full px-6 py-6 transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-forest-50 text-forest-600">
                    <step.icon className="h-6 w-6" aria-hidden="true" />
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-forest-600 text-xs font-bold text-white ring-2 ring-white">
                      {i + 1}
                    </span>
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.body}</p>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* State grid — dynamically discovered */}
      <section className="border-y border-slate-200/80 bg-slate-50 py-16 sm:py-20" aria-labelledby="states">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="states" className="text-3xl font-bold">
                States we serve
              </h2>
              <p className="mt-2 text-slate-600">
                Every form is matched field-for-field against the official state licensing portal.
              </p>
            </div>
            <Link href="/states" className="text-sm font-semibold text-forest-700 hover:text-forest-500">
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
                          <h3 className="text-lg font-semibold text-navy">{state.stateName}</h3>
                        </div>
                        <span className="whitespace-nowrap rounded-full bg-navy-50 px-2.5 py-1 text-xs font-semibold text-navy">
                          {state.licenses.length} license{state.licenses.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <dl className="mt-4 flex-1 space-y-1.5 text-sm text-slate-600">
                        <div className="flex items-baseline justify-between gap-3">
                          <dt>Official fee from</dt>
                          <dd className="font-semibold tabular-nums text-navy">
                            {lowestPrice > 0 ? formatPrice(lowestPrice) : "Free"}
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

      {/* FAQ preview */}
      <section className="py-16 sm:py-20" aria-labelledby="faq-preview">
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
            <Link href="/faq" className="text-sm font-semibold text-forest-700 hover:text-forest-500">
              Read all FAQs
              <ArrowRight className="ml-1 inline h-4 w-4" aria-hidden="true" />
            </Link>
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-navy py-16 sm:py-20" aria-labelledby="final-cta">
        <ContourTexture opacity={0.04} />
        <div className="container-site relative">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="final-cta" className="text-3xl font-bold text-white sm:text-4xl">
              Ready to get on the water?
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-300">
              Start your application in minutes — we review it, purchase from the
              official state portal, and email your license as soon as it&apos;s issued.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/states" className={buttonClasses("accent", "lg")}>
                Start Application
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                See how it works
              </Link>
            </div>
            <p className="mx-auto mt-8 max-w-xl text-xs leading-relaxed text-slate-400">
              AnglerPermit.com is a private license-assistance service and is not affiliated
              with, endorsed by, or operated by any government agency. Licenses are also
              available directly from official state agencies.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
