import type { ReactNode } from "react";

const SUPPORT_EMAIL = "support@anglerpermit.com";

type LegalContactBlockProps = {
  /** Optional note shown after the email (e.g. preferred subject line). */
  emailNote?: ReactNode;
};

/**
 * Shared business contact block for legal pages (Privacy, Terms, Refund, Disclaimer).
 */
export function LegalContactBlock({ emailNote }: LegalContactBlockProps) {
  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-6 py-5">
      <p>
        <span className="font-medium text-navy">Business Name:</span> OpenGov Services LLC
      </p>
      <p className="mt-2">
        <span className="font-medium text-navy">Contact Person/Department:</span> Customer
        Support
      </p>
      <p className="mt-2">
        <span className="font-medium text-navy">Email:</span>{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="font-medium text-forest-700 underline"
        >
          {SUPPORT_EMAIL}
        </a>
        {emailNote ? <> {emailNote}</> : null}
      </p>
      <p className="mt-2">
        <span className="font-medium text-navy">Mailing Address:</span> 500 4TH ST NW, SUITE
        102, ALBUQUERQUE, NM 87102, USA
      </p>
    </div>
  );
}
