"use client";

import { useLocale } from "@/i18n/LocaleProvider";
import type { Locale } from "@/i18n/messages";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  function select(next: Locale) {
    // Always invoke — path/cookie can desync from React state after /es rewrites.
    setLocale(next);
  }

  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-md border border-slate-200 bg-slate-50 p-0.5 ${className}`}
      role="group"
      aria-label="Language"
    >
      {(["en", "es"] as const).map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            onClick={() => select(code)}
            className={[
              "rounded px-2 py-1 text-xs font-semibold uppercase transition-colors",
              active
                ? "bg-navy text-white"
                : "text-slate-500 hover:bg-white hover:text-navy",
            ].join(" ")}
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
