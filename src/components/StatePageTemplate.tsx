import { ExternalLink, FileCheck2, ShieldCheck } from "lucide-react";
import type { StateConfig } from "@/lib/state-config";
import { publicConfig } from "@/lib/state-config";
import { ApplicationForm } from "@/components/ApplicationForm";

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
          <ApplicationForm config={publicConfig(config)} />
        </div>
      </section>

      {/* Small inline non-affiliation note (compliance) — no provenance line,
          no "official fee" claims. The official portal link stays. */}
      <section className="border-t border-slate-200 py-8">
        <div className="container-site max-w-3xl">
          <p className="text-xs leading-relaxed text-slate-500">
            AnglerPermit is a private license-assistance service, not a government agency.{" "}
            Official licensing portal:{" "}
            <a
              href={config.officialPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-forest-700 underline decoration-forest-300 underline-offset-2 hover:text-forest-500"
            >
              {config.officialPortalName}
              <ExternalLink className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
