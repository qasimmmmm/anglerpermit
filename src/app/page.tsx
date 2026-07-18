import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Lock,
  Mail,
  MapPin,
  Receipt,
  ShieldCheck,
  FileCheck2,
} from "lucide-react";
import { getAllStateConfigs } from "@/lib/states";
import { FAQ_ITEMS } from "@/data/faq";
import { StateGrid } from "@/components/StateGrid";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default async function HomePage() {
  const states = await getAllStateConfigs();

  return (
    <>
      {/* Hero */}
      <section className="bg-navy text-white">
        <div className="container-site py-20 sm:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Get your fishing license without the paperwork
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-300">
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
            <p className="mt-6 flex items-center gap-2 text-sm text-slate-400">
              <Lock className="h-4 w-4" aria-hidden="true" />
              Private license-assistance service — not a government agency.
            </p>
          </div>
        </div>
      </section>

      {/* How it works — 3 steps */}
      <section className="py-16 sm:py-20" aria-labelledby="how-it-works">
        <div className="container-site">
          <h2 id="how-it-works" className="text-center text-3xl font-bold">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
            Three simple steps between you and the water.
          </p>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {[
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
            ].map((step, i) => (
              <li key={step.title}>
                <Card className="h-full px-6 py-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest-50 text-forest-600">
                    <step.icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">
                    {i + 1}. {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.body}</p>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* State grid — dynamically discovered */}
      <section className="bg-slate-50 py-16 sm:py-20" aria-labelledby="states">
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
          <div className="mt-8">
            <StateGrid states={states} />
          </div>
        </div>
      </section>

      {/* Trust & security */}
      <section className="py-16 sm:py-20" aria-labelledby="trust">
        <div className="container-site">
          <h2 id="trust" className="text-center text-3xl font-bold">
            Transparent, secure, and on your side
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Lock,
                title: "Secure submission",
                body: "Applications are transmitted over encrypted connections and validated on our servers before anything is processed.",
              },
              {
                icon: ShieldCheck,
                title: "Data protection",
                body: "Sensitive identifiers like SSNs are masked in all notifications and logs — we only ever display the last four digits.",
              },
              {
                icon: Receipt,
                title: "Transparent pricing",
                body: "Official state fees and our service fee are always itemized separately. No hidden charges, ever.",
              },
              {
                icon: FileCheck2,
                title: "Official-source forms",
                body: "Each form is matched against the state's official licensing portal and stamped with a last-verified date.",
              },
            ].map((item) => (
              <Card key={item.title} className="px-6 py-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy">
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ preview */}
      <section className="bg-slate-50 py-16 sm:py-20" aria-labelledby="faq-preview">
        <div className="container-site max-w-3xl">
          <h2 id="faq-preview" className="text-center text-3xl font-bold">
            Frequently asked questions
          </h2>
          <div className="mt-8 space-y-3">
            {FAQ_ITEMS.slice(0, 5).map((item) => (
              <details
                key={item.question}
                className="group rounded-xl border border-slate-200 bg-white px-5 py-4"
              >
                <summary className="cursor-pointer list-none text-base font-semibold text-navy marker:hidden">
                  {item.question}
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
    </>
  );
}
