import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { NON_AFFILIATION_DISCLAIMER } from "@/components/ui/DisclaimerBanner";
import { Logo } from "@/components/Logo";

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/refund", label: "Refund Policy" },
  { href: "/disclaimer", label: "Disclaimer" },
];

const SITE_LINKS = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/states", label: "States We Serve" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  return (
    <footer data-site-footer className="border-t border-white/10 bg-navy text-slate-300">
      <div className="container-site py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <Link href="/" aria-label="AnglerPermit — home" className="inline-flex items-center">
              {/* White lockup on the navy footer background. */}
              <Logo theme="white" height={34} />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              A private license-assistance service that handles the paperwork so you can
              get on the water faster.
            </p>
          </div>

          <nav aria-label="Site">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Site</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {SITE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Legal</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Mandatory persistent non-affiliation disclaimer — kept verbatim,
            styled as a single small, quiet line (subtle but legible). The full
            version with context lives on /disclaimer. */}
        <p className="mt-10 text-xs leading-relaxed text-slate-500">
          {NON_AFFILIATION_DISCLAIMER}{" "}
          <Link href="/disclaimer" className="underline decoration-slate-600 underline-offset-2 hover:text-slate-300">
            Learn more
          </Link>
        </p>

        <div className="mt-6 flex items-start gap-2 text-xs text-slate-400">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-forest-300" aria-hidden="true" />
          <p>
            Your data is transmitted over encrypted connections. Sensitive identifiers such as
            Social Security numbers are masked in all notifications and logs and are never
            displayed after submission. See our{" "}
            <Link href="/privacy" className="underline hover:text-white">
              Privacy Policy
            </Link>{" "}
            for details on how we collect, use, and protect your information.
          </p>
        </div>

        <p className="mt-8 border-t border-white/10 pt-6 text-xs text-slate-500">
          &copy; {new Date().getFullYear()} AnglerPermit.com. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
