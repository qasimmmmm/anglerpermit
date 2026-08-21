"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Controller,
  useForm,
  type FieldErrors,
  type Path,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  CreditCard,
  Eye,
  EyeOff,
  FileCheck2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import type { FormFieldDef, StateConfig, TokenizedPayment } from "@/lib/state-config";
import {
  addOnsForLicense,
  buildFieldSchema,
  buildSubmissionSchema,
  computeOrderTotal,
  digitsOnlyPatternCount,
  formatLicenseDateRange,
  isFieldEffectivelyRequired,
  isFieldVisible,
  licensesForResidency,
  maskSSN,
  residencyPricingTier,
} from "@/lib/state-config";
import { applyMask } from "@/lib/masks";
import { formatPrice } from "@/lib/format";
import { localIsoDate } from "@/lib/local-date";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { LicenseSelector } from "@/components/LicenseSelector";
import { PriceSummary } from "@/components/PriceSummary";
import { PaymentStep } from "@/components/PaymentStep";
import { PurchaseConversionBeacon } from "@/components/PurchaseConversionBeacon";

interface WizardValues {
  stateSlug: string;
  residency: string;
  licenseId: string;
  addOnIds: string[];
  data: Record<string, unknown>;
  consents: {
    accurateAndTerms: boolean;
  };
  /** Set only after client-side tokenization — never contains card data. */
  payment: TokenizedPayment;
}

const STEP_TITLES = ["Choose license", "Applicant details", "Review", "Payment"] as const;

function defaultData(fields: FormFieldDef[]): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.defaultValue !== undefined) {
      data[f.name] = f.defaultValue;
    } else {
      data[f.name] = f.type === "checkbox" ? false : "";
    }
  }
  return data;
}

/** Merge saved draft values onto field defaults without wiping intentional defaults. */
function mergeApplicantData(
  fields: FormFieldDef[],
  saved: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const data = { ...defaultData(fields), ...(saved ?? {}) };
  for (const f of fields) {
    if (f.defaultValue === undefined) continue;
    const current = data[f.name];
    if (current === "" || current == null) {
      data[f.name] = f.defaultValue;
    }
    // Legacy free-text country drafts used "United States" instead of "us".
    if (f.name === "country" && typeof current === "string") {
      const normalized = current.trim().toLowerCase();
      if (normalized === "united states" || normalized === "usa" || normalized === "u.s.") {
        data[f.name] = "us";
      }
    }
  }
  return data;
}

function dataErrorsOf(errors: FieldErrors<WizardValues>): Record<string, { message?: string }> {
  return (errors.data ?? {}) as Record<string, { message?: string }>;
}

/** Format a value for the review screen (SSN always masked). */
function displayValue(def: FormFieldDef, value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  switch (def.type) {
    case "ssn":
      return maskSSN(value);
    case "checkbox":
      return value ? "Yes" : "No";
    case "select":
    case "radio":
      return def.options?.find((o) => o.value === value)?.label ?? String(value);
    case "date":
      return formatDateForDisplay(value);
    default:
      return String(value);
  }
}

/**
 * Pretty-print a date field for the review screen. Accepts either the
 * dob-mask form (MM/DD/YYYY) or the native <input type="date"> form
 * (YYYY-MM-DD) and renders "Aug 4, 2026". Falls back to the raw string
 * if the value cannot be parsed.
 */
function formatDateForDisplay(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "—";
  const s = value.trim();
  let d: Date | null = null;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    d = new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
  } else {
    const us = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (us) {
      d = new Date(Date.UTC(Number(us[3]), Number(us[1]) - 1, Number(us[2])));
    }
  }
  if (!d || Number.isNaN(d.getTime())) return s;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/* ------------------------------------------------------------------ */
/* SSN input with show/hide toggle                                     */
/* ------------------------------------------------------------------ */

