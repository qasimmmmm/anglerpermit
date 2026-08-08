"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import type { LicenseOption, StateConfig, TokenizedPayment } from "@/lib/state-config";
import {
  computeOrderTotal,
  displayPrice,
  residencyPricingTier,
} from "@/lib/state-config";
import { US_STATE_OPTIONS } from "@/lib/us-states";
import { formatPrice } from "@/lib/format";
import { PaymentStep } from "@/components/PaymentStep";
import { NON_AFFILIATION_DISCLAIMER } from "@/lib/disclaimer";

const NC_STATE_OPTIONS = [
  ...US_STATE_OPTIONS.filter((s) => s.value === "NC"),
  ...US_STATE_OPTIONS.filter((s) => s.value !== "NC" && s.value !== "DC"),
  ...US_STATE_OPTIONS.filter((s) => s.value === "DC"),
];

const RESIDENT_LICENSE_GROUPS: { heading: string; ids: readonly string[] }[] = [
  {
    heading: "Annual Licenses",
    ids: [
      "coastal-recreational-fishing-annual-resident",
      "state-inland-fishing-annual-resident",
      "unified-inland-coastal-annual-resident",
      "unified-sportsman-crfl-annual-resident",
    ],
  },
  {
    heading: "10-Day Licenses",
    ids: [
      "coastal-recreational-fishing-10-day-resident",
      "inland-fishing-10-day-resident",
    ],
  },
  {
    heading: "Lifetime Licenses",
    ids: [
      "crfl-lifetime-adult-resident",
      "unified-inland-coastal-lifetime-resident",
      "crfl-lifetime-youth",
    ],
  },
];

const NONRESIDENT_LICENSE_GROUPS: { heading: string; ids: readonly string[] }[] = [
  {
    heading: "Annual Licenses",
    ids: [
      "coastal-recreational-fishing-annual-nonresident",
      "state-inland-fishing-annual-nonresident",
    ],
  },
  {
    heading: "10-Day Licenses",
    ids: [
      "coastal-recreational-fishing-10-day-nonresident",
      "inland-fishing-10-day-nonresident",
    ],
  },
  {
    heading: "Lifetime Licenses",
    ids: ["crfl-lifetime-adult-nonresident", "crfl-lifetime-youth"],
  },
];

const LICENSE_LABELS: Record<string, string> = {
  "coastal-recreational-fishing-annual-resident": "Coastal Recreational Fishing License",
  "state-inland-fishing-annual-resident": "Inland Fishing License",
  "unified-inland-coastal-annual-resident":
    "Unified Inland & Coastal Recreational Fishing License",
  "unified-sportsman-crfl-annual-resident":
    "Unified Sportsman & Coastal Recreational Fishing License",
  "coastal-recreational-fishing-10-day-resident":
    "Coastal Recreational Fishing License - 10 Days",
  "inland-fishing-10-day-resident": "Inland Fishing License - 10 Days",
  "crfl-lifetime-adult-resident": "Lifetime Coastal Recreational Fishing",
  "unified-inland-coastal-lifetime-resident":
    "Lifetime Unified Inland & Coastal Recreational Fishing",
  "crfl-lifetime-youth": "Youth Coastal Recreational Fishing",
  "coastal-recreational-fishing-annual-nonresident": "Coastal Recreational Fishing License",
  "state-inland-fishing-annual-nonresident": "Inland Fishing License",
  "coastal-recreational-fishing-10-day-nonresident":
    "Coastal Recreational Fishing License - 10 Days",
  "inland-fishing-10-day-nonresident": "Inland Fishing License - 10 Days",
  "crfl-lifetime-adult-nonresident": "Lifetime Coastal Recreational Fishing",
};

