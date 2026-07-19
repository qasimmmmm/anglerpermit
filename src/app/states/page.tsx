import type { Metadata } from "next";
import { getAllStateConfigs } from "@/lib/states";
import { StateGrid } from "@/components/StateGrid";
import { DisclaimerBanner } from "@/components/ui/DisclaimerBanner";

export const metadata: Metadata = {
  title: "States We Serve",
  description:
    "Fishing license assistance by state. Current license data and one clear total before you pay — no hidden fees — for every state we serve.",
};

export default async function StatesPage() {
  const states = await getAllStateConfigs();

  return (
    <>
      <section className="bg-navy py-16 text-white sm:py-20">
        <div className="container-site">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">States we serve</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            Select your state to start your application. Every state guide is built from
            current licensing data, with one clear total shown before you pay — no
            hidden fees.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container-site">
          <StateGrid states={states} />
          <div className="mt-10 max-w-3xl">
            <DisclaimerBanner />
          </div>
        </div>
      </section>
    </>
  );
}
