"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { NON_AFFILIATION_DISCLAIMER } from "@/components/ui/DisclaimerBanner";
import { Logo } from "@/components/Logo";
import { useLocale, withLocalePrefix } from "@/i18n/LocaleProvider";

export function Footer() {
  const { t, locale } = useLocale();

  function hrefFor(path: string) {
    return withLocalePrefix(path, locale);
  }

  const legalLinks = [
    { href: "/privacy", label: t("footer.privacy") },
    { href: "/terms", label: t("footer.terms") },
    { href: "/refund", label: t("footer.refund") },
    { href: "/disclaimer", label: t("footer.disclaimer") },
  ];

  const siteLinks = [
    { href: "/how-it-works", label: t("footer.howItWorks") },
    { href: "/states", label: t("footer.statesWeServe") },
    { href: "/official-sites", label: t("footer.officialSites") },
    { href: "/faq", label: t("footer.faq") },
    { href: "/about", label: t("footer.aboutUs") },
    { href: "/contact", label: t("nav.contact") },
  ];

  return (
    <footer data-site-footer className="border-t border-white/10 bg-navy text-slate-300">
      <div className="container-site py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <Link href={hrefFor("/")} aria-label={t("nav.homeAria")} className="inline-flex items-center">
              <Logo theme="white" className="h-10 w-auto md:h-12" />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">{t("footer.blurb")}</p>
          </div>

          <nav aria-label={t("footer.site")}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              {t("footer.site")}
            </h2>
            <ul className="mt-4 space-y-2 text-sm">
              {siteLinks.map((link) => (
                <li key={link.href}>
                  <Link href={hrefFor(link.href)} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t("footer.legal")}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              {t("footer.legal")}
            </h2>
            <ul className="mt-4 space-y-2 text-sm">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={hrefFor(link.href)} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="mt-10 text-xs leading-relaxed text-slate-500">{NON_AFFILIATION_DISCLAIMER}</p>

        <div className="mt-6 flex items-start gap-2 text-xs text-slate-400">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-forest-300" aria-hidden="true" />
          <p>
            {t("footer.dataNote")}{" "}
            <Link href={hrefFor("/privacy")} className="underline hover:text-white">
              {t("footer.privacy")}
            </Link>{" "}
            {t("footer.dataNoteEnd")}
          </p>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          © {new Date().getFullYear()} AnglerPermit.com. {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
