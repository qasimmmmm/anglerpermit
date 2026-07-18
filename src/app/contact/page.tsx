import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact the AnglerPermit team about an application, a license, or our license-assistance service. We typically reply within one business day.",
};

export default function ContactPage() {
  return (
    <>
      <section className="bg-navy py-16 text-white sm:py-20">
        <div className="container-site max-w-3xl">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Contact us</h1>
          <p className="mt-4 text-lg text-slate-300">
            Questions about an application, a license, or our service? We typically reply
            within one business day.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container-site grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold">Reach us directly</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Email is the fastest way to reach the team. If your question is about an
              existing application, include your reference number (it starts with
              &ldquo;AP-&rdquo;).
            </p>
            <a
              href="mailto:support@anglerpermit.com"
              className="mt-5 inline-flex items-center gap-2 font-semibold text-forest-700 hover:text-forest-500"
            >
              <Mail className="h-5 w-5" aria-hidden="true" />
              support@anglerpermit.com
            </a>
            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
              <h3 className="text-sm font-semibold text-navy">Before you write</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-600">
                <li>
                  Many answers are in our{" "}
                  <a href="/faq" className="font-medium text-forest-700 underline">
                    FAQ
                  </a>
                  .
                </li>
                <li>
                  Never email full Social Security numbers or payment card details — we
                  will never ask for them by email.
                </li>
                <li>
                  For urgent licensing questions you can also contact your state agency
                  directly via the official portal linked on each state page.
                </li>
              </ul>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>
    </>
  );
}
