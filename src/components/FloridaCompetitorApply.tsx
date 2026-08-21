"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { LicenseOption, StateConfig, TokenizedPayment } from "@/lib/state-config";
import {
  computeOrderTotal,
  displayPrice,
  residencyPricingTier,
} from "@/lib/state-config";
import { US_STATE_OPTIONS } from "@/lib/us-states";
import { formatPrice } from "@/lib/format";
import { PaymentStep } from "@/components/PaymentStep";
import { PurchaseConversionBeacon } from "@/components/PurchaseConversionBeacon";
import { useLocale } from "@/i18n/LocaleProvider";
import { DlUploadFields } from "@/components/DlUploadFields";
import { EMPTY_DL_UPLOAD, mergeDlUploads } from "@/lib/dl-upload";

/** Competitor DL-state option order: Florida pinned first, DC last. */
const FL_STATE_OPTIONS = [
  ...US_STATE_OPTIONS.filter((s) => s.value === "FL"),
  ...US_STATE_OPTIONS.filter((s) => s.value !== "FL" && s.value !== "DC"),
  ...US_STATE_OPTIONS.filter((s) => s.value === "DC"),
];

/** Competitor-visible resident SKUs (order matches usafishingassitant.com). */
const RESIDENT_LICENSE_IDS = [
  "saltwater-fishing-1-year-resident",
  "saltwater-fishing-5-year-resident",
  "lifetime-saltwater-fishing-resident",
  "freshwater-fishing-1-year-resident",
  "freshwater-fishing-5-year-resident",
  "lifetime-freshwater-fishing-resident",
  "freshwater-saltwater-fishing-combo-1-year-resident",
  "freshwater-saltwater-hunting-combo-1-year-resident",
  "gold-sportsman-1-year-resident",
  "gold-sportsman-5-year-resident",
  "lifetime-sportsman-resident",
] as const;

/** Competitor-visible nonresident / international SKUs. */
const NONRESIDENT_LICENSE_IDS = [
  "saltwater-fishing-annual-nonresident",
  "freshwater-fishing-annual-nonresident",
] as const;

