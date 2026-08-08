"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLocale, withLocalePrefix } from "@/i18n/LocaleProvider";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || "/";
  const { t, locale } = useLocale();

  const barePath = pathname === "/es" ? "/" : pathname.replace(/^\/es(?=\/|$)/, "") || "/";

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/how-it-works", label: t("nav.howItWorks") },
    { href: "/states", label: t("nav.states") },
    { href: "/faq", label: t("nav.faq") },
    { href: "/about", label: t("nav.about") },
    { href: "/contact", label: t("nav.contact") },
  ];

  function hrefFor(path: string) {
    return withLocalePrefix(path, locale);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-site flex h-16 items-center justify-between gap-4 md:h-[72px]">
        <Link
          href={hrefFor("/")}
          aria-label={t("nav.homeAria")}
          className="flex max-w-[60vw] items-center"
          onClick={() => setOpen(false)}
        >
          <Logo priority className="h-9 w-auto md:h-12" />
        </Link>

        <nav aria-label={t("nav.primary")} className="hidden items-center gap-0.5 xl:gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={hrefFor(link.href)}
              className={`whitespace-nowrap rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-navy-50 hover:text-navy xl:px-3 ${
                barePath === link.href ? "text-navy" : "text-slate-600"
              }`}
              aria-current={barePath === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <LanguageToggle className="hidden sm:inline-flex" />
          <Link
            href={hrefFor("/states")}
            className={`${buttonClasses("accent", "md")} hidden whitespace-nowrap sm:inline-flex`}
          >
            {t("nav.startApplication")}
          </Link>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-navy hover:bg-navy-50 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label={t("nav.mobile")} className="border-t border-slate-200 bg-white lg:hidden">
          <div className="container-site flex flex-col gap-1 py-4">
            <div className="mb-2 px-3">
              <LanguageToggle />
            </div>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={hrefFor(link.href)}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2.5 text-base font-medium ${
                  barePath === link.href ? "bg-navy-50 text-navy" : "text-slate-600 hover:bg-navy-50"
                }`}
                aria-current={barePath === link.href ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={hrefFor("/states")}
              onClick={() => setOpen(false)}
              className={`${buttonClasses("accent", "lg")} mt-2`}
            >
              {t("nav.startApplication")}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
