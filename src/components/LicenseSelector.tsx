"use client";

import { Check } from "lucide-react";
import type { StateConfig } from "@/lib/state-config";
import { addOnsForLicense, licensesForResidency } from "@/lib/state-config";
import { CATEGORY_LABELS, formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";

/**
 * Step 1 of the wizard: residency -> license -> add-ons.
 * Mirrors the official portal flow: the residency choice FILTERS the license list.
 */

export interface LicenseSelection {
  residency: string;
  licenseId: string;
  addOnIds: string[];
}

export interface LicenseSelectorProps {
  config: StateConfig;
  value: LicenseSelection;
  errors?: { residency?: string; licenseId?: string };
  onResidencyChange: (residency: string) => void;
  onLicenseChange: (licenseId: string) => void;
  onAddOnToggle: (addOnId: string, checked: boolean) => void;
}

export function LicenseSelector({
  config,
  value,
  errors,
  onResidencyChange,
  onLicenseChange,
  onAddOnToggle,
}: LicenseSelectorProps) {
  const visibleLicenses = licensesForResidency(config, value.residency || undefined);
  const applicableAddOns = addOnsForLicense(config, value.licenseId || undefined);

  // Group licenses by category, preserving config order within each group.
  const categories = Array.from(new Set(visibleLicenses.map((l) => l.category)));
  const showCategoryHeadings = categories.length > 1;

  return (
    <div className="space-y-8">
      {/* Residency */}
      <fieldset>
        <legend className="text-base font-semibold text-navy">
          Residency status
          <span className="ml-1 text-red-600" aria-hidden="true">
            *
          </span>
        </legend>
        <p className="mt-1 text-sm text-slate-500">
          Select your residency to see the licenses available to you — exactly as the
          official {config.officialPortalName} portal does.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Residency status">
          {config.residencyOptions.map((opt) => {
            const selected = value.residency === opt.value;
            return (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  selected
                    ? "border-forest-500 bg-forest-50 ring-1 ring-forest-500"
                    : "border-slate-300 bg-white hover:border-navy-300"
                }`}
              >
                <input
                  type="radio"
                  name="residency"
                  value={opt.value}
                  checked={selected}
                  onChange={() => onResidencyChange(opt.value)}
                  className="h-4 w-4 border-slate-300 text-forest-600 focus:ring-forest-500"
                />
                <span className="text-sm font-medium text-navy">{opt.label}</span>
              </label>
            );
          })}
        </div>
        {errors?.residency && (
          <p role="alert" className="mt-2 text-sm font-medium text-red-600">
            {errors.residency}
          </p>
        )}
      </fieldset>

      {/* Licenses */}
      <fieldset>
        <legend className="text-base font-semibold text-navy">
          Choose your license
          <span className="ml-1 text-red-600" aria-hidden="true">
            *
          </span>
        </legend>
        {config.licenseYearNote && (
          <p className="mt-1 text-sm text-slate-500">{config.licenseYearNote}</p>
        )}
        {!value.residency && (
          <p className="mt-3 rounded-lg bg-navy-50 px-4 py-3 text-sm text-navy">
            Select your residency status above to filter the available licenses.
          </p>
        )}
        <div className="mt-3 space-y-6" role="radiogroup" aria-label="License options">
          {categories.map((category) => (
            <div key={category}>
              {showCategoryHeadings && (
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                  {CATEGORY_LABELS[category] ?? category}
                </h3>
              )}
              <div className="grid gap-3 md:grid-cols-2">
                {visibleLicenses
                  .filter((l) => l.category === category)
                  .map((license) => {
                    const selected = value.licenseId === license.id;
                    return (
                      <label
                        key={license.id}
                        className={`relative flex cursor-pointer flex-col rounded-xl border px-4 py-4 transition-colors ${
                          selected
                            ? "border-forest-500 bg-forest-50 ring-1 ring-forest-500"
                            : "border-slate-300 bg-white hover:border-navy-300"
                        }`}
                      >
                        <span className="flex items-start justify-between gap-3">
                          <span className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="licenseId"
                              value={license.id}
                              checked={selected}
                              onChange={() => onLicenseChange(license.id)}
                              className="mt-1 h-4 w-4 border-slate-300 text-forest-600 focus:ring-forest-500"
                            />
                            <span>
                              <span className="block text-sm font-semibold text-navy">
                                {license.name}
                              </span>
                              <span className="mt-0.5 flex flex-wrap items-center gap-2">
                                <Badge tone="navy">{license.duration}</Badge>
                                {license.residency !== "any" && (
                                  <Badge tone="slate" className="capitalize">
                                    {license.residency === "nonresident" ? "Nonresident" : license.residency}
                                  </Badge>
                                )}
                              </span>
                            </span>
                          </span>
                          <span className="whitespace-nowrap text-base font-bold text-navy">
                            {formatPrice(license.price)}
                          </span>
                        </span>
                        {license.description && (
                          <span className="mt-2 block pl-7 text-sm text-slate-600">
                            {license.description}
                          </span>
                        )}
                        {selected && (
                          <span className="absolute right-3 top-3 hidden" aria-hidden="true">
                            <Check className="h-4 w-4 text-forest-600" />
                          </span>
                        )}
                      </label>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
        {errors?.licenseId && (
          <p role="alert" className="mt-2 text-sm font-medium text-red-600">
            {errors.licenseId}
          </p>
        )}
      </fieldset>

      {/* Add-ons */}
      {value.licenseId && applicableAddOns.length > 0 && (
        <fieldset>
          <legend className="text-base font-semibold text-navy">Add-ons &amp; stamps</legend>
          <p className="mt-1 text-sm text-slate-500">
            Required add-ons for your license are selected automatically.
          </p>
          <div className="mt-3 space-y-2">
            {applicableAddOns.map((addOn) => {
              const checked = addOn.required || value.addOnIds.includes(addOn.id);
              return (
                <label
                  key={addOn.id}
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                    addOn.required
                      ? "cursor-not-allowed border-slate-200 bg-slate-50"
                      : "cursor-pointer border-slate-300 bg-white hover:border-navy-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={addOn.required}
                    onChange={(e) => onAddOnToggle(addOn.id, e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-forest-600 focus:ring-forest-500"
                    aria-describedby={addOn.required ? `addon-${addOn.id}-required` : undefined}
                  />
                  <span className="flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-navy">{addOn.name}</span>
                      <span className="text-sm font-semibold text-navy">
                        {formatPrice(addOn.price)}
                      </span>
                    </span>
                    {addOn.description && (
                      <span className="mt-0.5 block text-sm text-slate-600">{addOn.description}</span>
                    )}
                    {addOn.required && (
                      <span
                        id={`addon-${addOn.id}-required`}
                        className="mt-1 inline-block text-xs font-medium text-forest-700"
                      >
                        Required by {config.officialAgencyName} — added automatically
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
    </div>
  );
}
