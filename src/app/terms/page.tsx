import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms governing your use of AnglerPermit's license-assistance service, including authorization to purchase on your behalf, fees, and limitations.",
};

const LAST_UPDATED = "January 1, 2025";

export default function TermsPage() {
  return (
    <>
      <section className="bg-navy py-16 text-white sm:py-20">
        <div className="container-site max-w-3xl">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Terms of Service</h1>
          <p className="mt-4 text-slate-300">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container-site max-w-3xl space-y-10 leading-relaxed text-slate-600">
          <div>
            <h2 className="text-xl font-bold">1. The service</h2>
            <p className="mt-3">
              AnglerPermit.com (&ldquo;AnglerPermit,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) is a
              privately owned license-assistance service. We help you prepare and submit a fishing
              license application, and — with your authorization — purchase the license from the
              official state licensing portal on your behalf.{" "}
              <strong className="text-navy">
                We are not a government agency and are not affiliated with, endorsed by, or
                operated by any government agency.
              </strong>{" "}
              Fishing licenses are also available directly from official state agencies, often at
              a lower cost.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">2. Acceptance of terms</h2>
            <p className="mt-3">
              By using this site or submitting an application, you agree to these Terms of Service
              and our{" "}
              <Link href="/privacy" className="font-medium text-forest-700 underline">
                Privacy Policy
              </Link>
              . If you do not agree, do not use the service.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">3. Your authorization</h2>
            <p className="mt-3">
              When you submit an application and check the authorization consent, you appoint
              AnglerPermit as your agent for the limited purpose of submitting your application and
              purchasing the selected license and add-ons from the official state portal using the
              information you provided. You confirm you are authorized to provide that information
              and that it is accurate and complete.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">4. Accuracy of your information</h2>
            <p className="mt-3">
              You are responsible for the accuracy of everything you submit. Providing false
              information on a license application may violate state law and can result in fines,
              license revocation, or prosecution. We may reject or cancel applications we believe
              contain false or fraudulent information.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">5. Fees and pricing</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-6">
              <li>
                <strong className="text-navy">Official state fees</strong> are set by the state and
                passed through at cost — we never mark them up.
              </li>
              <li>
                <strong className="text-navy">Our service fee</strong> is shown as a separate line
                item before you submit and covers application review, purchase handling, and
                support.
              </li>
              <li>All prices are in US dollars. Applicable taxes, if any, will be shown before submission.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold">6. Eligibility and state decisions</h2>
            <p className="mt-3">
              License eligibility, residency definitions, and issuance decisions belong solely to
              the state agency. We do not guarantee that any license will be issued, nor the
              state&apos;s processing times. If the state rejects an application, we will notify
              you and work with you on next steps.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">7. Refunds</h2>
            <p className="mt-3">
              Refunds are governed by our{" "}
              <Link href="/refund" className="font-medium text-forest-700 underline">
                Refund Policy
              </Link>
              , which is incorporated into these terms.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">8. Acceptable use</h2>
            <p className="mt-3">You agree not to:</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-6">
              <li>submit applications for another person without their knowledge and authorization;</li>
              <li>use the service for any unlawful purpose or to commit fraud;</li>
              <li>attempt to disrupt, probe, or gain unauthorized access to the service; or</li>
              <li>misrepresent your identity, residency, or eligibility.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold">9. Intellectual property</h2>
            <p className="mt-3">
              The site&apos;s design, text, and code are owned by AnglerPermit. License names,
              prices, and agency names referenced on state pages belong to their respective state
              agencies and are used for identification only.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">10. Disclaimers</h2>
            <p className="mt-3">
              The service is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo; To the
              fullest extent permitted by law, we disclaim all warranties, express or implied,
              including merchantability, fitness for a particular purpose, and non-infringement.
              We do not warrant that state systems will be available or error-free.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">11. Limitation of liability</h2>
            <p className="mt-3">
              To the fullest extent permitted by law, AnglerPermit&apos;s total liability arising
              from or related to the service is limited to the amount you paid us in service fees
              for the application at issue. We are not liable for indirect, incidental, special,
              consequential, or punitive damages, including lost fishing trips, state penalties
              arising from inaccurate information you provided, or actions of state agencies.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">12. Changes to the service or terms</h2>
            <p className="mt-3">
              We may update these terms from time to time. The current version is always posted on
              this page with its effective date. Continued use after changes take effect
              constitutes acceptance.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">13. Contact</h2>
            <p className="mt-3">
              Questions about these terms:{" "}
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
