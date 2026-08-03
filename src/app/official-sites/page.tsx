import type { Metadata } from "next";
import { getAllStateConfigs } from "@/lib/states";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";

export const metadata: Metadata = {
  title: "Official State Fishing License Websites",
  description:
    "Official licensing portal links for every state AnglerPermit serves.",
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
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container-site max-w-3xl">
          {states.length === 0 ? (
            <p className="text-slate-500">State portals are being added. Check back soon.</p>
          ) : (
            <ul className="space-y-8">
              {states.map((state) => (
                <li key={state.slug}>
                  <p className="text-base text-navy">
                    <span className="font-semibold">State:</span> {state.stateName}
                  </p>
                  <p className="mt-1 text-base text-navy">
                    <span className="font-semibold">Official website:</span>{" "}
                    <a
                      href={state.officialPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-forest-700 underline underline-offset-2 break-all"
                    >
                      {state.officialPortalUrl}
                    </a>
                  </p>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-10">
            <DisclaimerBanner />
          </div>
        </div>
      </section>
    </>
  );
}