const LICENSE_SUB: Record<string, string> = {
  "coastal-recreational-fishing-annual-resident": "Valid for 1 year",
  "state-inland-fishing-annual-resident": "Valid for 1 year",
  "unified-inland-coastal-annual-resident": "Valid for 1 year",
  "unified-sportsman-crfl-annual-resident": "Valid for 1 year",
  "coastal-recreational-fishing-10-day-resident": "Valid for 10 days",
  "inland-fishing-10-day-resident": "Valid for 10 days",
  "crfl-lifetime-adult-resident": "Adults 12 to 65",
  "unified-inland-coastal-lifetime-resident": "NC residents",
  "crfl-lifetime-youth": "12 years and younger",
  "coastal-recreational-fishing-annual-nonresident": "Valid for 1 year",
  "state-inland-fishing-annual-nonresident": "Valid for 1 year",
  "coastal-recreational-fishing-10-day-nonresident": "Valid for 10 days",
  "inland-fishing-10-day-nonresident": "Valid for 10 days",
  "crfl-lifetime-adult-nonresident": "Adults 12 to 65",
};

const SHORT_TERM_IDS = new Set<string>([
  "coastal-recreational-fishing-10-day-resident",
  "inland-fishing-10-day-resident",
  "coastal-recreational-fishing-10-day-nonresident",
  "inland-fishing-10-day-nonresident",
]);

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

type ResidentId = "nc-dl" | "nc-id";
type IntlIdType = "passport" | "visa" | "green-card" | "non-us-drivers-license";
type Step = 0 | 1 | 2;

const INTL_ID_NUMBER_LABEL: Record<IntlIdType, string> = {
  passport: "Passport Number",
  visa: "Visa Number",
  "green-card": "Green Card Number",
  "non-us-drivers-license": "Non-US Driver's License Number",
};

type FormState = {
  residency: string;
  residentId: ResidentId | "";
  intlIdType: IntlIdType | "";
  documentNumber: string;
  expMonth: string;
  expDay: string;
  expYear: string;
  ssn: string;
  licenseId: string;
  firstName: string;
  middleName: string;
  lastName: string;
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
  residentId: "",
  intlIdType: "",
  documentNumber: "",
  expMonth: "",
  expDay: "",
  expYear: "",
  ssn: "",
  licenseId: "",
  firstName: "",
  middleName: "",
  lastName: "",
  dobDay: "",
  dobMonth: "",
  dobYear: "",
  street: "",
  city: "",
  state: "NC",
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
        "rounded border-2 px-3 py-2 text-sm font-semibold transition-colors",
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
    <h2 className="mt-8 border-t border-slate-100 pt-6 text-base font-bold text-slate-800">
      {children}
    </h2>
  );
}

function licenseLabel(lic: LicenseOption): string {
  return LICENSE_LABELS[lic.id] ?? lic.name;
}

