import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, MapPin } from "lucide-react";
import { getAllStateConfigs } from "@/lib/states";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";

export const metadata: Metadata = {
  title: "Official State Fishing License Websites",
  description:
    "Official fish and wildlife / licensing portal links for every state AnglerPermit serves. Buy directly from the state agency if you prefer.",
};

export default async function OfficialSitesPage() {
  const states = await getAllStateConfigs();

  return (
    <>
      <section className="bg-navy py-16 text-white sm:py-20">
        <div className="container-site max-w-3xl">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Official state websites
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            Direct links to the official licensing portals for every state we assist
            with. Licenses are also available from these agencies, often at a lower
            cost if you apply yourself.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container-site">
          {states.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500">
              State portals are being added. Check back soon.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {states.map((state) => (
                <li
                  key={state.slug}
                  className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 flex-shrink-0 text-forest-600" aria-hidden="true" />
                      <h2 className="text-lg font-semibold text-navy">{state.stateName}</h2>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{state.officialAgencyName}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{state.officialPortalName}</p>
                  </div>
                  <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
                    <a
                      href={state.officialPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md bg-forest-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-forest-500"
                    >
                      Official site
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                    <Link
                      href={`/${state.slug}`}
                      className="text-sm font-semibold text-forest-700 underline-offset-2 hover:underline"
                    >
                      Apply with us
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-10 max-w-3xl">
            <DisclaimerBanner />
          </div>
        </div>
      </section>
    </>
  );
}
