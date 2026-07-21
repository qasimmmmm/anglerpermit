import type { Metadata } from "next";
import { DeliverForm } from "./deliver-form";

export const metadata: Metadata = {
  title: "Deliver a license",
  robots: { index: false, follow: false },
};

/**
 * Unlisted team page for delivering issued licenses to customers.
 * Protected server-side by ADMIN_PANEL_SECRET (checked in the API route) —
 * this page renders nothing sensitive and is excluded from robots/sitemap.
 */
export default function DeliverLicensePage() {
  return (
    <section className="py-14 sm:py-16">
      <div className="container-site max-w-2xl">
        <h1 className="text-2xl font-bold text-navy">Deliver a license</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Team use only. Sends the branded license-delivery email (with attachments) to the
          customer from licenses@anglerpermit.com, plus a copy to the admin inbox.
        </p>
        <DeliverForm />
      </div>
    </section>
  );
}
