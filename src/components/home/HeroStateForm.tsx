"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";

export interface HeroStateOption {
  slug: string;
  stateName: string;
}

/**
 * Hero entry card — one low-friction question ("Where are you fishing?")
 * that routes straight into the state-specific application. This is the
 * iVisa-style checker pattern: a single decision before the real form.
 */
export function HeroStateForm({ states }: { states: HeroStateOption[] }) {
  const router = useRouter();
  const [slug, setSlug] = useState("");

  return (
    <form
      className="w-full max-w-lg rounded-xl bg-white p-4 shadow-2xl ring-1 ring-slate-900/10 sm:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (slug) router.push(`/${slug}`);
      }}
    >
      <label
        htmlFor="hero-state"
        className="block text-sm font-semibold text-navy"
      >
        Where are you fishing?
      </label>
      <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <MapPin
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <select
            id="hero-state"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-3 pl-9 pr-8 text-sm font-medium text-navy focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/40"
          >
            <option value="" disabled>
              Choose your state
            </option>
            {states.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.stateName}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          >
            <path
              fillRule="evenodd"
              d="M5.22 7.22a.75.75 0 0 1 1.06 0L10 10.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <button
          type="submit"
          className={`${buttonClasses("accent", "lg")} shrink-0 whitespace-nowrap`}
        >
          Start My Application
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-slate-500">
        Guided form &middot; itemized fees before you pay &middot; reviewed by a real
        person
      </p>
    </form>
  );
}