const LICENSE_LABELS: Record<string, string> = {
  "saltwater-fishing-1-year-resident": "Saltwater Fishing License - 1 Year",
  "saltwater-fishing-5-year-resident": "Saltwater Fishing License - 5 Years",
  "lifetime-saltwater-fishing-resident":
    "Saltwater Fishing License - Lifetime (13-64 yrs only)",
  "freshwater-fishing-1-year-resident": "Freshwater Fishing License - 1 Year",
  "freshwater-fishing-5-year-resident": "Freshwater Fishing License - 5 Years",
  "lifetime-freshwater-fishing-resident":
    "Freshwater Fishing License - Lifetime (13-64 yrs only)",
  "freshwater-saltwater-fishing-combo-1-year-resident":
    "Annual Saltwater & Freshwater Fishing Combination",
  "freshwater-saltwater-hunting-combo-1-year-resident": "Annual Sportsman's License",
  "gold-sportsman-1-year-resident": "Annual Gold Sportsman's License",
  "gold-sportsman-5-year-resident": "5-Year Gold Sportsman's License",
  "lifetime-sportsman-resident": "Sportsman's Lifetime License (13-64 yrs only)",
  "saltwater-fishing-annual-nonresident":
    "Saltwater Fishing (incl. Snook & Lobster Permit) - 1 Year",
  "freshwater-fishing-annual-nonresident": "Freshwater Fishing License - 1 Year",
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const ETHNICITY = [
  { value: "asian", label: "Asian" },
  { value: "black", label: "Black" },
  { value: "hispanic", label: "Hispanic" },
  { value: "native-american", label: "Native American" },
  { value: "white", label: "White" },
  { value: "other", label: "Other" },
];

type IntlIdType = "passport" | "visa" | "green-card" | "non-us-drivers-license";
type Step = 0 | 1 | 2;

type FormState = {
  residency: string;
  dlIssuingState: string;
  documentNumber: string;
  expMonth: string;
  expDay: string;
  expYear: string;
  ssn: string;
  noSsn: boolean;
  intlIdType: IntlIdType | "";
  firstName: string;
  middleName: string;
  lastName: string;
  dlFrontName: string;
  dlFrontData: string;
  dlBackName: string;
  dlBackData: string;
  licenseId: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  email: string;
  phone: string;
  gender: string;
  ethnicity: string;
  heightFt: string;
  heightIn: string;
  consent: boolean;
};

const INITIAL: FormState = {
  residency: "",
  dlIssuingState: "FL",
  documentNumber: "",
  expMonth: "",
  expDay: "",
  expYear: "",
  ssn: "",
  noSsn: false,
  intlIdType: "",
  firstName: "",
  middleName: "",
  lastName: "",
  ...EMPTY_DL_UPLOAD,
  licenseId: "",
  dobDay: "",
  dobMonth: "",
  dobYear: "",
  street: "",
  city: "",
  state: "FL",
  zip: "",
  email: "",
  phone: "",
  gender: "",
  ethnicity: "",
  heightFt: "",
  heightIn: "",
  consent: false,
};

const inputClass =
  "form-input w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-navy focus:ring-1 focus:ring-navy";

function pad2(n: string | number) {
  return String(n).padStart(2, "0");
}

function monthIndex(name: string): number {
  return MONTHS.indexOf(name) + 1;
}

function digitsOnly(s: string) {
  return s.replace(/\D/g, "");
}

function formatPhone(raw: string): string {
  const d = digitsOnly(raw).slice(0, 10);
  if (d.length !== 10) return raw;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function formatSsnDisplay(raw: string): string {
  const d = digitsOnly(raw).slice(0, 9);
  if (d.length <= 3) return d;
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}

function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full min-w-0 rounded border-2 px-3 py-3 text-center text-sm font-semibold transition-colors",
        selected
          ? "border-navy bg-navy/10 text-navy"
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  required,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-8 border-t border-slate-100 pt-6 text-base font-bold uppercase tracking-wide text-slate-800">
      {children}
    </h2>
  );
}

function licenseLabel(lic: LicenseOption): string {
  return LICENSE_LABELS[lic.id] ?? lic.name;
}

