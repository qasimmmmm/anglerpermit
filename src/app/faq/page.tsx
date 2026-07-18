import type { Metadata } from "next";
import Link from "next/link";
import { FAQ_ITEMS } from "@/data/faq";
import { buttonClasses } from "@/components/ui/Button";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers about AnglerPermit's license-assistance service: pricing, SSN safety, delivery times, refunds, and our relationship to state agencies.",
};

export default function FaqPage() {
  return (
    <>
      <section className="bg-navy py-16 text-white sm:py-20">
        <div className="container-site max-w-3xl">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Frequently asked questions
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            Everything anglers ask us before applying. Can&apos;t find your answer?{" "}
            <Link href="/contact" className="font-medium text-forest-300 underline">
              Contact us
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container-site max-w-3xl">
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <details
                key={item.question}
                className="group rounded-xl border border-slate-200 bg-white px-5 py-4"
                open={i === 0}
              >
                <summary className="cursor-pointer text-base font-semibold text-navy">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>

          <div className="mt-10">
            <DisclaimerBanner />
          </div>

          <div className="mt-10 text-center">
            <Link href="/states" className={buttonClasses("accent", "lg")}>
              Start your application
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
