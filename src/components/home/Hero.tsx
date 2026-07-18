import Image from "next/image";
import Link from "next/link";
import { Clock, Lock, Receipt } from "lucide-react";
import { HeroStateForm, type HeroStateOption } from "./HeroStateForm";

/**
 * Full-bleed photographic hero (angler wading at golden hour) with a navy
 * scrim system that keeps white copy at WCAG AA contrast:
 *   - uniform navy-950/55 wash
 *   - left-to-right gradient (dark behind the text column, image opens right)
 *   - bottom-up gradient for the micro-trust row
 * Text is real HTML layered over the image — never baked into the photo.
 */
export function Hero({ states }: { states: HeroStateOption[] }) {
  return (
    <section className="relative overflow-hidden bg-navy-950 text-white">
      <Image
        src="/images/hero-lake-sunrise.jpg"
        alt="Angler standing in calm lake water at golden hour, casting a fishing line"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      {/* Scrims — uniform wash + directional gradients (stronger on small screens) */}
      <div aria-hidden="true" className="absolute inset-0 bg-navy-950/60 sm:bg-navy-950/40" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-navy-950/85 via-navy-950/45 to-navy-950/10"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-navy-950/30"
      />

      <div className="container-site relative flex flex-col justify-center py-16 sm:py-24 lg:min-h-[600px] lg:py-28">
        <div className="max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-forest-200 sm:tracking-[0.2em]">
            <span aria-hidden="true" className="h-px w-8 shrink-0 bg-forest-300/70" />
            <span>Private license-assistance service</span>
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]">
            Your fishing license, done right in minutes
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-200">
            Answer one guided form and our team reviews it, purchases your license
            from the state licensing portal, and emails it to you — with the state
            fee and our service fee itemized before you pay. AnglerPermit is an
            independent service, not affiliated with any government agency.
          </p>

          <div className="mt-8">
            <HeroStateForm states={states} />
          </div>

          <p className="mt-4 text-sm">
            <Link
              href="/how-it-works"
              className="font-semibold text-slate-100 underline decoration-white/40 underline-offset-4 transition-colors hover:text-white hover:decoration-white"
            >
              See how it works
            </Link>
          </p>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5 text-sm text-slate-200">
            <li className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-forest-300" aria-hidden="true" />
              256-bit SSL secure checkout
            </li>
            <li className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-forest-300" aria-hidden="true" />
              State + service fees itemized
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-forest-300" aria-hidden="true" />
              Reviewed within 1 business day
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
