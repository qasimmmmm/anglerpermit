import type { Metadata } from "next";
import { NON_AFFILIATION_DISCLAIMER } from "@/components/ui/DisclaimerBanner";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "AnglerPermit's non-affiliation disclaimer: a privately owned license-assistance service, not affiliated with any government agency.",
};

const LAST_UPDATED = "January 1, 2025";

export default function DisclaimerPage() {
  return (
    <>
      <section className="bg-navy py-16 text-white sm:py-20">
        <div className="container-site max-w-3xl">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Disclaimer</h1>
          <p className="mt-4 text-slate-300">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container-site max-w-3xl space-y-10 leading-relaxed text-slate-600">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-5">
            <p className="text-base font-medium leading-relaxed text-amber-900">
              {NON_AFFILIATION_DISCLAIMER}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">1. No government affiliation</h2>
            <p className="mt-3">
              AnglerPermit.com is a privately owned and operated license-assistance service. We
              are not a government agency, and we are not affiliated with, endorsed by, sponsored
              by, or operated by any federal, state, or local government agency, including any
              state department of natural resources, fish and wildlife agency, or parks and
              wildlife department. Nothing on this site is intended to imply otherwise.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">2. Official sources remain available</h2>
            <p className="mt-3">
              Fishing licenses are issued only by state agencies and are available directly from
              official state licensing portals — often at a lower cost, since you pay only the
              state&apos;s fees. Every state page on this site links to the official portal it
              references, and we encourage you to compare before choosing our service.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">3. Accuracy of state information</h2>
            <p className="mt-3">
              License names, prices, and application requirements on this site are researched
              against official state portals and stamped with a &ldquo;last verified&rdquo; date.
              States can change their offerings, prices, and rules at any time without notice to
              us. Where a discrepancy exists, the official state portal and the state&apos;s
              published regulations control. If we discover an error, we correct it and, where an
              application is affected, contact the applicant.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">4. No legal or regulatory advice</h2>
            <p className="mt-3">
              Content on this site is for general information and convenience only. It is not
              legal advice, and it does not replace state fishing regulations. You are responsible
              for knowing and following the fishing rules of the state where you fish, including
              seasons, limits, and stamp requirements.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">5. Service limitations</h2>
            <p className="mt-3">
              We do not issue licenses — only state agencies do. We do not control state
              processing times, system availability, eligibility determinations, or enforcement
              decisions. References to state agency names, license names, and portal names are for
              identification purposes only and do not imply endorsement.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">6. Contact</h2>
            <p className="mt-3">
              Questions about this disclaimer:{" "}
              <a href="mailto:support@anglerpermit.com" className="font-medium text-forest-700 underline">
                support@anglerpermit.com
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
