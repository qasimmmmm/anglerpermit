"use client";

import type { ComponentType } from "react";
import type { StateConfig } from "@/lib/state-config";
import { useLocale } from "@/i18n/LocaleProvider";

const STATE_LABELS: Record<string, { en: string; es: string }> = {
  california: { en: "California", es: "California" },
  colorado: { en: "Colorado", es: "Colorado" },
  florida: { en: "Florida", es: "Florida" },
  michigan: { en: "Michigan", es: "Michigan" },
  "north-carolina": { en: "North Carolina", es: "Carolina del Norte" },
  "south-carolina": { en: "South Carolina", es: "Carolina del Sur" },
  texas: { en: "Texas", es: "Texas" },
};

export function CompetitorApplyShell({
  slug,
  Wizard,
  advisorsSubtitle = false,
  config,
}: {
  slug: string;
  Wizard: ComponentType<{ config: StateConfig }>;
  advisorsSubtitle?: boolean;
  config: StateConfig;
}) {
  const { t, locale } = useLocale();
  const labels = STATE_LABELS[slug] ?? { en: config.stateName, es: config.stateName };
  const stateLabel = locale === "es" ? labels.es : labels.en;

  return (
    <>
      <section className="border-b border-slate-200 bg-slate-100">
        <div className="mx-auto max-w-4xl px-4 py-8 text-center sm:px-6">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            {t("apply.title", { state: stateLabel })}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
            {advisorsSubtitle
              ? t("apply.subtitleAdvisors")
              : t("apply.subtitle", { state: stateLabel })}
          </p>
        </div>
      </section>

      <div className="border-b border-navy/30 bg-white">
        <div className="mx-auto h-1 max-w-xl bg-navy/20 px-4">
          <div className="h-full w-full bg-navy" />
        </div>
      </div>

      <section id="application" className="scroll-mt-20 bg-[#f5f7fa] py-6 sm:py-10">
        <div className="px-4">
          <Wizard config={config} />
        </div>
      </section>
    </>
  );
}