function SsnInput({
  value,
  onChange,
  onBlur,
  name,
  error,
  helpText,
  required,
  label,
  useMask,
  maxDigits,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  name: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  label: string;
  /** Apply the dashed 123-45-6789 input mask (default). False when the field
   * defines its own validation.pattern (e.g. raw 9-digit SSN). */
  useMask: boolean;
  /** Digit cap for unmasked (raw-pattern) entry — 9 for a full SSN. */
  maxDigits: number;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      label={label}
      name={name}
      type={visible ? "text" : "password"}
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder ?? (useMask ? "123-45-6789" : undefined)}
      value={value}
      error={error}
      helpText={helpText}
      required={required}
      onChange={(e) =>
        onChange(
          useMask
            ? applyMask("ssn", e.target.value)
            : // Digits-only live entry; the mask already strips non-digits.
              e.target.value.replace(/\D/g, "").slice(0, maxDigits),
        )
      }
      onBlur={onBlur}
      rightAdornment={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide Social Security number" : "Show Social Security number"}
          className="rounded p-1 text-slate-500 hover:text-navy"
        >
          {visible ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
        </button>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* Single field renderer — supports every FieldType in the contract    */
/* ------------------------------------------------------------------ */

function FieldControl({
  def,
  config,
  control,
  errors,
  required,
}: {
  def: FormFieldDef;
  config: StateConfig;
  control: ReturnType<typeof useForm<WizardValues>>["control"];
  errors: Record<string, { message?: string }>;
  required: boolean;
}) {
  const name = `data.${def.name}` as Path<WizardValues>;
  const error = errors[def.name]?.message;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: f }) => {
        const value = f.value as string | boolean | undefined;
        switch (def.type) {
          case "email":
          case "tel":
          case "text":
          case "zip":
          case "date": {
            // A field-level validation.pattern normally suppresses the input
            // mask so the raw value can match (e.g. TX 5-digit ZIP). Phone
            // fields with a digits-only pattern (TX ^\d{10}$) keep the
            // (xxx) xxx-xxxx display mask — the schema strips non-digits
            // before applying the pattern.
            const digitLimit = digitsOnlyPatternCount(def.validation?.pattern);
            const useMask =
              Boolean(def.mask) &&
              (!def.validation?.pattern || (def.mask === "phone" && digitLimit !== null));
            const inputType =
              def.type === "email" ? "email" : def.type === "tel" ? "tel" : def.type === "date" && !def.mask ? "date" : "text";
            const autoComplete =
              def.autocomplete ??
              (def.type === "email" ? "email" : def.type === "tel" ? "tel" : def.type === "zip" ? "postal-code" : undefined);
            const dateMin =
              def.type === "date" && !def.mask && def.name === "licenseStartDate"
                ? localIsoDate()
                : undefined;
            return (
              <Input
                label={def.label}
                name={f.name}
                type={inputType}
                min={dateMin}
                inputMode={def.mask || digitLimit !== null ? "numeric" : undefined}
                placeholder={def.placeholder ?? (useMask && def.mask === "dob" ? "MM/DD/YYYY" : undefined)}
                autoComplete={autoComplete}
                value={(value as string) ?? ""}
                onChange={(e) => {
                  if (useMask && def.mask) {
                    f.onChange(applyMask(def.mask, e.target.value));
                  } else if (digitLimit !== null) {
                    // Live digits-only entry for digits-only patterns
                    // (e.g. NC last-4-of-SSN ^\d{4}$).
                    f.onChange(e.target.value.replace(/\D/g, "").slice(0, digitLimit));
                  } else {
                    f.onChange(e.target.value);
                  }
                }}
                onBlur={f.onBlur}
                error={error}
                helpText={def.helpText}
                required={required}
              />
            );
          }
          case "ssn":
            return (
              <div>
                <SsnInput
                  name={f.name}
                  label={def.label}
                  value={(value as string) ?? ""}
                  onChange={f.onChange}
                  onBlur={f.onBlur}
                  error={error}
                  helpText={def.helpText}
                  required={required}
                  useMask={!def.validation?.pattern}
                  maxDigits={digitsOnlyPatternCount(def.validation?.pattern) ?? 9}
                  placeholder={def.placeholder}
                />
                {config.requiresSSN && config.ssnExplainer && (
                  <details className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm">
                    <summary className="cursor-pointer font-medium text-navy">
                      Why is this required?
                    </summary>
                    <p className="mt-2 leading-relaxed text-slate-600">{config.ssnExplainer}</p>
                  </details>
                )}
              </div>
            );
          case "number":
            return (
              <Input
                label={def.label}
                name={f.name}
                type="number"
                inputMode="numeric"
                placeholder={def.placeholder}
                autoComplete={def.autocomplete}
                value={(value as string) ?? ""}
                onChange={f.onChange}
                onBlur={f.onBlur}
                error={error}
                helpText={def.helpText}
                required={required}
              />
            );
          case "textarea":
            return (
              <Textarea
                label={def.label}
                name={f.name}
                rows={4}
                placeholder={def.placeholder}
                value={(value as string) ?? ""}
                onChange={f.onChange}
                onBlur={f.onBlur}
                error={error}
                helpText={def.helpText}
                required={required}
              />
            );
          case "select": {
            const options = def.options ?? [];
            if (options.length === 0) {
              // Free-text fallback: the official option list could not be
              // verified (see the field's officialNote TODO, kept as
              // provenance). A dropdown with zero options would make the
              // form impossible to complete.
              return (
                <Input
                  label={def.label}
                  name={f.name}
                  type="text"
                  placeholder={def.placeholder}
                  autoComplete={def.autocomplete}
                  value={(value as string) ?? ""}
                  onChange={f.onChange}
                  onBlur={f.onBlur}
                  error={error}
                  helpText={def.helpText}
                  required={required}
                />
              );
            }
            return (
              <Select
                label={def.label}
                name={f.name}
                options={options}
                placeholderOption="Select an option"
                value={(value as string) ?? ""}
                onChange={f.onChange}
                onBlur={f.onBlur}
                error={error}
                helpText={def.helpText}
                required={required}
              />
            );
          }
          case "radio":
            return (
              <fieldset aria-describedby={error ? `${f.name}-error` : undefined}>
                <legend className="mb-1.5 block text-sm font-medium text-navy">
                  {def.label}
                  {required && (
                    <span className="ml-1 text-red-600" aria-hidden="true">
                      *
                    </span>
                  )}
                </legend>
                {def.helpText && <p className="mb-2 text-xs text-slate-500">{def.helpText}</p>}
                <div className="space-y-2">
                  {(def.options ?? []).map((opt) => (
                    <label key={opt.value} className="flex items-center gap-3 text-sm text-slate-700">
                      <input
                        type="radio"
                        name={f.name}
                        value={opt.value}
                        checked={value === opt.value}
                        onChange={() => f.onChange(opt.value)}
                        onBlur={f.onBlur}
                        className="h-4 w-4 border-slate-300 text-forest-600 focus:ring-forest-500"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
                {error && (
                  <p id={`${f.name}-error`} role="alert" className="mt-1.5 text-sm font-medium text-red-600">
                    {error}
                  </p>
                )}
              </fieldset>
            );
          case "checkbox":
            return (
              <div>
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name={f.name}
                    checked={Boolean(value)}
                    onChange={(e) => f.onChange(e.target.checked)}
                    onBlur={f.onBlur}
                    aria-invalid={error ? true : undefined}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-forest-600 focus:ring-forest-500"
                  />
                  <span>
                    {def.label}
                    {required && (
                      <span className="ml-1 text-red-600" aria-hidden="true">
                        *
                      </span>
                    )}
                  </span>
                </label>
                {def.helpText && <p className="mt-1 pl-7 text-xs text-slate-500">{def.helpText}</p>}
                {error && (
                  <p role="alert" className="mt-1.5 pl-7 text-sm font-medium text-red-600">
                    {error}
                  </p>
                )}
              </div>
            );
          default:
            // Fallback: render as plain text for any unexpected type.
            return (
              <Input
                label={def.label}
                name={f.name}
                type="text"
                placeholder={def.placeholder}
                value={(value as string) ?? ""}
                onChange={f.onChange}
                onBlur={f.onBlur}
                error={error}
                helpText={def.helpText}
                required={required}
              />
            );
        }
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Main wizard                                                         */
/* ------------------------------------------------------------------ */

export function ApplicationForm({ config }: { config: StateConfig }) {
  const schema = useMemo(() => buildSubmissionSchema(config), [config]);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    getValues,
    trigger,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<WizardValues>({
    resolver: zodResolver(schema) as unknown as Resolver<WizardValues>,
    mode: "onBlur",
    defaultValues: {
      stateSlug: config.slug,
      residency: "",
      licenseId: "",
      addOnIds: config.addOns.filter((a) => a.required && !a.appliesTo).map((a) => a.id),
      data: defaultData(config.formFields),
      consents: { accurateAndTerms: false },
      payment: { token: "" },
    },
  });

  const [step, setStep] = useState(0);
  // Sub-step within the applicant step (step 1). When the state's applicant
  // fields declare `section`s, the applicant step is paged one section at a
  // time; this is the index into `applicantSections`. States without sections
  // keep a single applicant page and never advance this past 0.
  const [applicantSubStep, setApplicantSubStep] = useState(0);
  // UI-only toggle: reveal the optional mailing-address fields. Kept out of
  // form `data` so it never appears in the review, emails, or the submission —
  // it only drives visibility of the mail* fields (which are conditional on it).
  const [mailingDifferent, setMailingDifferent] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [conversionValue, setConversionValue] = useState(1);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Set when a charge is declined: retrying re-submits against the SAME
  // application row server-side (no duplicate applications, one dunning trail).
  const applicationIdRef = useRef<string | null>(null);
  // Ensures checkout-started emails fire once per wizard session.
  const checkoutStartedSentRef = useRef(false);

  /* ------------------------- draft persistence ------------------------- */
  // Keep the in-progress application alive across page reloads so a refresh
  // (or accidental navigation) never wipes what the user typed. Stored per
  // state in sessionStorage — it survives reloads within the tab but is not
  // kept long-term (card details are never stored; PII is cleared on success
  // or when the tab closes).
  const draftKey = `anglerpermit:draft:${config.slug}`;
  // State (not a ref) so the save effects stay fully disabled until the
  // restore has been COMMITTED — otherwise the mount-time save would clobber
  // the saved step with the initial 0 (and StrictMode's double-mount would
  // then re-read that clobbered value).
  const [hydrated, setHydrated] = useState(false);
  // Latest wizard position, read by persistDraft without re-subscribing watch.
  const stepRef = useRef(step);
  stepRef.current = step;
  const subStepRef = useRef(applicantSubStep);
  subStepRef.current = applicantSubStep;
  const mailingDiffRef = useRef(mailingDifferent);
  mailingDiffRef.current = mailingDifferent;

  const persistDraft = useCallback(() => {
    if (!hydrated) return;
    try {
      const v = getValues();
      sessionStorage.setItem(
        draftKey,
        JSON.stringify({
          version: 1,
          // Never auto-restore onto the payment/success screens: the furthest
          // we resume is Review, where the user re-confirms and pays again.
          step: Math.min(stepRef.current, 2),
          applicantSubStep: subStepRef.current,
          mailingDifferent: mailingDiffRef.current,
          // Card details (payment) and the accuracy/consent checkbox are
          // intentionally NOT persisted.
          values: {
            residency: v.residency,
            licenseId: v.licenseId,
            addOnIds: v.addOnIds,
            data: v.data,
          },
        }),
      );
    } catch {
      // Storage may be unavailable (private mode / quota) — never block typing.
    }
  }, [draftKey, getValues, hydrated]);

  const clearDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(draftKey);
    } catch {
      /* ignore */
    }
  }, [draftKey]);

  // Restore a saved draft once, on mount.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (raw) {
        const saved = JSON.parse(raw) as {
          step?: number;
          applicantSubStep?: number;
          mailingDifferent?: boolean;
          values?: {
            residency?: string;
            licenseId?: string;
            addOnIds?: string[];
            data?: Record<string, unknown>;
          };
        } | null;
        if (saved?.values) {
          reset({
            stateSlug: config.slug,
            residency: saved.values.residency ?? "",
            licenseId: saved.values.licenseId ?? "",
            addOnIds:
              saved.values.addOnIds ??
              config.addOns.filter((a) => a.required && !a.appliesTo).map((a) => a.id),
            data: mergeApplicantData(config.formFields, saved.values.data),
            consents: { accurateAndTerms: false },
            payment: { token: "" },
          });
          if (typeof saved.mailingDifferent === "boolean") setMailingDifferent(saved.mailingDifferent);
          if (typeof saved.applicantSubStep === "number") setApplicantSubStep(saved.applicantSubStep);
          if (typeof saved.step === "number") setStep(Math.max(0, Math.min(saved.step, 2)));
        }
      }
    } catch {
      // Corrupt/unavailable storage → just start with a blank form.
    }
    // Batched with the setStep/reset above, so the first render where saving
    // is enabled already has the restored step/data.
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save on every field change …
  useEffect(() => {
    const sub = watch(() => persistDraft());
    return () => sub.unsubscribe();
  }, [watch, persistDraft]);

  // … and whenever the wizard position changes.
  useEffect(() => {
    persistDraft();
  }, [step, applicantSubStep, mailingDifferent, persistDraft]);

  const residency = watch("residency");
  const licenseId = watch("licenseId");
  const addOnIds = watch("addOnIds");
  const watchedData = watch("data");

  // Running total shown in the sticky command bar + mobile action bar so the
  // price never scrolls out of view. Zero until a license is chosen.
  const orderTotal = computeOrderTotal(config, licenseId, addOnIds);

  // Conditional fields may reference another applicant field OR wizard-level
  // licenseId / residency (e.g. MI daily start date, SC hunter-ed, FL DL).
  const fieldContext = { ...watchedData, licenseId, residency, mailingDifferent };
  const visibleFields = config.formFields.filter(
    (f) => !f.hidden && isFieldVisible(f, fieldContext),
  );

  // Optional mailing-address support. Opt-in per state: a state enables the
  // built-in toggle by making its mailing fields conditional on the synthetic
  // "mailingDifferent" control (see Michigan). States that keep their own
  // mailing UX (e.g. TX "Same as Residence") are left untouched even after
  // they gain sections, since none of their fields reference mailingDifferent.
  const mailingFields = config.formFields.filter(
    (f) => f.conditional?.field === "mailingDifferent",
  );
  const hasMailingFields = mailingFields.length > 0;
  const residenceSection = hasMailingFields
    ? (config.formFields.find((f) => /^res[A-Z]/.test(f.name))?.section ?? null)
    : null;

  // Group the applicant step into sub-steps by the field `section` label (in
  // first-seen order). Only currently-visible fields count, so a section whose
  // fields are all conditionally hidden never becomes an empty sub-step.
  // States whose fields declare no section produce an empty list → the
  // applicant step renders as a single page (legacy behavior).
  const applicantSections: string[] = [];
  for (const f of visibleFields) {
    if (f.section && !applicantSections.includes(f.section)) {
      applicantSections.push(f.section);
    }
  }
  const hasSections = applicantSections.length > 0;
  const lastSubStep = Math.max(0, applicantSections.length - 1);
  const clampedSubStep = Math.min(applicantSubStep, lastSubStep);
  const currentSection = hasSections ? applicantSections[clampedSubStep] : null;
  const currentSectionFields = hasSections
    ? visibleFields.filter((f) => f.section === currentSection)
    : visibleFields;
  // Show the "different mailing address" toggle at the bottom of the residence
  // sub-step only.
  const showMailingToggle =
    hasSections &&
    hasMailingFields &&
    currentSection != null &&
    currentSection === residenceSection;

  // Focus the step heading whenever the step (or applicant sub-step) changes
  // and bring it into view (a11y + so each short sub-step starts at the top).
  useEffect(() => {
    headingRef.current?.focus();
    headingRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [step, applicantSubStep]);

  // Focused checkout: once the user is past license selection (wizard step 2+,
  // i.e. step index >= 1), hide the global site footer via a body class
  // (CSS: body.wizard-active footer[data-site-footer] { display: none })
  // until payment completes — the success screen (step 4) shows the footer
  // again. Restored on step-1 return, unmount, and route change. Purely
  // visual display:none — no scroll or layout-side effects, and
  // keyboard/screen-reader flow is unaffected.
  useEffect(() => {
    const active = step >= 1 && step < 4;
    document.body.classList.toggle("wizard-active", active);
    return () => document.body.classList.remove("wizard-active");
  }, [step]);

  /* ------------------------- selection handlers ------------------------- */

  function handleResidencyChange(value: string) {
    setValue("residency", value, { shouldValidate: true });
    const stillVisible = licensesForResidency(config, value).some((l) => l.id === getValues("licenseId"));
    if (!stillVisible) setValue("licenseId", "");
    syncRequiredAddOns(getValues("licenseId"));
    syncResidencyField(value);
  }

  /**
   * Default the Step 2 residency applicant field from the Step 1 selection
   * (the applicant can still change it). Handles exact-value fields (CA/CO/
   * FL/NC "residency", CO "residencyDeclaration") and Yes/No declarations
   * (TX "texasResident", MI "michiganResident"); states without such a
   * field (SC) are skipped.
   */
  function syncResidencyField(wizardResidency: string) {
    const field = config.formFields.find(
      (f) =>
        /residen/i.test(f.name) &&
        (f.type === "select" || f.type === "radio") &&
        (f.options?.length ?? 0) > 0,
    );
    if (!field?.options) return;
    const path = `data.${field.name}` as Path<WizardValues>;
    // Exact-value fields: wizard values are a subset of the field options
    // (resident / nonresident / NC student & military aliases).
    if (field.options.some((o) => o.value === wizardResidency)) {
      setValue(path, wizardResidency);
      return;
    }
    // Yes/No declarations: resident-priced tiers map to "yes" (e.g. TX
    // senior/youth are residents); option casing varies ("yes" vs "Yes").
    const target = residencyPricingTier(wizardResidency) === "resident" ? "yes" : "no";
    const match = field.options.find((o) => o.value.toLowerCase() === target);
    if (match) setValue(path, match.value);
  }

  function handleLicenseChange(id: string) {
    setValue("licenseId", id, { shouldValidate: true });
    syncRequiredAddOns(id);
  }

  /** Ensure required add-ons for the license are selected; drop selections that no longer apply. */
  function syncRequiredAddOns(forLicenseId: string) {
    const applicable = addOnsForLicense(config, forLicenseId || undefined);
    const requiredIds = applicable.filter((a) => a.required).map((a) => a.id);
    const kept = getValues("addOnIds").filter((id) => applicable.some((a) => a.id === id));
    setValue("addOnIds", Array.from(new Set([...kept, ...requiredIds])));
  }

  function handleAddOnToggle(id: string, checked: boolean) {
    const current = getValues("addOnIds");
    setValue(
      "addOnIds",
      checked ? [...current, id] : current.filter((x) => x !== id),
    );
  }

  /**
   * Toggle the optional mailing-address fields. Unchecking clears any values
   * already typed so stale mailing data is never submitted (the residence
   * address is used for mail).
   */
  function handleMailingToggle(checked: boolean) {
    setMailingDifferent(checked);
    if (!checked) {
      for (const f of mailingFields) {
        setValue(`data.${f.name}` as Path<WizardValues>, f.type === "checkbox" ? false : "");
        clearErrors(`data.${f.name}` as Path<WizardValues>);
      }
    }
  }

  /* ------------------------- navigation ------------------------- */

  async function goNext() {
    let ok = true;
    if (step === 0) {
      ok = await trigger(["residency", "licenseId"]);
    } else if (step === 1) {
      // Validate the applicant fields WITH wizard-level context (licenseId +
      // residency) so conditional required fields (FL resident DL, SC hunter-ed,
      // MI/TX/etc. license start date) enforce here — at step 1, before payment
      // and consents exist. We deliberately do NOT rely on the full submission
      // schema's superRefine: Zod skips object-level refinements when the base
      // parse fails, and at this step payment.token / consents are still empty,
      // which would otherwise abort the parse and silently skip the conditional
      // (licenseId-keyed) field checks.
      const values = getValues();
      const applicantContext: Record<string, unknown> = {
        ...(values.data as Record<string, unknown>),
        licenseId: values.licenseId,
        residency: values.residency,
        mailingDifferent,
      };
      // When the applicant step is paged into sections, validate only the
      // fields on the current sub-step; earlier sections were validated when
      // the user advanced past them.
      const fieldsToValidate = hasSections ? currentSectionFields : config.formFields;
      let hasDataError = false;
      for (const field of fieldsToValidate) {
        clearErrors(`data.${field.name}` as Path<WizardValues>);
        if (!isFieldVisible(field, applicantContext)) continue;
        const required = isFieldEffectivelyRequired(config, field, applicantContext);
        const result = buildFieldSchema({ ...field, required }).safeParse(
          (values.data as Record<string, unknown>)[field.name],
        );
        if (!result.success) {
          hasDataError = true;
          setError(`data.${field.name}` as Path<WizardValues>, {
            type: "validate",
            message: result.error.issues[0]?.message ?? `${field.label} is invalid`,
          });
        }
      }
      ok = !hasDataError;
      // More applicant sections remain → advance the sub-step, stay on step 1.
      if (ok && hasSections && clampedSubStep < lastSubStep) {
        setApplicantSubStep(clampedSubStep + 1);
        return;
      }
    } else if (step === 2) {
      ok = await trigger("consents.accurateAndTerms");
    }
    if (ok) {
      // Leaving review → payment: notify customer + admin (full applicant data).
      if (step === 2 && !checkoutStartedSentRef.current) {
        checkoutStartedSentRef.current = true;
        const values = getValues();
        void fetch("/api/applications/checkout-started", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stateSlug: values.stateSlug,
            residency: values.residency,
            licenseId: values.licenseId,
            addOnIds: values.addOnIds,
            data: values.data,
            consents: values.consents,
          }),
        })
          .then(async (res) => {
            const json = (await res.json().catch(() => null)) as {
              applicationId?: string | null;
            } | null;
            if (json?.applicationId) applicationIdRef.current = json.applicationId;
          })
          .catch(() => {
            // Email/persist must never block the payment step.
            checkoutStartedSentRef.current = false;
          });
      }
      // Entering the applicant step from license selection always starts at
      // the first sub-step.
      if (step === 0) setApplicantSubStep(0);
      setStep((s) => s + 1);
    } else {
      // Move keyboard/screen-reader users to the first invalid field.
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }

  /**
   * Enter anywhere in the form advances to the next step instead of triggering
   * a native form submit (there is no submit button; the only native-submit
   * path was a stray Enter keypress, which previously fired the full-schema
   * submit prematurely). Textareas keep newline behavior; buttons and links
   * keep their own activation; the payment step manages its own inputs.
   */
  function handleFormKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key !== "Enter" || e.shiftKey) return;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "TEXTAREA" || tag === "BUTTON" || tag === "A") return;
    e.preventDefault();
    if (step <= 2 && !isSubmitting) void goNext();
  }

  function goBack() {
    // Within the paged applicant step, Back walks to the previous sub-step
    // before leaving to license selection.
    if (step === 1 && hasSections && clampedSubStep > 0) {
      setApplicantSubStep(clampedSubStep - 1);
      return;
    }
    // Returning from Review lands on the LAST applicant sub-step so the user
    // continues where they left off.
    if (step === 2) {
      setApplicantSubStep(lastSubStep);
      setStep(1);
      return;
    }
    setStep((s) => Math.max(0, s - 1));
  }

  /* ------------------------- payment + submission ------------------------- */

  const promoCodeRef = useRef<string | null>(null);

  const submitApplication = handleSubmit(async (values) => {
    setSubmitError(null);
    setPaymentError(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          ...(applicationIdRef.current ? { applicationId: applicationIdRef.current } : {}),
          ...(promoCodeRef.current ? { promoCode: promoCodeRef.current } : {}),
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        reference?: string;
        applicationId?: string | null;
        confirmationEmailedTo?: string | null;
        amount?: number;
        message?: string;
        errors?: Record<string, string[]>;
      };

      if (res.ok && json.ok && json.reference) {
        applicationIdRef.current = null;
        // Application is complete — drop the saved draft so a later visit
        // starts fresh instead of resuming a finished order.
        clearDraft();
        setConversionValue(
          typeof json.amount === "number" && json.amount > 0 ? json.amount : orderTotal,
        );
        setReference(json.reference);
        setConfirmationEmail(json.confirmationEmailedTo ?? null);
        setStep(4);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // Payment declined (402) or a payment-specific failure: stay on the
      // payment step with a friendly message; the card was not charged.
      if (res.status === 402) {
        if (json.applicationId) applicationIdRef.current = json.applicationId;
        setPaymentError(
          json.message ?? "Your payment could not be completed. Please try a different card.",
        );
        setStep(3);
        return;
      }

      const serverErrors = json.errors ?? {};
      let firstStep = 3;
      for (const [path, messages] of Object.entries(serverErrors)) {
        setError(path as Path<WizardValues>, {
          type: "server",
          message: messages[0] ?? "Invalid value",
        });
        if (path.startsWith("data.")) firstStep = Math.min(firstStep, 1);
        if (path.startsWith("consents")) firstStep = Math.min(firstStep, 2);
        if (path.startsWith("payment")) firstStep = 3;
        if (path === "residency" || path === "licenseId" || path === "addOnIds") firstStep = 0;
      }
      if (Object.keys(serverErrors).length > 0) {
        // A rejected applicant field could sit in any section — start the
        // paged applicant step at the first sub-step so the user pages through.
        if (firstStep === 1) setApplicantSubStep(0);
        setStep(firstStep);
        setSubmitError("Please correct the highlighted fields and resubmit your application.");
      } else {
        setSubmitError(json.message ?? "Something went wrong while submitting. Please try again.");
      }
    } catch {
      setSubmitError("We could not reach the server. Check your connection and try again.");
    }
  });

  /** PaymentStep hands us a tokenized card (never raw card data). */
  function handleTokenized(payment: TokenizedPayment, promoCode?: string | null) {
    promoCodeRef.current = promoCode ?? null;
    setValue("payment", payment, { shouldValidate: true });
    // Tokens are single-use; submit immediately with this token.
    void submitApplication();
  }

  /* ------------------------- success screen ------------------------- */

  if (step === 4 && reference) {
    return (
      <Card className="mx-auto max-w-2xl">
        <PurchaseConversionBeacon transactionId={reference} value={conversionValue} />
        <div className="px-6 py-10 text-center sm:px-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest-50">
            <Check className="h-8 w-8 text-forest-600" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-2xl font-bold text-navy">Application received</h2>
          <p className="mt-2 text-slate-600">
            Thank you — your {config.stateName} fishing license application and payment
            have been received.
          </p>
          <div className="mt-6 rounded-xl border border-navy-100 bg-navy-50 px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Your reference number
            </p>
            <p className="mt-1 font-mono text-xl font-bold text-navy">{reference}</p>
            <p className="mt-1 text-xs text-slate-500">
              Save this number — you will need it if you contact us about your application.
            </p>
          </div>
          {confirmationEmail && (
            <p className="mt-4 text-sm text-slate-600">
              A confirmation email with your receipt is on its way to{" "}
              <span className="font-semibold text-navy">{confirmationEmail}</span>.
              {" "}If you don&rsquo;t see it within a few minutes, check your spam folder.
            </p>
          )}

          <h3 className="mt-8 text-left text-base font-semibold text-navy">What happens next</h3>
          <ol className="mt-4 space-y-4 text-left">
            {[
              {
                icon: ClipboardCheck,
                title: "Review",
                body: "A specialist reviews your application for errors (usually within 1 business day).",
              },
              {
                icon: CreditCard,
                title: "Fulfillment",
                body: "Your license is issued, and your card receipt shows \u201cANGLER PERMIT\u201d.",
              },
              {
                icon: Mail,
                title: "Delivery",
                body: "Your license and receipt are emailed to you.",
              },
            ].map((item, i) => (
              <li key={item.title} className="flex gap-4">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-navy text-white">
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-navy">
                    {i + 1}. {item.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-600">{item.body}</span>
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Start another application
            </Button>
            <Link href="/" className="inline-flex">
              <Button variant="ghost" className="w-full">Return home</Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  /* ------------------------- wizard ------------------------- */

  const consentError = (errors.consents as { accurateAndTerms?: { message?: string } } | undefined)
    ?.accurateAndTerms?.message;

  return (
    <form
      onSubmit={submitApplication}
      onKeyDown={handleFormKeyDown}
      noValidate
      className="mx-auto max-w-3xl pb-24 sm:pb-0"
      aria-label={`${config.stateName} fishing license application`}
    >
      {/* Sticky command bar — progress + running total + secure badge stay
          visible under the site header so price and progress never scroll away. */}
      <div className="sticky top-16 z-20 -mx-4 mb-8 border-b border-slate-200 bg-slate-50/85 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-slate-50/70 sm:-mx-6 sm:px-6 md:top-[72px]">
        <div className="flex items-center justify-between gap-4">
          <nav aria-label="Application progress" className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-navy sm:hidden">
              Step {step + 1} of {STEP_TITLES.length}
              <span className="font-medium text-slate-500"> · {STEP_TITLES[step]}</span>
            </p>
            <ol className="hidden items-center gap-2 sm:flex">
              {STEP_TITLES.map((title, i) => {
                const state = i < step ? "complete" : i === step ? "current" : "upcoming";
                return (
                  <li key={title} className="flex flex-1 items-center gap-2.5">
                    <span
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors duration-300 ${
                        state === "complete"
                          ? "border-forest-600 bg-forest-600 text-white"
                          : state === "current"
                            ? "border-navy bg-navy text-white"
                            : "border-slate-300 bg-white text-slate-400"
                      }`}
                      aria-hidden="true"
                    >
                      {state === "complete" ? (
                        <Check className="h-3.5 w-3.5 animate-pop" />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span
                      className={`hidden text-sm font-medium lg:inline ${state === "current" ? "text-navy" : "text-slate-500"}`}
                      aria-current={state === "current" ? "step" : undefined}
                    >
                      {title}
                    </span>
                    {i < STEP_TITLES.length - 1 && (
                      <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
          <div className="flex flex-shrink-0 items-center gap-2.5">
            {licenseId && (
              <span className="flex items-baseline gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-navy shadow-sm ring-1 ring-slate-200">
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
                  Total
                </span>
                {formatPrice(orderTotal)}
              </span>
            )}
            <span className="hidden items-center gap-1.5 rounded-full bg-forest-50 px-3 py-1.5 text-xs font-semibold text-forest-700 sm:flex">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Secure
            </span>
          </div>
        </div>
        {/* Slim animated progress line on mobile */}
        <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-slate-200 sm:hidden">
          <div
            className="h-full rounded-full bg-forest-500 transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / STEP_TITLES.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Keyed so each step / applicant sub-step animates in. */}
      <div key={`${step}-${clampedSubStep}`} className="animate-step-in">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="scroll-mt-36 text-xl font-bold text-navy focus:outline-none sm:text-2xl"
        >
          {step === 0 && "Choose your license"}
          {step === 1 && "Tell us about the applicant"}
          {step === 2 && "Review your application"}
          {step === 3 && "Payment"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {step === 0 && "Select your residency status and license. One clear total before you pay — no hidden fees."}
          {step === 1 &&
            (hasSections
              ? `Step ${clampedSubStep + 1} of ${applicantSections.length}: ${currentSection}. These fields match the official ${config.officialPortalName} application — required fields are marked with an asterisk.`
              : `These fields match the official ${config.officialPortalName} application. Required fields are marked with an asterisk.`)}
          {step === 2 && "Check everything carefully — we use exactly this information to purchase your license."}
          {step === 3 && "Your card is charged once, securely. Card details never touch our servers."}
        </p>

        <div className="mt-6">
        {/* STEP 1 — license selection */}
        {step === 0 && (
          <div className="space-y-6">
            <LicenseSelector
              config={config}
              value={{ residency, licenseId, addOnIds }}
              errors={{ residency: errors.residency?.message, licenseId: errors.licenseId?.message }}
              onResidencyChange={handleResidencyChange}
              onLicenseChange={handleLicenseChange}
              onAddOnToggle={handleAddOnToggle}
            />
            <PriceSummary config={config} licenseId={licenseId} addOnIds={addOnIds} />
          </div>
        )}

        {/* STEP 2 — applicant details (paged into sections when defined) */}
        {step === 1 && (
          <div className="space-y-5">
            {hasSections && (
              <ol className="flex gap-2" aria-label="Applicant detail sections">
                {applicantSections.map((s, i) => {
                  const state =
                    i < clampedSubStep ? "complete" : i === clampedSubStep ? "current" : "upcoming";
                  return (
                    <li key={s} className="flex flex-1 flex-col gap-1.5">
                      <span
                        className={`h-1.5 rounded-full ${state === "upcoming" ? "bg-slate-200" : "bg-forest-500"}`}
                        aria-hidden="true"
                      />
                      <span
                        className={`text-xs font-medium ${state === "current" ? "text-navy" : "text-slate-400"}`}
                        aria-current={state === "current" ? "step" : undefined}
                      >
                        {s}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
            <Card>
              <div className="grid gap-5 px-6 py-6 sm:grid-cols-2">
                {currentSectionFields.map((def) => (
                  <div
                    key={def.name}
                    className={def.type === "textarea" || def.type === "checkbox" || def.type === "radio" || def.type === "ssn" ? "sm:col-span-2" : ""}
                  >
                    <FieldControl
                      def={def}
                      config={config}
                      control={control}
                      errors={dataErrorsOf(errors)}
                      required={isFieldEffectivelyRequired(config, def, fieldContext)}
                    />
                  </div>
                ))}
              </div>
              {showMailingToggle && (
                <div className="border-t border-slate-100 px-6 py-5">
                  <label className="flex items-start gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={mailingDifferent}
                      onChange={(e) => handleMailingToggle(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-forest-600 focus:ring-forest-500"
                    />
                    <span>
                      <span className="font-medium text-navy">
                        My mailing address is different from my residence
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        Leave unchecked to use your residence address for mail. Check this to add a
                        separate mailing address on the next step.
                      </span>
                    </span>
                  </label>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* STEP 3 — review + consents */}
        {step === 2 && (
          <div className="space-y-6">
            <Card>
              <div className="px-6 py-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-navy">License</h3>
                  <Button variant="ghost" size="sm" onClick={() => setStep(0)}>
                    Edit
                  </Button>
                </div>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Residency</dt>
                    <dd className="font-medium text-navy">
                      {config.residencyOptions.find((r) => r.value === residency)?.label ?? residency}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">License</dt>
                    <dd className="text-right font-medium text-navy">
                      {config.licenses.find((l) => l.id === licenseId)?.name ?? licenseId}
                    </dd>
                  </div>
                  {(() => {
                    const sku = config.licenses.find((l) => l.id === licenseId);
                    const range = formatLicenseDateRange(
                      watchedData.licenseStartDate,
                      sku?.duration,
                    );
                    return range ? (
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Valid</dt>
                        <dd className="text-right font-medium text-navy">{range}</dd>
                      </div>
                    ) : null;
                  })()}
                  {addOnIds.length > 0 && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Add-ons</dt>
                      <dd className="text-right font-medium text-navy">
                        {addOnIds
                          .map((id) => config.addOns.find((a) => a.id === id)?.name ?? id)
                          .join(", ")}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </Card>

            <Card>
              <div className="px-6 py-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-navy">Applicant details</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setApplicantSubStep(0);
                      setStep(1);
                    }}
                  >
                    Edit
                  </Button>
                </div>
                <dl className="mt-3 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                  {visibleFields
                    // Hide empty optional fields (e.g. an unused mailing
                    // address) so the review isn't cluttered with "—" rows.
                    .filter((def) => displayValue(def, watchedData[def.name]) !== "—")
                    .map((def) => (
                    <div key={def.name} className="flex justify-between gap-4 sm:block">
                      <dt className="text-slate-500">{def.label}</dt>
                      <dd className="text-right font-medium text-navy sm:mt-0.5 sm:text-left">
                        {displayValue(def, watchedData[def.name])}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Card>

            <PriceSummary config={config} licenseId={licenseId} addOnIds={addOnIds} />

            <Card>
              <fieldset className="px-6 py-5">
                <legend className="text-base font-semibold text-navy">
                  Confirm your information
                </legend>
                <div className="mt-4 space-y-4">
                  {/* Single merged consent (friction-reduced). The purchase
                      authorization moved to the Terms of Service + the
                      statement above the pay button on the payment step. */}
                  <div>
                    <Controller
                      name={"consents.accurateAndTerms" as Path<WizardValues>}
                      control={control}
                      render={({ field: f }) => (
                        <label className="flex items-start gap-3 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            name={f.name}
                            checked={Boolean(f.value)}
                            onChange={(e) => f.onChange(e.target.checked)}
                            onBlur={f.onBlur}
                            aria-invalid={consentError ? true : undefined}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-forest-600 focus:ring-forest-500"
                          />
                          <span>
                            I confirm my information is accurate and I agree to the{" "}
                            <Link href="/terms" target="_blank" className="font-medium text-forest-700 underline">
                              Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link href="/privacy" target="_blank" className="font-medium text-forest-700 underline">
                              Privacy Policy
                            </Link>
                            .
                          </span>
                        </label>
                      )}
                    />
                    {consentError && (
                      <p role="alert" className="mt-1 pl-7 text-sm font-medium text-red-600">
                        {consentError}
                      </p>
                    )}
                  </div>
                  {config.consentExtra && (
                    <p className="rounded-lg bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
                      {config.consentExtra}
                    </p>
                  )}
                </div>
              </fieldset>
            </Card>
          </div>
        )}

        {/* STEP 4 — payment (tokenized; card data never reaches our server) */}
        {step === 3 && (
          <PaymentStep
            total={computeOrderTotal(config, licenseId, addOnIds)}
            stateName={config.stateName}
            processing={isSubmitting}
            error={paymentError}
            onPay={handleTokenized}
          />
        )}
        </div>
      </div>

      {submitError && (
        <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" aria-hidden="true" />
          <p className="text-sm font-medium text-red-700">{submitError}</p>
        </div>
      )}

      {/* Nav buttons (payment step has its own Pay button inside PaymentStep).
          On mobile, Continue lives in the fixed action bar below. */}
      <div className="mt-8 flex items-center justify-between gap-4">
        {step > 0 ? (
          <Button variant="outline" onClick={goBack} disabled={isSubmitting}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Button>
        ) : (
          <span />
        )}
        {step < 2 && (
          <Button variant="primary" onClick={goNext} className="hidden sm:inline-flex">
            Continue
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
        {step === 2 && (
          <Button variant="primary" onClick={goNext} className="hidden sm:inline-flex">
            Continue to payment
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>

      {/* Trust + reassurance row. Reinforces security and legitimacy at the
          point of friction (we submit to the official portal — never claiming
          to BE the agency) and surfaces the silent autosave so users know they
          can step away and return without losing progress. */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-forest-600" aria-hidden="true" />
          256-bit SSL encrypted
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-forest-600" aria-hidden="true" />
          SSN masked to last 4
        </span>
        <span className="flex items-center gap-1.5">
          <FileCheck2 className="h-3.5 w-3.5 text-forest-600" aria-hidden="true" />
          Submitted to the official {config.officialPortalName}
        </span>
        {hydrated && step < 4 && (
          <span className="flex items-center gap-1.5 font-medium text-forest-700 animate-fade-in">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Progress saved automatically
          </span>
        )}
      </div>

      {/* Mobile action bar — keeps Continue + the running total one tap away so
          the CTA is never a scroll away on a phone. */}
      {step <= 2 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_-8px_rgba(10,37,64,0.25)] backdrop-blur sm:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 leading-tight">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
                {step === 2 ? "Total due today" : "Total"}
              </p>
              <p className="text-base font-bold text-navy">
                {licenseId ? formatPrice(orderTotal) : "—"}
              </p>
            </div>
            <Button variant="accent" size="lg" onClick={goNext} className="flex-1">
              {step === 2 ? "Continue to payment" : "Continue"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
