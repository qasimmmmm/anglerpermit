import type { Metadata } from "next";
import Link from "next/link";
import { Fish, HeartHandshake, Receipt, ShieldCheck } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "AnglerPermit is a privately owned fishing-license assistance service. Learn what we do, why we exist, and how we handle your information.",
};

export default function AboutPage() {
  return (
    <>
      <section className="bg-navy py-16 text-white sm:py-20">
        <div className="container-site max-w-3xl">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">About AnglerPermit</h1>
          <p className="mt-4 text-lg text-slate-300">
            We started AnglerPermit with a simple observation: buying a fishing license
            should take minutes, not an afternoon of navigating unfamiliar government
            portals.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container-site max-w-3xl space-y-6 leading-relaxed text-slate-600">
          <p>
            AnglerPermit.com is a <strong className="text-navy">privately owned
            license-assistance service</strong>. We are not a government agency, and we are
            not affiliated with, endorsed by, or operated by any state fish and wildlife
            department. What we offer is convenience and support: you complete one clear,
            guided form, and our team purchases your license through the official state
            licensing portal on your behalf.
          </p>
          <p>
            Every form on this site is built from a careful review of the official state
            licensing portal, so we ask for exactly what the state requires — nothing
            more. Each state page cites the official source of its license data and
            shows when it was last verified.
          </p>
          <p>
            We believe in straightforward pricing: one clear total before you pay, with
            no hidden fees — our review, purchase handling, and support are included in
            that single total. If you prefer to buy directly from the state, every state
            page links to the official portal — and we genuinely encourage you to use
            whichever option works best for you.
          </p>
        </div>
      </section>

      <section className="bg-slate-50 py-14 sm:py-16" aria-labelledby="values">
        <div className="container-site">
          <h2 id="values" className="text-2xl font-bold">
            What we stand for
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Fish,
                title: "Angler-first",
                body: "Less time on paperwork means more time on the water. Every design decision starts there.",
              },
              {
                icon: Receipt,
                title: "Transparent pricing",
                body: "One clear total before you pay. No hidden charges, ever.",
              },
              {
                icon: ShieldCheck,
                title: "Privacy by default",
                body: "We collect only what the state requires, mask sensitive identifiers everywhere, and never sell your data.",
              },
              {
                icon: HeartHandshake,
                title: "Honest service",
                body: "We say clearly who we are and who we are not — a private service, never a government agency.",
              },
            ].map((item) => (
              <Card key={item.title} className="px-6 py-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest-50 text-forest-600">
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
              </Card>
            ))}
          </div>
          <div className="mt-10 max-w-3xl">
            <DisclaimerBanner />
          </div>
          <div className="mt-10">
            <Link href="/states" className={buttonClasses("accent", "lg")}>
              Start your application
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