export function FloridaCompetitorApply({ config }: { config: StateConfig }) {
  const { t } = useLocale();
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<string[]>([]);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  // Focused checkout: past license selection (step >= 1) hide the global site
  // footer via a body class (CSS: body.wizard-active footer[data-site-footer]
  // { display: none }) until payment completes — the success screen shows the
  // footer again. Restored on unmount and on returning to step 0. Purely
  // visual display:none — no scroll or layout side effects.
  useEffect(() => {
    const active = step >= 1 && !reference;
    document.body.classList.toggle("wizard-active", active);
    return () => document.body.classList.remove("wizard-active");
  }, [step, reference]);
  const [conversionValue, setConversionValue] = useState(1);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [showConsentTerms, setShowConsentTerms] = useState(false);
  const applicationIdRef = useRef<string | null>(null);
  const promoCodeRef = useRef<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const pricingTier = form.residency
    ? residencyPricingTier(form.residency)
    : null;

  const licenses = useMemo(() => {
    if (!form.residency) return [] as LicenseOption[];
    const ids =
      pricingTier === "nonresident" ? NONRESIDENT_LICENSE_IDS : RESIDENT_LICENSE_IDS;
    return ids
      .map((id) => config.licenses.find((l) => l.id === id))
      .filter((l): l is LicenseOption => Boolean(l));
  }, [config.licenses, form.residency, pricingTier]);

  const selectedLicense = config.licenses.find((l) => l.id === form.licenseId);
  const total = form.licenseId ? computeOrderTotal(config, form.licenseId, []) : 0;

  function selectResidency(value: string) {
    setForm((f) => ({
      ...f,
      residency: value,
      licenseId: "",
      dlIssuingState: value === "resident" ? "FL" : f.dlIssuingState === "FL" && value !== "resident" ? "" : f.dlIssuingState || "",
      noSsn: false,
      intlIdType: value === "international" ? f.intlIdType || "" : "",
      documentNumber: value === "international" ? f.documentNumber : f.documentNumber,
      expMonth: value === "resident" ? f.expMonth : "",
      expDay: value === "resident" ? f.expDay : "",
      expYear: value === "resident" ? f.expYear : "",
      state: value === "resident" ? "FL" : f.state || "FL",
    }));
    setErrors([]);
  }

  function onDlStateChange(stateCode: string) {
    if (form.residency === "resident" && stateCode && stateCode !== "FL") {
      // Competitor: non-FL DL redirects to U.S. Citizen flow.
      setForm((f) => ({
        ...f,
        residency: "us-citizen",
        dlIssuingState: stateCode,
        licenseId: "",
        expMonth: "",
        expDay: "",
        expYear: "",
      }));
      setErrors([]);
      return;
    }
    set("dlIssuingState", stateCode);
  }

  function onNoSsnChange(checked: boolean) {
    if (checked) {
      setForm((f) => ({
        ...f,
        noSsn: true,
        ssn: "",
        residency: "international",
        licenseId: "",
        intlIdType: "",
        documentNumber: "",
      }));
      setErrors([]);
      return;
    }
    set("noSsn", false);
  }

  function validateStep0(): string[] {
    const e: string[] = [];
    if (!form.residency) e.push("Select your primary residence type.");

    if (form.residency === "resident") {
      if (!form.dlIssuingState) e.push("Select the driver's license issuing state.");
      if (!form.documentNumber.trim()) e.push("Enter your Florida driver's license number.");
      if (!form.expMonth || !form.expDay || !form.expYear) {
        e.push("Enter your driver's license expiration date.");
      }
      if (digitsOnly(form.ssn).length !== 9) e.push("Enter a valid Social Security number.");
      if (!form.firstName.trim()) e.push("First name is required.");
      if (!form.lastName.trim()) e.push("Last name is required.");
    }

    if (form.residency === "us-citizen") {
      if (digitsOnly(form.ssn).length !== 9) e.push("Enter a valid Social Security number.");
      if (!form.dlIssuingState) e.push("Select the driver's license issuing state.");
      if (!form.documentNumber.trim()) e.push("Enter your U.S. driver's license number.");
      if (!form.firstName.trim()) e.push("First name is required.");
      if (!form.lastName.trim()) e.push("Last name is required.");
    }

    if (form.residency === "international") {
      if (!form.intlIdType) e.push("Select an identification type.");
      if (!form.documentNumber.trim()) e.push("Enter your identification number.");
    }

    if (!form.licenseId) e.push("Select a license.");
    return e;
  }

  function validateStep1(): string[] {
    const e: string[] = [];
    if (!form.firstName.trim()) e.push("First name is required.");
    if (!form.lastName.trim()) e.push("Last name is required.");
    if (!form.dobDay || !form.dobMonth || !form.dobYear) e.push("Date of birth is required.");
    if (!form.street.trim()) e.push("Street address is required.");
    if (!form.city.trim()) e.push("City is required.");
    if (!form.state) e.push("State is required.");
    if (!/^\d{5}(-\d{4})?$/.test(form.zip.trim())) e.push("Enter a valid ZIP code.");
    if (!form.email.trim() || !form.email.includes("@")) e.push("Email address is required.");
    if (digitsOnly(form.phone).length !== 10) e.push("Enter a valid 10-digit phone number.");
    if (!form.gender) e.push("Gender is required.");
    if (!form.ethnicity) e.push("Ethnicity is required.");
    if (!form.heightFt || form.heightIn === "") e.push("Height is required.");
    if (!form.consent) e.push("Please confirm your information and agree to the terms.");
    return e;
  }

  function buildPayload(payment: TokenizedPayment) {
    const dob = `${pad2(monthIndex(form.dobMonth))}/${pad2(form.dobDay)}/${form.dobYear}`;
    const data: Record<string, string | boolean | number> = {
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim(),
      lastName: form.lastName.trim(),
      birthDate: dob,
      street: form.street.trim(),
      city: form.city.trim(),
      state: form.state,
      zipCode: form.zip.trim(),
      email: form.email.trim(),
      primaryPhone: formatPhone(form.phone),
      primaryPhoneType: "mobile",
      gender: form.gender,
      ethnicity: form.ethnicity,
      heightFt: form.heightFt,
      heightIn: form.heightIn,
      residency: form.residency,
      nonUsAddress: "no",
      customerType: form.residency === "international" ? "international" : "us",
    };

    if (form.residency === "resident" || form.residency === "us-citizen") {
      data.documentType = "us-drivers-license";
      data.documentNumber = form.documentNumber.trim();
      data.dlIssuingState = form.dlIssuingState;
      data.ssn = digitsOnly(form.ssn);
      if (form.residency === "resident" && form.expMonth && form.expDay && form.expYear) {
        data.dlExpirationDate = `${pad2(monthIndex(form.expMonth))}/${pad2(form.expDay)}/${form.expYear}`;
      }
    }

    if (form.residency === "international") {
      data.documentType = form.intlIdType;
      data.documentNumber = form.documentNumber.trim();
    }

    mergeDlUploads(data, form);

    return {
      stateSlug: config.slug,
      residency: form.residency,
      licenseId: form.licenseId,
      addOnIds: [] as string[],
      data,
      consents: { accurateAndTerms: true as const },
      payment,
      ...(applicationIdRef.current ? { applicationId: applicationIdRef.current } : {}),
      ...(promoCodeRef.current ? { promoCode: promoCodeRef.current } : {}),
    };
  }

  async function handlePay(payment: TokenizedPayment, promoCode?: string | null) {
    promoCodeRef.current = promoCode ?? null;
    setProcessing(true);
    setPaymentError(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(payment)),
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
        setConversionValue(
          typeof json.amount === "number" && json.amount > 0 ? json.amount : total,
        );
        setReference(json.reference);
        setConfirmationEmail(json.confirmationEmailedTo ?? null);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (res.status === 402) {
        if (json.applicationId) applicationIdRef.current = json.applicationId;
        setPaymentError(
          json.message ?? "Your payment could not be completed. Please try a different card.",
        );
        return;
      }
      const detail = json.errors
        ? Object.values(json.errors).flat().slice(0, 3).join(" ")
        : "";
      setPaymentError(
        [json.message ?? "Something went wrong while submitting. Please try again.", detail]
          .filter(Boolean)
          .join(" "),
      );
    } catch {
      setPaymentError("We could not reach the server. Check your connection and try again.");
    } finally {
      setProcessing(false);
    }
  }

  if (reference) {
    return (
      <div className="mx-auto max-w-xl rounded border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
        <PurchaseConversionBeacon transactionId={reference} value={conversionValue} />
        <h2 className="text-2xl font-bold text-navy">{t("wizard.applicationReceived")}</h2>
        <p className="mt-2 text-slate-600">
          Thank you — your Florida fishing license application and payment have been received.
        </p>
        <div className="mt-6 rounded border border-navy/10 bg-slate-50 px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {t("wizard.referenceNumber")}
          </p>
          <p className="mt-1 font-mono text-xl font-bold text-navy">{reference}</p>
        </div>
        {confirmationEmail && (
          <p className="mt-4 text-sm text-slate-600">
            {t("wizard.confirmationEmail")}{" "}
            <span className="font-semibold text-navy">{confirmationEmail}</span>.
          </p>
        )}
      </div>
    );
  }

  const steps = [
    t("wizard.licenseSelection"),
    t("wizard.personalDetails"),
    t("wizard.payment"),
  ] as const;

  const flResidencyLabel = (value: string) => {
    if (value === "resident") return t("fl.resident");
    if (value === "us-citizen") return t("fl.usCitizen");
    if (value === "international") return t("fl.international");
    return config.residencyOptions.find((o) => o.value === value)?.label ?? value;
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-6 flex items-center justify-center gap-3">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                  i <= step ? "bg-navy text-white" : "bg-slate-200 text-slate-500",
                ].join(" ")}
              >
                {i + 1}
              </div>
              <span
                className={`max-w-[5.5rem] text-center text-xs ${
                  i <= step ? "font-medium text-slate-800" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && <div className="mb-4 h-px w-8 bg-slate-200 sm:w-10" />}
          </div>
        ))}
      </div>

      <div className="rounded border border-slate-200 bg-white px-4 py-6 shadow-sm sm:px-6">
        {errors.length > 0 && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <ul className="list-disc pl-4">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {step === 0 && (
          <>
            <h2 className="text-xl font-bold text-slate-900">{t("fl.residencyInfo")}</h2>

            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-800">
                {t("fl.primaryResidence")} <span className="text-red-600">*</span>
              </p>
              <div className="mt-2 grid w-full grid-cols-3 gap-3">
                {config.residencyOptions.map((opt) => (
                  <ChoiceButton
                    key={opt.value}
                    selected={form.residency === opt.value}
                    onClick={() => selectResidency(opt.value)}
                  >
                    {flResidencyLabel(opt.value)}
                  </ChoiceButton>
                ))}
              </div>
              <p className="mt-3 text-sm text-slate-500">
                A Florida resident is defined as any person who has continuously resided in Florida
                for more than six (6) consecutive months.
              </p>
            </div>

            {form.residency === "resident" && (
              <>
                <SectionHeading>Florida Resident Identification</SectionHeading>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field label="Florida Driver's License Number" required className="sm:col-span-2">
                    <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
                      <select
                        className={inputClass}
                        value={form.dlIssuingState}
                        onChange={(e) => onDlStateChange(e.target.value)}
                      >
                        {FL_STATE_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      <input
                        className={inputClass}
                        placeholder="Driver's License Number"
                        value={form.documentNumber}
                        onChange={(e) => set("documentNumber", e.target.value)}
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      If you select a state other than Florida, you will be redirected to the U.S.
                      Citizen flow.
                    </p>
                  </Field>
                  <Field label="Driver's License Expiration Date" required className="sm:col-span-2">
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        className={inputClass}
                        value={form.expMonth}
                        onChange={(e) => set("expMonth", e.target.value)}
                      >
                        <option value="">{t("wizard.month")}</option>
                        {MONTHS.map((m) => (
                          <option key={m} value={m}>
                            {t(`month.${m}`)}
                          </option>
                        ))}
                      </select>
                      <select
                        className={inputClass}
                        value={form.expDay}
                        onChange={(e) => set("expDay", e.target.value)}
                      >
                        <option value="">{t("wizard.day")}</option>
                        {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <select
                        className={inputClass}
                        value={form.expYear}
                        onChange={(e) => set("expYear", e.target.value)}
                      >
                        <option value="">{t("wizard.year")}</option>
                        {Array.from({ length: 15 }, (_, i) => String(2026 + i)).map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </Field>
                  <Field label={t("wizard.ssn")} required className="sm:col-span-2">
                    <input
                      className={inputClass}
                      placeholder="XXX-XX-XXXX"
                      inputMode="numeric"
                      value={formatSsnDisplay(form.ssn)}
                      onChange={(e) => set("ssn", digitsOnly(e.target.value))}
                    />
                  </Field>
                </div>

                <SectionHeading>Driver&apos;s License Name Confirmation</SectionHeading>
                <p className="mt-2 text-sm text-slate-500">
                  Please enter your name <strong>exactly as it appears on your Driver&apos;s License</strong>.
                  This must match your official identification.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <Field label={t("wizard.firstName")} required>
                    <input
                      className={inputClass}
                      value={form.firstName}
                      onChange={(e) => set("firstName", e.target.value)}
                    />
                  </Field>
                  <Field label={t("wizard.middleName")}>
                    <input
                      className={inputClass}
                      value={form.middleName}
                      onChange={(e) => set("middleName", e.target.value)}
                    />
                  </Field>
                  <Field label={t("wizard.lastName")} required>
                    <input
                      className={inputClass}
                      value={form.lastName}
                      onChange={(e) => set("lastName", e.target.value)}
                    />
                  </Field>
                </div>
              </>
            )}

            {form.residency === "us-citizen" && (
              <>
                <SectionHeading>U.S. Citizen Identification</SectionHeading>
                <div className="mt-4 grid gap-3">
                  <Field label={t("wizard.ssn")} required>
                    <input
                      className={inputClass}
                      placeholder="XXX-XX-XXXX"
                      inputMode="numeric"
                      value={formatSsnDisplay(form.ssn)}
                      onChange={(e) => set("ssn", digitsOnly(e.target.value))}
                    />
                  </Field>
                  <label className="flex items-start gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={form.noSsn}
                      onChange={(e) => onNoSsnChange(e.target.checked)}
                    />
                    <span>
                      I do not have a Social Security Number
                      <span className="mt-0.5 block text-xs text-slate-500">
                        If you do not have an SSN, you will be redirected to the International
                        Customer flow.
                      </span>
                    </span>
                  </label>
                  <Field label="U.S. Driver's License" required>
                    <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
                      <select
                        className={inputClass}
                        value={form.dlIssuingState}
                        onChange={(e) => set("dlIssuingState", e.target.value)}
                      >
                        <option value="">{t("wizard.state")}</option>
                        {FL_STATE_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      <input
                        className={inputClass}
                        placeholder="Driver's License Number"
                        value={form.documentNumber}
                        onChange={(e) => set("documentNumber", e.target.value)}
                      />
                    </div>
                  </Field>
                </div>
                <SectionHeading>Driver&apos;s License Name Confirmation</SectionHeading>
                <p className="mt-2 text-sm text-slate-500">
                  Please enter your name <strong>exactly as it appears on your Driver&apos;s License</strong>.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <Field label={t("wizard.firstName")} required>
                    <input
                      className={inputClass}
                      value={form.firstName}
                      onChange={(e) => set("firstName", e.target.value)}
                    />
                  </Field>
                  <Field label={t("wizard.middleName")}>
                    <input
                      className={inputClass}
                      value={form.middleName}
                      onChange={(e) => set("middleName", e.target.value)}
                    />
                  </Field>
                  <Field label={t("wizard.lastName")} required>
                    <input
                      className={inputClass}
                      value={form.lastName}
                      onChange={(e) => set("lastName", e.target.value)}
                    />
                  </Field>
                </div>
              </>
            )}

            {form.residency === "international" && (
              <>
                <SectionHeading>Personal Identification</SectionHeading>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field label={t("wizard.identificationType")} required>
                    <select
                      className={inputClass}
                      value={form.intlIdType}
                      onChange={(e) => set("intlIdType", e.target.value as IntlIdType | "")}
                    >
                      <option value="">Select identification type...</option>
                      <option value="passport">{t("wizard.passport")}</option>
                      <option value="visa">Visa</option>
                      <option value="green-card">{t("wizard.greenCard")}</option>
                      <option value="non-us-drivers-license">Non-US Driver&apos;s License</option>
                    </select>
                  </Field>
                  <Field label="Identification Number" required>
                    <input
                      className={inputClass}
                      value={form.documentNumber}
                      onChange={(e) => set("documentNumber", e.target.value)}
                    />
                  </Field>
                </div>
              </>
            )}

            {form.residency ? (
              <DlUploadFields
                value={form}
                onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
                onError={(msg) => setErrors([msg])}
              />
            ) : null}

            {form.residency && licenses.length > 0 && (
              <>
                <SectionHeading>Available Fishing Licenses</SectionHeading>
                <div className="mt-3 space-y-2">
                  {licenses.map((lic) => {
                    const selected = form.licenseId === lic.id;
                    const price = displayPrice(lic.price);
                    return (
                      <label
                        key={lic.id}
                        className={[
                          "flex cursor-pointer items-center justify-between gap-3 rounded border px-3 py-3 text-sm transition-colors",
                          selected
                            ? "border-navy bg-navy/5"
                            : "border-slate-200 hover:border-slate-300",
                        ].join(" ")}
                      >
                        <span className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="fl-license"
                            checked={selected}
                            onChange={() => set("licenseId", lic.id)}
                            className="accent-navy"
                          />
                          <span className="font-medium text-slate-800">{licenseLabel(lic)}</span>
                        </span>
                        <span className="shrink-0 font-bold text-navy">{formatPrice(price)}</span>
                      </label>
                    );
                  })}
                </div>
                {pricingTier === "resident" && (
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">
                    <strong>Sportsman&apos;s License</strong> includes freshwater fishing, saltwater
                    fishing, and hunting privileges. <strong>Gold Sportsman&apos;s License</strong>{" "}
                    includes all Sportsman&apos;s privileges plus additional permits: deer, wildlife
                    management area, archery, muzzleloading gun, crossbow, turkey, snook, lobster, and
                    a waterfowl permit.
                  </p>
                )}
              </>
            )}

            <button
              type="button"
              className="mt-8 w-full rounded bg-navy px-4 py-3 text-sm font-semibold text-white hover:bg-navy/90"
              onClick={() => {
                const e = validateStep0();
                setErrors(e);
                if (e.length === 0) {
                  setStep(1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
            >
              {t("fl.continuePersonal")}
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-xl font-bold text-slate-900">{t("wizard.personalInformation")}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Field label={t("wizard.firstName")} required>
                <input
                  className={inputClass}
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                />
              </Field>
              <Field label={t("wizard.middleName")}>
                <input
                  className={inputClass}
                  value={form.middleName}
                  onChange={(e) => set("middleName", e.target.value)}
                />
              </Field>
              <Field label={t("wizard.lastName")} required>
                <input
                  className={inputClass}
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                />
              </Field>
              <Field label={t("wizard.dob")} required className="sm:col-span-3">
                <div className="grid grid-cols-3 gap-2">
                  <select
                    className={inputClass}
                    value={form.dobMonth}
                    onChange={(e) => set("dobMonth", e.target.value)}
                  >
                    <option value="">{t("wizard.month")}</option>
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {t(`month.${m}`)}
                      </option>
                    ))}
                  </select>
                  <select
                    className={inputClass}
                    value={form.dobDay}
                    onChange={(e) => set("dobDay", e.target.value)}
                  >
                    <option value="">{t("wizard.day")}</option>
                    {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <select
                    className={inputClass}
                    value={form.dobYear}
                    onChange={(e) => set("dobYear", e.target.value)}
                  >
                    <option value="">{t("wizard.year")}</option>
                    {Array.from({ length: 100 }, (_, i) => String(2025 - i)).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>
            </div>

            <SectionHeading>{t("wizard.residentialAddress")}</SectionHeading>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label={t("wizard.street")} required className="sm:col-span-2">
                <input
                  className={inputClass}
                  value={form.street}
                  onChange={(e) => set("street", e.target.value)}
                />
              </Field>
              <Field label={t("wizard.city")} required>
                <input
                  className={inputClass}
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                />
              </Field>
              <Field label={t("wizard.state")} required>
                {/* Competitor parity: license state is fixed to Florida (read-only). */}
                <input className={inputClass} value="Florida" readOnly />
              </Field>
              <Field label={t("wizard.zipCode")} required className="sm:col-span-2">
                <input
                  className={inputClass}
                  value={form.zip}
                  onChange={(e) => set("zip", e.target.value)}
                />
              </Field>
            </div>

            <SectionHeading>{t("wizard.contactInformation")}</SectionHeading>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label={t("wizard.email")} required>
                <input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
              <Field label={t("wizard.phone")} required>
                <input
                  className={inputClass}
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </Field>
            </div>

            <SectionHeading>{t("wizard.demographics")}</SectionHeading>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label={t("wizard.gender")} required>
                <select
                  className={inputClass}
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value)}
                >
                  <option value="">{t("wizard.selectGender")}</option>
                  <option value="male">{t("wizard.male")}</option>
                  <option value="female">{t("wizard.female")}</option>
                  <option value="prefer-not-to-say">{t("wizard.preferNot")}</option>
                </select>
              </Field>
              <Field label="Ethnicity" required>
                <select
                  className={inputClass}
                  value={form.ethnicity}
                  onChange={(e) => set("ethnicity", e.target.value)}
                >
                  <option value="">Select...</option>
                  {ETHNICITY.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("wizard.height")} required className="sm:col-span-2">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    className={inputClass}
                    value={form.heightFt}
                    onChange={(e) => set("heightFt", e.target.value)}
                  >
                    <option value="">Feet</option>
                    {["3", "4", "5", "6", "7"].map((n) => (
                      <option key={n} value={n}>
                        {n} ft
                      </option>
                    ))}
                  </select>
                  <select
                    className={inputClass}
                    value={form.heightIn}
                    onChange={(e) => set("heightIn", e.target.value)}
                  >
                    <option value="">Inches</option>
                    {Array.from({ length: 12 }, (_, i) => String(i)).map((n) => (
                      <option key={n} value={n}>
                        {n} in
                      </option>
                    ))}
                  </select>
                </div>
              </Field>
            </div>

            <SectionHeading>{t("wizard.declarationConsent")}</SectionHeading>
            <div className="mt-4">
              <div className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={form.consent}
                  onChange={(e) => set("consent", e.target.checked)}
                  id="fl-consent"
                />
                <div className="min-w-0 flex-1">
                  <label htmlFor="fl-consent" className="cursor-pointer">
                    {t("wizard.consent")} <span className="text-red-600">*</span>
                  </label>{" "}
                  <button
                    type="button"
                    className="inline-flex items-center gap-0.5 font-semibold text-navy hover:underline"
                    onClick={() => setShowConsentTerms((v) => !v)}
                    aria-expanded={showConsentTerms}
                  >
                    {showConsentTerms ? t("wizard.showLess") : t("wizard.readMore")}
                    <span aria-hidden="true">{showConsentTerms ? " ˅" : " >"}</span>
                  </button>
                  {showConsentTerms && (
                    <div className="mt-3 rounded border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 text-xs leading-snug text-slate-600">
                      <p>
                        By checking this box, I confirm that I have read, understood, and agreed to
                        all terms and policies associated with the Florida fishing license as
                        outlined on the Florida Fish and Wildlife Conservation Commission (FWC)
                        website.
                      </p>
                      <p className="mt-2">
                        I hereby authorize AnglerPermit to act on my behalf in submitting my Florida
                        fishing license application. I acknowledge and accept that once AnglerPermit
                        has completed the application process on my behalf, this transaction is
                        non-refundable.
                      </p>
                      <p className="mt-2">
                        Additionally, I agree to adhere to the terms and policies of AnglerPermit,
                        detailed at{" "}
                        <a
                          href="/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-navy"
                        >
                          anglerpermit.com/terms
                        </a>
                        . I understand my responsibility to provide complete and accurate information
                        for my application. I am aware that any non-compliance with these terms and
                        policies may result in penalties, including but not limited to the
                        cancellation of my fishing license.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="rounded border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setErrors([]);
                  setStep(0);
                }}
              >
                {t("wizard.back")}
              </button>
              <button
                type="button"
                className="flex-1 rounded bg-navy px-4 py-3 text-sm font-semibold text-white hover:bg-navy/90"
                onClick={() => {
                  const e = validateStep1();
                  setErrors(e);
                  if (e.length === 0) {
                    setStep(2);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
              >
                {t("wizard.continuePayment")}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="mb-4 text-center text-xl font-bold text-slate-900">
              {t("wizard.payment")}
            </h2>
            <PaymentStep
              total={total}
              stateName={config.stateName}
              processing={processing}
              error={paymentError}
              onPay={handlePay}
              compact
              licenseSummary={
                selectedLicense
                  ? {
                      name: licenseLabel(selectedLicense),
                      price: displayPrice(selectedLicense.price),
                    }
                  : null
              }
            />
            <button
              type="button"
              className="mt-4 rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => {
                setPaymentError(null);
                setStep(1);
              }}
            >
              {t("wizard.back")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
