import type { Metadata } from "next";
import Link from "next/link";
import {
  Check,
  ClipboardCheck,
  ClipboardList,
  Mail,
  MapPin,
  Receipt,
  ShoppingCart,
  X,
} from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "How AnglerPermit works: choose your state, fill one simple form, and we purchase your fishing license from the official state portal on your behalf.",
};

const TIMELINE = [
  {
    icon: MapPin,
    title: "Choose your state and license",
    body: "Select your state, tell us your residency status, and choose from the state's current license options at official prices. Add any stamps or validations you need; required ones are added automatically.",
  },
  {
    icon: ClipboardList,
    title: "Fill one simple form",
    body: "Our guided form asks for exactly what the state application requires — nothing more — in a clean, plain-English format with inline validation that catches mistakes before they cost you time.",
  },
  {
    icon: ClipboardCheck,
    title: "We review your application",
    body: "A real person checks your application for completeness and common errors, usually within one business day. If anything looks off, we contact you before purchasing.",
  },
  {
    icon: ShoppingCart,
    title: "We purchase from the official state portal",
    body: "We complete the purchase on the state's official licensing system using your details. The license is issued by the state agency itself — we never issue our own documents.",
  },
  {
    icon: Mail,
    title: "License delivered by email",
    body: "As soon as the state issues your license, we email the official document to you. Most anglers can print it or carry it on their phone.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="bg-navy py-16 text-white sm:py-20">
        <div className="container-site max-w-3xl">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">How it works</h1>
          <p className="mt-4 text-lg text-slate-300">
            AnglerPermit is a private license-assistance service. You give us the details
            the state needs — we handle the paperwork, the purchase, and the
            follow-through. Here is exactly what happens after you apply.
          </p>
        </div>
      </section>

      {/* Detailed timeline */}
      <section className="py-14 sm:py-16" aria-labelledby="timeline">
        <div className="container-site max-w-3xl">
          <h2 id="timeline" className="text-2xl font-bold">
            From application to inbox
          </h2>
          <ol className="mt-8 space-y-6 border-l-2 border-slate-200 pl-6">
            {TIMELINE.map((item, i) => (
              <li key={item.title} className="relative">
                <span
                  className="absolute -left-[2.55rem] flex h-9 w-9 items-center justify-center rounded-full bg-forest-600 text-white"
                  aria-hidden="true"
                >
                  <item.icon className="h-4 w-4" />
                </span>
                <h3 className="text-lg font-semibold">
                  {i + 1}. {item.title}
                </h3>
                <p className="mt-1.5 leading-relaxed text-slate-600">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* What we do / don't do */}
      <section className="bg-slate-50 py-14 sm:py-16" aria-labelledby="scope">
        <div className="container-site">
          <h2 id="scope" className="text-2xl font-bold">
            What we do — and what we don&apos;t
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card className="px-6 py-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-forest-700">
                <Check className="h-5 w-5" aria-hidden="true" />
                What we do
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-600">
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-forest-600" aria-hidden="true" />Guide you through a simple, plain-English application form.</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-forest-600" aria-hidden="true" />Review your application for errors before it costs you time.</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-forest-600" aria-hidden="true" />Purchase your license from the official state portal on your behalf.</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-forest-600" aria-hidden="true" />Itemize official state fees and our service fee separately.</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-forest-600" aria-hidden="true" />Email your official license as soon as the state issues it.</li>
              </ul>
            </Card>
            <Card className="px-6 py-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-navy">
                <X className="h-5 w-5" aria-hidden="true" />
                What we don&apos;t do
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-600">
                <li className="flex gap-2"><X className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />We are not a government agency and are not affiliated with one.</li>
                <li className="flex gap-2"><X className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />We never issue licenses ourselves — only the state can.</li>
                <li className="flex gap-2"><X className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />We never mark up official state license fees.</li>
                <li className="flex gap-2"><X className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />We don&apos;t guarantee state processing times or eligibility decisions.</li>
                <li className="flex gap-2"><X className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />We never sell your personal information.</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing transparency */}
      <section className="py-14 sm:py-16" aria-labelledby="pricing">
        <div className="container-site max-w-3xl">
          <h2 id="pricing" className="flex items-center gap-2 text-2xl font-bold">
            <Receipt className="h-6 w-6 text-forest-600" aria-hidden="true" />
            Pricing transparency
          </h2>
          <p className="mt-4 leading-relaxed text-slate-600">
            Every application shows a full price breakdown before you submit:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 leading-relaxed text-slate-600">
            <li>
              <strong className="text-navy">Official license fee</strong> — set by the state,
              passed through at cost. We never mark it up.
            </li>
            <li>
              <strong className="text-navy">Official add-ons and stamps</strong> — also set by
              the state and passed through at cost.
            </li>
            <li>
              <strong className="text-navy">AnglerPermit service fee</strong> — a flat,
              clearly labeled fee for our review, purchase handling, and support.
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-slate-600">
            You can always purchase directly from the official state portal and pay only the
            state&apos;s fees — every state page links to it.
          </p>
          <div className="mt-8">
            <DisclaimerBanner />
          </div>
          <div className="mt-8">
            <Link href="/states" className={buttonClasses("accent", "lg")}>
              Start your application
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
