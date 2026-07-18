import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";

/**
 * Closing CTA band over the father-and-son dock photograph, with a heavy
 * navy scrim so the white copy stays WCAG-compliant. Restates the guarantee
 * and non-affiliation in one line, per the compliance checklist.
 */
export function FinalCta() {
  return (
    <section
      className="relative overflow-hidden bg-navy-950 py-20 sm:py-24"
      aria-labelledby="final-cta"
    >
      <Image
        src="/images/dock-fishing.jpg"
        alt="Father and son fishing together from a wooden dock"
        fill
        sizes="100vw"
        className="object-cover object-center"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-navy-950/70" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-navy-950/60"
      />

      <div className="container-site relative">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="final-cta" className="text-3xl font-bold text-white sm:text-4xl">
            Be licensed before your next cast
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-200">
            Start now and we&apos;ll review your application, purchase your license
            from the state portal, and email it as soon as it&apos;s issued.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/states" className={buttonClasses("accent", "lg")}>
              Start My Application
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center rounded-lg border border-white/40 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              See how it works
            </Link>
          </div>
          <p className="mx-auto mt-8 max-w-xl text-xs leading-relaxed text-slate-300">
            Service fee refundable until we purchase your license. AnglerPermit.com is a
            private license-assistance service and is not affiliated with, endorsed by,
            or operated by any government agency — licenses are also available directly
            from official state agencies.
          </p>
        </div>
      </div>
    </section>
  );
}
