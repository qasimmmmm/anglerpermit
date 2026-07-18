import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How AnglerPermit collects, uses, protects, and retains your personal information — including Social Security numbers — when providing license-assistance services.",
};

const LAST_UPDATED = "January 1, 2025";

export default function PrivacyPage() {
  return (
    <>
      <section className="bg-navy py-16 text-white sm:py-20">
        <div className="container-site max-w-3xl">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Privacy Policy</h1>
          <p className="mt-4 text-slate-300">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container-site max-w-3xl space-y-10 leading-relaxed text-slate-600">
          <div>
            <h2 className="text-xl font-bold">1. Who we are</h2>
            <p className="mt-3">
              AnglerPermit.com (&ldquo;AnglerPermit,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) is a
              privately owned license-assistance service. We are not a government agency and are
              not affiliated with, endorsed by, or operated by any government agency. This policy
              explains what personal information we collect, why, how we protect it, and the
              choices you have.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">2. Information we collect</h2>
            <p className="mt-3">When you submit an application, we collect the information your state&apos;s official licensing portal requires, which typically includes:</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-6">
              <li>Full legal name, date of birth, and contact details (email, phone)</li>
              <li>Mailing and residential address</li>
              <li>Residency status and identification details (e.g., driver&apos;s license or state ID information)</li>
              <li>Physical descriptors where the state requires them</li>
              <li>
                <strong className="text-navy">Social Security number (SSN)</strong> — only where the
                state requires it by law for license applicants
              </li>
              <li>License selections, add-ons, and purchase details</li>
            </ul>
            <p className="mt-3">
              We also collect standard technical data (such as IP address and browser type) for
              security and analytics purposes.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">3. How we use your information</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-6">
              <li>To review your application and purchase your fishing license from the official state portal on your behalf</li>
              <li>To communicate with you about your application, including delivering your license by email</li>
              <li>To prevent fraud and comply with legal obligations</li>
              <li>To improve our service (using aggregated, de-identified data)</li>
            </ul>
            <p className="mt-3">
              <strong className="text-navy">We do not sell your personal information</strong>, and we
              do not share it with third parties for their marketing purposes.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">4. Social Security numbers</h2>
            <p className="mt-3">
              Certain states require an SSN to issue a fishing license (often tied to
              child-support enforcement laws). When your state requires it:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-6">
              <li>Your SSN is transmitted only over encrypted (TLS) connections.</li>
              <li>It is masked (<span className="font-mono">***-**-6789</span>) in every notification, email, and log we produce — we never display or email a full SSN.</li>
              <li>It is used solely to complete your license purchase on the official state portal.</li>
              <li>Access is limited to the team members processing your application.</li>
            </ul>
            <p className="mt-3">
              If you prefer not to provide your SSN to us, you can purchase your license directly
              from the official state portal instead — every state page links to it.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">5. Sharing with state agencies</h2>
            <p className="mt-3">
              To fulfill your order, we submit your application details — including your SSN where
              required — to the official state licensing portal operated by or for the state fish
              and wildlife agency. That agency&apos;s own privacy policies govern how it handles
              your information. We link to the official portal on every state page so you can
              review their practices.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">6. Service providers</h2>
            <p className="mt-3">
              We use a small number of vendors to operate the service — for example, transactional
              email delivery and website hosting. These providers process data only on our
              instructions and are bound by contractual confidentiality and security obligations.
              Sensitive identifiers are masked before being included in any email.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">7. Data security</h2>
            <p className="mt-3">
              We use industry-standard safeguards including TLS encryption in transit, strict
              access controls, and masking of sensitive fields in all operational tooling. Our
              roadmap includes encryption of stored application data at rest as we introduce
              persistent storage. No method of transmission or storage is 100% secure, but
              protecting your information — especially SSNs — is a core design requirement of
              this service.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">8. Data retention</h2>
            <p className="mt-3">
              We retain application data only as long as necessary to complete your purchase,
              provide support, and meet legal, tax, and accounting obligations. When data is no
              longer needed, it is securely deleted or de-identified. You may request earlier
              deletion (see Section 10), subject to legal retention requirements.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">9. Cookies and analytics</h2>
            <p className="mt-3">
              We may use essential cookies for site functionality and privacy-respecting analytics
              to understand aggregate usage. We do not use advertising trackers.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">10. Your rights and choices</h2>
            <p className="mt-3">
              Depending on your state of residence, you may have rights to access, correct, delete,
              or receive a copy of your personal information, and to opt out of certain processing.
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:support@anglerpermit.com" className="font-medium text-forest-700 underline">
                support@anglerpermit.com
              </a>
              . We will respond within the timeframe required by applicable law.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">11. Children</h2>
            <p className="mt-3">
              Our service is not directed to children under 13, and we do not knowingly collect
              their personal information. Youth license applications must be submitted by a parent
              or legal guardian.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">12. Changes to this policy</h2>
            <p className="mt-3">
              If we change this policy, we will post the updated version here with a new
              &ldquo;last updated&rdquo; date. Material changes will be highlighted on the site
              before they take effect.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold">13. Contact</h2>
            <p className="mt-3">
              Privacy questions or requests:{" "}
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