export function NorthCarolinaCompetitorApply({ config }: { config: StateConfig }) {
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<string[]>([]);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [showConsentTerms, setShowConsentTerms] = useState(false);
  const applicationIdRef = useRef<string | null>(null);
  const promoCodeRef = useRef<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const pricingTier = form.residency
    ? residencyPricingTier(form.residency)
    : null;

  const licenseGroups = useMemo(() => {
    if (!form.residency) return [] as { heading: string; licenses: LicenseOption[] }[];
    const groups =
      pricingTier === "nonresident" ? NONRESIDENT_LICENSE_GROUPS : RESIDENT_LICENSE_GROUPS;
    return groups
      .map((g) => ({
        heading: g.heading,
        licenses: g.ids
          .map((id) => config.licenses.find((l) => l.id === id))
          .filter((l): l is LicenseOption => Boolean(l)),
      }))
      .filter((g) => g.licenses.length > 0);
  }, [config.licenses, form.residency, pricingTier]);

  const selectedLicense = config.licenses.find((l) => l.id === form.licenseId);
  const total = form.licenseId ? computeOrderTotal(config, form.licenseId, []) : 0;
  const needsStartDate = SHORT_TERM_IDS.has(form.licenseId);
  const needsExpiration = form.residency === "resident" && form.residentId === "nc-dl";

  function selectResidency(value: string) {
    setForm((f) => ({
      ...f,
      residency: value,
      licenseId: "",
      residentId: "",
      intlIdType: "",
      documentNumber: "",
      expMonth: "",
      expDay: "",
      expYear: "",
      ssn: value === "international" ? "" : f.ssn,
      state: value === "resident" ? "NC" : f.state || "NC",
    }));
    setErrors([]);
  }

  function validateStep0(): string[] {
    const e: string[] = [];
    if (!form.residency) e.push("Select your residency status.");
    if (form.residency === "resident") {
      if (!form.residentId) e.push("Select an identification type.");
      if (!form.documentNumber.trim()) e.push("Enter your NC ID number.");
      if (needsExpiration && (!form.expMonth || !form.expDay || !form.expYear)) {
        e.push("Expiration date is required.");
      }
      if (digitsOnly(form.ssn).length !== 9) e.push("Enter a valid Social Security number.");
    }
    if (form.residency === "us-citizen") {
      if (digitsOnly(form.ssn).length !== 9) e.push("Enter a valid Social Security number.");
      if (!form.intlIdType) e.push("Select an identification document.");
      if (!form.documentNumber.trim()) e.push("Enter your identification number.");
    }
    if (form.residency === "international") {
      if (!form.intlIdType) e.push("Select an identification document.");
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
    if (!form.email.trim() || !form.email.includes("@")) e.push("Email address is required.");
    if (!form.gender) e.push("Gender is required.");
    if (!form.heightFt || form.heightIn === "") e.push("Height is required.");
    if (!form.ethnicity) e.push("Ethnicity is required.");
    if (!form.street.trim()) e.push("Street address is required.");
    if (!form.city.trim()) e.push("City is required.");
    if (!form.state) e.push("State is required.");
    if (!form.zip.trim()) e.push("ZIP code is required.");
    else if (!/^\d{5}(-\d{4})?$/.test(form.zip.trim())) {
      e.push("Enter a valid ZIP code.");
    }
    if (!form.consent) e.push("Please confirm your information and agree to the terms.");
    return e;
  }

  function buildPayload(payment: TokenizedPayment) {
    const dob = `${pad2(monthIndex(form.dobMonth))}/${pad2(form.dobDay)}/${form.dobYear}`;
    const ssnDigits = digitsOnly(form.ssn);
    const data: Record<string, string | boolean | number> = {
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim(),
      lastName: form.lastName.trim(),
      birthDate: dob,
      gender: form.gender === "non-binary" ? "undisclosed" : form.gender,
      ethnicity: form.ethnicity,
      heightFt: form.heightFt,
      heightIn: form.heightIn,
      email: form.email.trim(),
      primaryPhone: form.phone.trim() ? formatPhone(form.phone) : "",
      primaryPhoneType: "mobile",
      street: form.street.trim(),
      city: form.city.trim(),
      state: form.state || "NC",
      zipCode: form.zip.trim(),
      county: "out-of-state",
      isNonUSAddress: form.residency === "international" ? "yes" : "no",
      usCitizenship:
        form.residency === "international" ? "non-us-citizen" : "us-citizen",
      residency: form.residency,
      documentNumber: form.documentNumber.trim(),
    };

    if (form.residency === "resident") {
      data.documentType = "us-drivers-license";
      data.documentIssuingState = "NC";
      data.socialSecurityNumber = ssnDigits;
      data.ssnLast4 = ssnDigits.slice(-4);
    } else if (form.residency === "us-citizen") {
      data.documentType =
        form.intlIdType === "non-us-drivers-license"
          ? "us-drivers-license"
          : form.intlIdType || "passport";
      data.socialSecurityNumber = ssnDigits;
      data.ssnLast4 = ssnDigits.slice(-4);
    } else {
      data.documentType = form.intlIdType || "passport";
    }

    if (needsExpiration && form.expMonth && form.expDay && form.expYear) {
      data.idExpirationDate = `${pad2(monthIndex(form.expMonth))}/${pad2(form.expDay)}/${form.expYear}`;
    }

    if (needsStartDate) {
      const today = new Date();
      data.licenseStartDate = `${pad2(today.getMonth() + 1)}/${pad2(today.getDate())}/${today.getFullYear()}`;
    }

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
        message?: string;
        errors?: Record<string, string[]>;
      };
      if (res.ok && json.ok && json.reference) {
        applicationIdRef.current = null;
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
        <h2 className="text-2xl font-bold text-navy">Application received</h2>
        <p className="mt-2 text-slate-600">
          Thank you — your North Carolina fishing license application and payment have been
          received.
        </p>
        <div className="mt-6 rounded border border-navy/10 bg-slate-50 px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Your reference number
          </p>
          <p className="mt-1 font-mono text-xl font-bold text-navy">{reference}</p>
        </div>
        {confirmationEmail && (
          <p className="mt-4 text-sm text-slate-600">
            A confirmation email is on its way to{" "}
            <span className="font-semibold text-navy">{confirmationEmail}</span>.
          </p>
        )}
      </div>
    );
  }

  const steps = ["ID & License", "Applicant Info", "Payment"] as const;

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
            <h2 className="text-xl font-bold text-slate-900">Identification &amp; License</h2>
            <p className="mt-1 text-sm text-slate-500">
              Tell us about your residency and provide your ID details.
            </p>

            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-800">
                Residency Status <span className="text-red-600">*</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {config.residencyOptions.map((opt) => (
                  <ChoiceButton
                    key={opt.value}
                    selected={form.residency === opt.value}
                    onClick={() => selectResidency(opt.value)}
                  >
                    {opt.label}
                  </ChoiceButton>
                ))}
              </div>
              <p className="mt-3 text-sm text-slate-500">
                By providing a North Carolina ID card or Driver&apos;s License number, you are
                confirming that you are a North Carolina resident. If you do not have a North
                Carolina ID, please indicate whether you are an international customer or a U.S.
                citizen from another state.
              </p>
            </div>

            {form.residency === "resident" && (
              <>
                <div className="mt-6">
                  <p className="text-sm font-semibold text-slate-800">
                    Identification Type <span className="text-red-600">*</span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <ChoiceButton
                      selected={form.residentId === "nc-dl"}
                      onClick={() => {
                        set("residentId", "nc-dl");
                        set("documentNumber", "");
                      }}
                    >
                      NC Driver&apos;s License
                    </ChoiceButton>
                    <ChoiceButton
                      selected={form.residentId === "nc-id"}
                      onClick={() => {
                        set("residentId", "nc-id");
                        set("documentNumber", "");
                        set("expMonth", "");
                        set("expDay", "");
                        set("expYear", "");
                      }}
                    >
                      NC ID Card
                    </ChoiceButton>
                  </div>
                </div>
                {form.residentId && (
                  <div className="mt-4 grid gap-3">
                    <Field
                      label={
                        form.residentId === "nc-id"
                          ? "ID Card Number"
                          : "Driver's License Number"
                      }
                      required
                    >
                      <input
                        className={inputClass}
                        placeholder={
                          form.residentId === "nc-id"
                            ? "Enter NC ID number"
                            : "Enter NC DL number"
                        }
                        value={form.documentNumber}
                        onChange={(e) => set("documentNumber", e.target.value)}
                      />
                    </Field>
                    {needsExpiration && (
                      <Field label="Expiration Date" required>
                        <div className="grid grid-cols-3 gap-2">
                          <select
                            className={inputClass}
                            value={form.expMonth}
                            onChange={(e) => set("expMonth", e.target.value)}
                          >
                            <option value="">Month</option>
                            {MONTHS.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                          <select
                            className={inputClass}
                            value={form.expDay}
                            onChange={(e) => set("expDay", e.target.value)}
                          >
                            <option value="">Day</option>
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
                            <option value="">Year</option>
                            {Array.from({ length: 16 }, (_, i) => String(2026 + i)).map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>
                      </Field>
                    )}
                  </div>
                )}
                <div className="mt-4 grid gap-3">
                  <Field label="Social Security Number" required>
                    <input
                      className={inputClass}
                      placeholder="XXX-XX-XXXX"
                      inputMode="numeric"
                      value={formatSsnDisplay(form.ssn)}
                      onChange={(e) => set("ssn", digitsOnly(e.target.value))}
                    />
                  </Field>
                  <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    ✓ You are a North Carolina Resident
                  </div>
                </div>
              </>
            )}

            {form.residency === "us-citizen" && (
              <div className="mt-4 grid gap-3">
                <Field label="Social Security Number" required>
                  <input
                    className={inputClass}
                    placeholder="XXX-XX-XXXX"
                    inputMode="numeric"
                    value={formatSsnDisplay(form.ssn)}
                    onChange={(e) => set("ssn", digitsOnly(e.target.value))}
                  />
                </Field>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">
                    Identification Document <span className="text-red-600">*</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["passport", "Passport"],
                        ["visa", "Visa"],
                        ["green-card", "Green Card"],
                        ["non-us-drivers-license", "Non-US Driver's License"],
                      ] as const
                    ).map(([value, label]) => (
                      <ChoiceButton
                        key={value}
                        selected={form.intlIdType === value}
                        onClick={() => {
                          set("intlIdType", value);
                          set("documentNumber", "");
                        }}
                      >
                        {label}
                      </ChoiceButton>
                    ))}
                  </div>
                </div>
                {form.intlIdType && (
                  <Field label={INTL_ID_NUMBER_LABEL[form.intlIdType]} required>
                    <input
                      className={inputClass}
                      value={form.documentNumber}
                      onChange={(e) => set("documentNumber", e.target.value)}
                    />
                  </Field>
                )}
                <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  You are a Non-Resident of North Carolina
                </div>
              </div>
            )}

            {form.residency === "international" && (
              <div className="mt-4 grid gap-3">
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">
                    Identification Document <span className="text-red-600">*</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["passport", "Passport"],
                        ["visa", "Visa"],
                        ["green-card", "Green Card"],
                        ["non-us-drivers-license", "Non-US Driver's License"],
                      ] as const
                    ).map(([value, label]) => (
                      <ChoiceButton
                        key={value}
                        selected={form.intlIdType === value}
                        onClick={() => {
                          set("intlIdType", value);
                          set("documentNumber", "");
                        }}
                      >
                        {label}
                      </ChoiceButton>
                    ))}
                  </div>
                </div>
                {form.intlIdType && (
                  <Field label={INTL_ID_NUMBER_LABEL[form.intlIdType]} required>
                    <input
                      className={inputClass}
                      value={form.documentNumber}
                      onChange={(e) => set("documentNumber", e.target.value)}
                    />
                  </Field>
                )}
                <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  You are a Non-Resident of North Carolina
                </div>
              </div>
            )}

            {form.residency &&
              licenseGroups.map((group) => (
                <div key={group.heading}>
                  <SectionHeading>{group.heading}</SectionHeading>
                  <div className="mt-3 space-y-2">
                    {group.licenses.map((lic) => {
                      const selected = form.licenseId === lic.id;
                      const price = displayPrice(lic.price);
                      const youthSub =
                        lic.id === "crfl-lifetime-youth" && pricingTier === "nonresident"
                          ? "Under 12"
                          : LICENSE_SUB[lic.id];
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
                              name="nc-license"
                              checked={selected}
                              onChange={() => set("licenseId", lic.id)}
                              className="accent-navy"
                            />
                            <span>
                              <span className="block font-medium text-slate-800">
                                {licenseLabel(lic)}
                              </span>
                              {youthSub && (
                                <span className="block text-xs text-slate-500">{youthSub}</span>
                              )}
                            </span>
                          </span>
                          <span className="shrink-0 font-bold text-navy">
                            {formatPrice(price)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

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
              Continue
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-xl font-bold text-slate-900">Applicant Information</h2>
            <p className="mt-1 text-sm text-slate-500">
              Provide your personal details and demographics.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Field label="First Name" required>
                <input
                  className={inputClass}
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                />
              </Field>
              <Field label="Middle Name">
                <input
                  className={inputClass}
                  value={form.middleName}
                  onChange={(e) => set("middleName", e.target.value)}
                />
              </Field>
              <Field label="Last Name" required>
                <input
                  className={inputClass}
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                />
              </Field>
            </div>

            <Field label="Date of Birth" required className="mt-3">
              <div className="grid grid-cols-3 gap-2">
                <select
                  className={inputClass}
                  value={form.dobMonth}
                  onChange={(e) => set("dobMonth", e.target.value)}
                >
                  <option value="">Month</option>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  className={inputClass}
                  value={form.dobDay}
                  onChange={(e) => set("dobDay", e.target.value)}
                >
                  <option value="">Day</option>
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
                  <option value="">Year</option>
                  {Array.from({ length: 100 }, (_, i) => String(2025 - i)).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </Field>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Email Address" required>
                <input
                  className={inputClass}
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
              <Field label="Phone Number">
                <input
                  className={inputClass}
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </Field>
            </div>

            <SectionHeading>Demographics</SectionHeading>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Gender" required className="sm:col-span-2">
                <select
                  className={inputClass}
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value)}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="undisclosed">Prefer not to say</option>
                </select>
              </Field>
              <Field label="Height (ft)" required>
                <select
                  className={inputClass}
                  value={form.heightFt}
                  onChange={(e) => set("heightFt", e.target.value)}
                >
                  <option value="">Ft</option>
                  {["3", "4", "5", "6", "7"].map((ft) => (
                    <option key={ft} value={ft}>
                      {ft}&apos;
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Height (in)" required>
                <select
                  className={inputClass}
                  value={form.heightIn}
                  onChange={(e) => set("heightIn", e.target.value)}
                >
                  <option value="">In</option>
                  {Array.from({ length: 12 }, (_, i) => String(i)).map((inch) => (
                    <option key={inch} value={inch}>
                      {inch}&quot;
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Ethnicity" required className="sm:col-span-2">
                <select
                  className={inputClass}
                  value={form.ethnicity}
                  onChange={(e) => set("ethnicity", e.target.value)}
                >
                  <option value="">Select ethnicity</option>
                  {ETHNICITY.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <SectionHeading>Residential Address</SectionHeading>
            <div className="mt-3 grid gap-3">
              <Field label="Street Address" required>
                <input
                  className={inputClass}
                  value={form.street}
                  onChange={(e) => set("street", e.target.value)}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="City" required>
                  <input
                    className={inputClass}
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                  />
                </Field>
                <Field label="State" required>
                  <select
                    className={inputClass}
                    value={form.state}
                    onChange={(e) => set("state", e.target.value)}
                  >
                    <option value="">Select state</option>
                    {NC_STATE_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.value === "NC" ? "NC — North Carolina" : s.value}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="ZIP" required>
                  <input
                    className={inputClass}
                    value={form.zip}
                    onChange={(e) => set("zip", e.target.value)}
                  />
                </Field>
              </div>
            </div>

            <div className="mt-6">
              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={form.consent}
                  onChange={(e) => set("consent", e.target.checked)}
                />
                <span>
                  I confirm that all information provided is accurate and I agree to the terms and
                  conditions. <span className="text-red-600">*</span>{" "}
                  <button
                    type="button"
                    className="font-semibold text-navy underline"
                    onClick={() => setShowConsentTerms((v) => !v)}
                  >
                    {showConsentTerms ? "Show less" : "Read More"}
                  </button>
                </span>
              </label>
              {showConsentTerms && (
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  {NON_AFFILIATION_DISCLAIMER} By submitting, you authorize AnglerPermit to assist
                  with your North Carolina fishing license application and to process payment for
                  the selected license.
                </p>
              )}
            </div>

            <div className="mt-8 flex flex-col gap-2 sm:flex-row">
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
                Continue to Payment
              </button>
              <button
                type="button"
                className="rounded border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setStep(0);
                  setErrors([]);
                }}
              >
                Back
              </button>
            </div>
          </>
        )}

        {step === 2 && selectedLicense && (
          <>
            <h2 className="text-xl font-bold text-slate-900">Complete your payment</h2>
            <div className="mt-4">
              <PaymentStep
                total={total}
                stateName={config.stateName}
                processing={processing}
                error={paymentError}
                onPay={handlePay}
                compact
                licenseSummary={{
                  name: licenseLabel(selectedLicense),
                  price: displayPrice(selectedLicense.price),
                }}
              />
              <button
                type="button"
                className="mt-4 w-full rounded border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setStep(1);
                  setPaymentError(null);
                }}
              >
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
