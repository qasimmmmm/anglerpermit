"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  Lock,
  Mail,
} from "lucide-react";
import type { FormFieldDef, StateConfig, TokenizedPayment } from "@/lib/state-config";
import {
  addOnsForLicense,
  buildSubmissionSchema,
  computeOrderTotal,
  digitsOnlyPatternCount,
  isFieldVisible,
  licensesForResidency,
  maskSSN,
  residencyPricingTier,
} from "@/lib/state-config";
import { applyMask } from "@/lib/masks";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { LicenseSelector } from "@/components/LicenseSelector";
import { PriceSummary } from "@/components/PriceSummary";
import { PaymentStep } from "@/components/PaymentStep";

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
    data[f.name] = f.type === "checkbox" ? false : "";
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
    default:
      return String(value);
  }
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
}: {
  def: FormFieldDef;
  config: StateConfig;
  control: ReturnType<typeof useForm<WizardValues>>["control"];
  errors: Record<string, { message?: string }>;
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
            return (
              <Input
                label={def.label}
                name={f.name}
                type={inputType}
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
                required={def.required}
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
                  required={def.required}
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
                required={def.required}
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
                required={def.required}
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
                  required={def.required}
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
                required={def.required}
              />
            );
          }
          case "radio":
            return (
              <fieldset aria-describedby={error ? `${f.name}-error` : undefined}>
                <legend className="mb-1.5 block text-sm font-medium text-navy">
                  {def.label}
                  {def.required && (
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
                    {def.required && (
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
                required={def.required}
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
    setValue,
    getValues,
    trigger,
    setError,
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
  const [reference, setReference] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Set when a charge is declined: retrying re-submits against the SAME
  // application row server-side (no duplicate applications, one dunning trail).
  const applicationIdRef = useRef<string | null>(null);

  const residency = watch("residency");
  const licenseId = watch("licenseId");
  const addOnIds = watch("addOnIds");
  const watchedData = watch("data");

  // Conditional fields may reference another applicant field OR the selected
  // license (conditional.field === "licenseId"), e.g. MI's daily-license start date.
  const visibleFields = config.formFields.filter((f) =>
    isFieldVisible(f, { ...watchedData, licenseId }),
  );

  // Focus the step heading whenever the step changes (a11y).
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  // Focused checkout: once the user is past license selection (wizard step 2+,
  // i.e. step index >= 1 — including payment and the success screen), hide the
  // global site footer via a body class (CSS: body.wizard-active
  // footer[data-site-footer] { display: none }). Restored on step-1 return,
  // unmount, and route change. Purely visual display:none — no scroll or
  // layout-side effects, and keyboard/screen-reader flow is unaffected.
  useEffect(() => {
    const active = step >= 1;
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

  /* ------------------------- navigation ------------------------- */

  async function goNext() {
    let ok = true;
    if (step === 0) {
      ok = await trigger(["residency", "licenseId"]);
    } else if (step === 1) {
      ok = await trigger(visibleFields.map((f) => `data.${f.name}` as Path<WizardValues>));
    } else if (step === 2) {
      ok = await trigger("consents.accurateAndTerms");
    }
    if (ok) {
      setStep((s) => s + 1);
    } else {
      // Move keyboard/screen-reader users to the first invalid field.
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  /* ------------------------- payment + submission ------------------------- */

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
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        reference?: string;
        applicationId?: string | null;
        confirmationEmailedTo?: string | null;
        message?: string;
        errors?: Record<string, string[]>;
      };

      if (res.ok && json.ok && json.reference) {
        applicationIdRef.current = null;
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
  function handleTokenized(payment: TokenizedPayment) {
    setValue("payment", payment, { shouldValidate: true });
    // Tokens are single-use; submit immediately with this token.
    void submitApplication();
  }

  /* ------------------------- success screen ------------------------- */

  if (step === 4 && reference) {
    return (
      <Card className="mx-auto max-w-2xl">
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
    <form onSubmit={submitApplication} noValidate className="mx-auto max-w-3xl" aria-label={`${config.stateName} fishing license application`}>
      {/* Progress indicator */}
      <nav aria-label="Application progress" className="mb-8">
        <p className="mb-2 text-sm font-medium text-slate-500 sm:hidden">
          Step {step + 1} of {STEP_TITLES.length}: {STEP_TITLES[step]}
        </p>
        <ol className="hidden gap-2 sm:flex">
          {STEP_TITLES.map((title, i) => {
            const state = i < step ? "complete" : i === step ? "current" : "upcoming";
            return (
              <li key={title} className="flex flex-1 items-center gap-3">
                <span
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                    state === "complete"
                      ? "border-forest-600 bg-forest-600 text-white"
                      : state === "current"
                        ? "border-navy bg-navy text-white"
                        : "border-slate-300 bg-white text-slate-400"
                  }`}
                  aria-hidden="true"
                >
                  {state === "complete" ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={`text-sm font-medium ${state === "current" ? "text-navy" : "text-slate-500"}`}
                  aria-current={state === "current" ? "step" : undefined}
                >
                  {title}
                </span>
                {i < STEP_TITLES.length - 1 && <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
      </nav>

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-xl font-bold text-navy focus:outline-none sm:text-2xl"
      >
        {step === 0 && "Choose your license"}
        {step === 1 && "Tell us about the applicant"}
        {step === 2 && "Review your application"}
        {step === 3 && "Payment"}
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        {step === 0 && "Select your residency status and license. One clear total before you pay — no hidden fees."}
        {step === 1 && `These fields match the official ${config.officialPortalName} application. Required fields are marked with an asterisk.`}
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

        {/* STEP 2 — applicant details */}
        {step === 1 && (
          <Card>
            <div className="grid gap-5 px-6 py-6 sm:grid-cols-2">
              {visibleFields.map((def) => (
                <div
                  key={def.name}
                  className={def.type === "textarea" || def.type === "checkbox" || def.type === "radio" || def.type === "ssn" ? "sm:col-span-2" : ""}
                >
                  <FieldControl
                    def={def}
                    config={config}
                    control={control}
                    errors={dataErrorsOf(errors)}
                  />
                </div>
              ))}
            </div>
          </Card>
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
                  <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                    Edit
                  </Button>
                </div>
                <dl className="mt-3 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                  {visibleFields.map((def) => (
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

      {submitError && (
        <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" aria-hidden="true" />
          <p className="text-sm font-medium text-red-700">{submitError}</p>
        </div>
      )}

      {/* Nav buttons (payment step has its own Pay button inside PaymentStep) */}
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
          <Button variant="primary" onClick={goNext}>
            Continue
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
        {step === 2 && (
          <Button variant="primary" onClick={goNext}>
            Continue to payment
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>

      <p className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
        Submitted over an encrypted connection. Sensitive identifiers are masked in all notifications.
      </p>
    </form>
  );
}
