import { FileCheck2, ShieldCheck } from "lucide-react";
import type { StateConfig } from "@/lib/state-config";
import { publicConfig } from "@/lib/state-config";
import { NON_AFFILIATION_DISCLAIMER } from "@/lib/disclaimer";
import { ApplicationForm } from "@/components/ApplicationForm";
import { CompetitorApplyShell } from "@/components/CompetitorApplyShell";
import { CaliforniaCompetitorApply } from "@/components/CaliforniaCompetitorApply";
import { ColoradoCompetitorApply } from "@/components/ColoradoCompetitorApply";
import { FloridaCompetitorApply } from "@/components/FloridaCompetitorApply";
import { MichiganCompetitorApply } from "@/components/MichiganCompetitorApply";
import { NorthCarolinaCompetitorApply } from "@/components/NorthCarolinaCompetitorApply";
import { SouthCarolinaCompetitorApply } from "@/components/SouthCarolinaCompetitorApply";
import { TexasCompetitorApply } from "@/components/TexasCompetitorApply";

const COMPETITOR_WIZARDS: Record<
  string,
  { Wizard: typeof CaliforniaCompetitorApply; advisorsSubtitle?: boolean }
> = {
  california: { Wizard: CaliforniaCompetitorApply },
  colorado: { Wizard: ColoradoCompetitorApply },
  florida: { Wizard: FloridaCompetitorApply },
  michigan: { Wizard: MichiganCompetitorApply, advisorsSubtitle: true },
  "north-carolina": { Wizard: NorthCarolinaCompetitorApply, advisorsSubtitle: true },
  "south-carolina": { Wizard: SouthCarolinaCompetitorApply },
  texas: { Wizard: TexasCompetitorApply },
};

/**
 * StatePageTemplate — the single shared component every state page uses.
 *
 * Usage (in src/app/<slug>/page.tsx):
 *   import { StatePageTemplate } from "@/components/StatePageTemplate";
 *   import { config } from "@/data/states/<slug>";
 *   export default function Page() {
 *     return <StatePageTemplate config={config} />;
 *   }
 */
export function StatePageTemplate({ config }: { config: StateConfig }) {
  const pub = publicConfig(config);
  const competitor = COMPETITOR_WIZARDS[config.slug];

  if (competitor) {
    return (
      <CompetitorApplyShell
        slug={config.slug}
        Wizard={competitor.Wizard}
        advisorsSubtitle={competitor.advisorsSubtitle}
        config={pub}
      />
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="border-b border-slate-200 bg-navy text-white">
        <div className="container-site py-14 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-forest-300">
            Fishing license assistance
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {config.stateName} Fishing License
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            Skip the paperwork. Fill out one simple form and we purchase your{" "}
            {config.stateName} fishing license from the official{" "}
            {config.officialPortalName} portal on your behalf.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <a
              href="#application"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-forest-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-forest-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
            >
              Start My Application
            </a>
            <ul className="flex flex-wrap items-center gap-5 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-forest-300" aria-hidden="true" />
                Secure submission
              </li>
              <li className="flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-forest-300" aria-hidden="true" />
                One clear total before you pay
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Application wizard (residency -> license -> add-ons -> details -> review) */}
      <section id="application" className="scroll-mt-20 bg-slate-50 py-12 sm:py-16">
        <div className="container-site">
          <ApplicationForm config={pub} />
        </div>
      </section>

      {/* Non-affiliation disclaimer — plain text, same wording as site footer. */}
      <section className="border-t border-slate-200 py-8">
        <div className="container-site max-w-3xl">
          <p className="text-xs leading-relaxed text-slate-500">
            {NON_AFFILIATION_DISCLAIMER}
          </p>
        </div>
      </section>
    </>
  );
}
