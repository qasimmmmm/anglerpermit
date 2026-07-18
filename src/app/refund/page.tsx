import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "AnglerPermit's refund policy: service fee refundable until purchase, full refund if we cannot complete your order, and how state fee refunds work.",
};

const LAST_UPDATED = "January 1, 2025";

export default function RefundPage() {
  return (
    <>
      <section className="bg-navy py-16 text-white sm:py-20">
        <div className="container-site max-w-3xl">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Refund Policy</h1>
          <p className="mt-4 text-slate-300">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container-site max-w-3xl space-y-10 leading-relaxed text-slate-600">
          <div>
            <h2 className="text-xl font-bold">The short version</h2>
            <p className="mt-3">
              If we haven&apos;t purchased your license yet, you can cancel for a full refund. If
              we can&apos;t complete your purchase, you get a full refund of everything you paid.
              Once a license has been purchased from the state, the official state fees are
              generally non-refundable because state agencies do not refund us.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">1. Before we purchase (cancellation window)</h2>
            <p className="mt-3">
              You may cancel your application at any time before we complete the purchase on the
              official state portal. Contact us at{" "}
              <a href="mailto:support@anglerpermit.com" className="font-medium text-forest-700 underline">
                support@anglerpermit.com
              </a>{" "}
              with your reference number. On cancellation before purchase, we refund{" "}
              <strong className="text-navy">100% of what you paid</strong> — official fees and
              service fee — to your original payment method.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">2. If we cannot complete your order</h2>
            <p className="mt-3">
              If we are unable to purchase your license for any reason on our side — for example,
              a state system outage that prevents completion, an application we cannot process, or
              a rejection caused by our error — you receive a full refund of all amounts paid.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">3. After purchase</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-6">
              <li>
                <strong className="text-navy">Official state license fees:</strong> Most state
                agencies do not offer refunds on issued licenses, so we generally cannot recover
                these amounts. Where a state does allow a refund or correction, we will pursue it
                for you and pass through whatever the state returns.
              </li>
              <li>
                <strong className="text-navy">Our service fee:</strong> Once we have purchased your
                license, the service has been performed and the service fee is non-refundable —
                except where the purchase failed or was made incorrectly due to our error, in which
                case we refund it in full.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold">4. Errors caused by incorrect information</h2>
            <p className="mt-3">
              If a license is issued incorrectly because of inaccurate information in your
              application, contact us immediately. Where the state permits corrections or
              re-issuance, we will handle it at no additional service charge. Refunds in these
              cases depend on the state agency&apos;s policies.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">5. How to request a refund</h2>
            <p className="mt-3">
              Email{" "}
              <a href="mailto:support@anglerpermit.com" className="font-medium text-forest-700 underline">
                support@anglerpermit.com
              </a>{" "}
              with your reference number (starting with &ldquo;AP-&rdquo;), the email address on
              your application, and a brief description of the issue. We review every request and
              respond within two business days.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">6. Refund timing</h2>
            <p className="mt-3">
              Approved refunds are issued to your original payment method. Depending on your bank
              or card issuer, it may take 5–10 business days for the credit to appear.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">7. Chargebacks</h2>
            <p className="mt-3">
              Please contact us before filing a chargeback — most issues are resolved faster
              through our support team. Unwarranted chargebacks may be contested with the
              application and delivery records we retain.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
