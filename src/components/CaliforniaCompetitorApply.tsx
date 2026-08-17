"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import type { LicenseOption, StateConfig, TokenizedPayment } from "@/lib/state-config";
import {
  computeOrderTotal,
  displayPrice,
  licensesForResidency,
  residencyPricingTier,
} from "@/lib/state-config";
import { US_STATE_OPTIONS } from "@/lib/us-states";
import { formatPrice } from "@/lib/format";
import { PaymentStep } from "@/components/PaymentStep";
import { PurchaseConversionBeacon } from "@/components/PurchaseConversionBeacon";
import { LicenseStartDateField } from "@/components/LicenseStartDateField";
import { NON_AFFILIATION_DISCLAIMER } from "@/lib/disclaimer";
import { localIsoDate } from "@/lib/local-date";
import { useLocale } from "@/i18n/LocaleProvider";

/** Core sport licenses shown on the competitor-style CA step 1. */
const CORE_LICENSE_IDS = new Set([
  "resident-sport-fishing-365-day",
  "nonresident-sport-fishing-365-day",
  "one-day-sport-fishing-license",
  "nonresident-one-day-sport-fishing-license",
  "two-day-sport-fishing-license",
  "ten-day-nonresident-sport-fishing-license",
]);

const SHORT_TERM_IDS = new Set([
  "one-day-sport-fishing-license",
  "nonresident-one-day-sport-fishing-license",
  "two-day-sport-fishing-license",
  "ten-day-nonresident-sport-fishing-license",
]);

const COUNTRIES = [
  "United States",
  "Canada",
  "Mexico",
  "United Kingdom",
  "Germany",
  "France",
  "Australia",
  "Japan",
  "Brazil",
  "India",
  "China",
  "South Korea",
  "Italy",
  "Spain",
  "Netherlands",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Switzerland",
  "Other",
];

const HAIR = ["Bald", "Black", "Blonde", "Brown", "Gray", "White", "Sandy", "Red/Auburn", "Other"];
const EYES = ["Blue", "Brown", "Green", "Pink", "Black", "Gray", "Hazel", "Other"];
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

type IdType = "state-id" | "passport" | "green-card" | "foreign-government-id";
type Step = 0 | 1 | 2;

type FormState = {
  residency: string;
  identityType: IdType | "";
  idCountry: string;
  stateIssued: string;
  idNumber: string;
  licenseId: string;
  licenseStartDate: string;
  firstName: string;
  middleName: string;
  lastName: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  address: string;
  city: string;
  zip: string;
  state: string;
  email: string;
  phone: string;
  gender: string;
  weight: string;
  hairColor: string;
  eyeColor: string;
  heightFt: string;
  heightIn: string;
  consent: boolean;
};

const INITIAL: FormState = {
  residency: "",
  identityType: "",
  idCountry: "United States",
  stateIssued: "",
  idNumber: "",
  licenseId: "",
  licenseStartDate: "",
  firstName: "",
  middleName: "",
  lastName: "",
  dobDay: "",
  dobMonth: "",
  dobYear: "",
  address: "",
  city: "",
  zip: "",
  state: "CA",
  email: "",
  phone: "",
  gender: "",
  weight: "",
  hairColor: "",
  eyeColor: "",
  heightFt: "",
  heightIn: "",
  consent: false,
};

function ChoiceGroup({
  label,
  required,
  columns = 3,
  children,
}: {
  label: string;
  required?: boolean;
  /** Equal-width columns matching competitor (residency = 3, ID types = 2). */
  columns?: 2 | 3;
  children: ReactNode;
}) {
  return (
    <div className="mt-6">
      <p className="text-sm font-semibold text-slate-800">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </p>
      <div
        className={
          columns === 2
            ? "mt-2 grid w-full grid-cols-2 gap-2"
            : "mt-2 grid w-full grid-cols-3 gap-2"
        }
      >
        {children}
      </div>
    </div>
  );
}

function ChoiceButton({
  selected,
  onClick,
  children,
  solid,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  solid?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full min-w-0 rounded border-2 px-3 py-2 text-center text-sm font-semibold transition-colors",
        selected
          ? solid
            ? "border-navy bg-navy text-white"
            : "border-navy bg-navy/10 text-navy"
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

const inputClass =
  "form-input w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-navy focus:ring-1 focus:ring-navy";

function shortLicenseLabel(lic: LicenseOption): string {
  if (lic.duration === "365-Day") return "365-Day Sport Fishing";
  if (lic.duration === "1-Day") return "1-Day";
  if (lic.duration === "2-Day") return "2-Day";
  if (lic.duration === "10-Day") return "10-Day";
  return lic.name;
}

type QualifyResult = {
  /** Residency value used for license pricing filters. */
  effective: string;
  /** Heading shown in the info box. */
  title: string;
  /** When true, show competitor-style “adjusted based on identification” note. */
  adjusted: boolean;
};

/**
 * Match competitor CA logic: ID type (and passport country) can override the
 * selected Primary Residence Type for pricing + the qualification banner.
 */
function resolveQualification(
  residency: string,
  identityType: IdType | "",
  idCountry: string,
): QualifyResult | null {
  if (!residency || !identityType) return null;

  let effective = residency;
  let adjusted = false;

  if (identityType === "passport") {
    if (idCountry === "United States") {
      // US passport → U.S. Resident tier (even if user picked CA Resident or International).
      if (residency !== "us-citizen") {
        effective = "us-citizen";
        adjusted = true;
      }
    } else if (residency !== "international") {
      effective = "international";
      adjusted = true;
    }
  } else if (identityType === "green-card" || identityType === "foreign-government-id") {
    if (residency !== "international") {
      effective = "international";
      adjusted = true;
    }
  } else if (identityType === "state-id") {
    // State ID keeps the user's residency selection (CA Resident stays resident).
    effective = residency;
  }

  const title =
    effective === "resident"
      ? "You qualify as a California Resident"
      : effective === "international"
        ? "You qualify as an International Customer"
        : "You qualify as a U.S. Resident (Non-California)";

  return { effective, title, adjusted };
}

function toPortalResidency(residency: string): "resident" | "nonresident" {
  return residencyPricingTier(residency) === "nonresident" ? "nonresident" : "resident";
}

/**
 * Competitor behavior: picking a Primary Residence Type auto-selects a default
 * Identification Type and opens its fields immediately.
 * - California Resident → State ID / DL (Issuing State = CA)
 * - U.S. Citizen → State ID / DL (Issuing State empty)
 * - International Customer → Passport
 */
function defaultsForResidency(residency: string): Partial<FormState> {
  if (residency === "resident") {
    return {
      residency,
      identityType: "state-id",
      idCountry: "United States",
      stateIssued: "CA",
      idNumber: "",
      licenseId: "",
      licenseStartDate: "",
      state: "CA",
    };
  }
  if (residency === "international") {
    return {
      residency,
      identityType: "passport",
      idCountry: "United States",
      stateIssued: "",
      idNumber: "",
      licenseId: "",
      licenseStartDate: "",
    };
  }
  // U.S. Citizen
  return {
    residency,
    identityType: "state-id",
    idCountry: "United States",
    stateIssued: "",
    idNumber: "",
    licenseId: "",
    licenseStartDate: "",
  };
}

function pad2(n: string | number) {
  return String(n).padStart(2, "0");
}

function monthIndex(name: string): number {
  return MONTHS.indexOf(name) + 1;
}

export function CaliforniaCompetitorApply({ config }: { config: StateConfig }) {
  const { t } = useLocale();
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<string[]>([]);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [conversionValue, setConversionValue] = useState(1);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [showConsentTerms, setShowConsentTerms] = useState(false);
  const applicationIdRef = useRef<string | null>(null);
  const promoCodeRef = useRef<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const qualification = useMemo(
    () => resolveQualification(form.residency, form.identityType, form.idCountry),
    [form.residency, form.identityType, form.idCountry],
  );
  const pricingResidency = qualification?.effective ?? form.residency;

  const licenses = useMemo(() => {
    return licensesForResidency(config, pricingResidency || undefined).filter((l) =>
      CORE_LICENSE_IDS.has(l.id),
    );
  }, [config, pricingResidency]);

  const annual = licenses.find((l) => l.duration === "365-Day");
  const shortTerm = licenses.filter((l) => SHORT_TERM_IDS.has(l.id));
  const selectedLicense = config.licenses.find((l) => l.id === form.licenseId);
  const total = form.licenseId ? computeOrderTotal(config, form.licenseId, []) : 0;

  function validateStep0(): string[] {
    const e: string[] = [];
    if (!form.residency) e.push("Select your primary residence type.");
    if (!form.identityType) e.push("Select an identification type.");
    if (form.identityType === "state-id") {
      if (!form.stateIssued) e.push("Select the issuing state.");
      if (!form.idNumber.trim()) e.push("Enter your ID / driver's license number.");
    }
    if (form.identityType === "passport") {
      if (!form.idCountry) e.push("Select passport country.");
      if (!form.idNumber.trim()) e.push("Enter your passport number.");
    }
    if (form.identityType === "green-card" && !form.idNumber.trim()) {
      e.push("Enter your green card number.");
    }
    if (form.identityType === "foreign-government-id" && !form.idNumber.trim()) {
      e.push("Enter your foreign government ID number.");
    }
    if (!form.licenseId) e.push("Select a license.");
    if (SHORT_TERM_IDS.has(form.licenseId) && !form.licenseStartDate) {
      e.push("Choose a license start date.");
    }
    return e;
  }

  function validateStep1(): string[] {
    const e: string[] = [];
    if (!form.firstName.trim()) e.push("First name is required.");
    if (!form.lastName.trim()) e.push("Last name is required.");
    if (!form.dobDay || !form.dobMonth || !form.dobYear) e.push("Date of birth is required.");
    if (!form.address.trim()) e.push("Street address is required.");
    if (!form.city.trim()) e.push("City is required.");
    if (!/^\d{5}(-\d{4})?$/.test(form.zip.trim())) e.push("Enter a valid ZIP code.");
    if (!form.email.trim() || !form.email.includes("@")) e.push("Email address is required.");
    if (!form.phone.trim()) e.push("Phone number is required.");
    if (!form.gender) e.push("Gender is required.");
    if (!form.weight || Number(form.weight) < 1) e.push("Weight is required.");
    if (!form.hairColor) e.push("Hair color is required.");
    if (!form.eyeColor) e.push("Eye color is required.");
    if (!form.heightFt || form.heightIn === "") e.push("Height is required.");
    if (!form.consent) e.push("Please confirm your information and agree to the terms.");
    return e;
  }

  function buildPayload(payment: TokenizedPayment) {
    const portalResidency = toPortalResidency(pricingResidency);
    const dob = `${pad2(monthIndex(form.dobMonth))}/${pad2(form.dobDay)}/${form.dobYear}`;
    const height = `${form.heightFt}' ${form.heightIn}"`;
    const data: Record<string, string | boolean | number> = {
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim(),
      lastName: form.lastName.trim(),
      dateOfBirth: dob,
      identityType: form.identityType,
      idNumber: form.idNumber.trim(),
      gender: form.gender,
      height,
      weight: Number(form.weight),
      eyeColor: form.eyeColor,
      hairColor: form.hairColor,
      residency: portalResidency,
      country: "us",
      address: form.address.trim(),
      zipCode: form.zip.trim(),
      city: form.city.trim(),
      state: form.residency === "resident" ? "CA" : form.state || "CA",
      phone: form.phone.trim(),
      email: form.email.trim(),
    };
    if (form.identityType === "state-id") data.stateIssued = form.stateIssued;
    if (form.identityType === "passport") data.countryIssued = form.idCountry;
    if (SHORT_TERM_IDS.has(form.licenseId)) data.licenseStartDate = form.licenseStartDate;

    return {
      stateSlug: config.slug,
      residency: pricingResidency,
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
      setPaymentError(json.message ?? "Something went wrong while submitting. Please try again.");
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
        <p className="mt-2 text-slate-600">{t("ca.received")}</p>
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

  const steps = [t("wizard.idLicense"), t("wizard.yourInformation"), t("wizard.payment")] as const;

  function residencyOptionLabel(value: string, fallback: string) {
    if (value === "resident") return t("ca.resident");
    if (value === "us-citizen") return t("ca.usCitizen");
    if (value === "international") return t("ca.international");
    return fallback;
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      {/* Progress */}
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
              <span className={`text-xs ${i <= step ? "font-medium text-slate-800" : "text-slate-400"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && <div className="mb-4 h-px w-10 bg-slate-200" />}
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

        {/* STEP 1 — ID & License */}
        {step === 0 && (
          <>
            <h2 className="text-center text-xl font-bold text-slate-900">
              {t("ca.step0Title")}
            </h2>
            <p className="mt-1 text-center text-sm text-slate-500">
              {t("ca.step0Sub")}
            </p>

            <ChoiceGroup label={t("ca.primaryResidence")} required>
              {config.residencyOptions.map((opt) => (
                <ChoiceButton
                  key={opt.value}
                  selected={form.residency === opt.value}
                  onClick={() => {
                    // Match competitor: residency pick auto-selects default ID + opens its form.
                    setForm((f) => ({ ...f, ...defaultsForResidency(opt.value) }));
                    setErrors([]);
                  }}
                >
                  {residencyOptionLabel(opt.value, opt.label)}
                </ChoiceButton>
              ))}
            </ChoiceGroup>

            <ChoiceGroup label={t("wizard.identificationType")} required columns={2}>
              {(
                [
                  ["state-id", "wizard.stateIdDrivers"],
                  ["passport", "wizard.passport"],
                  ["green-card", "wizard.greenCard"],
                  ["foreign-government-id", "wizard.foreignGovId"],
                ] as const
              ).map(([value, labelKey]) => (
                <ChoiceButton
                  key={value}
                  solid
                  selected={form.identityType === value}
                  onClick={() => {
                    setForm((f) => ({
                      ...f,
                      identityType: value,
                      idNumber: "",
                      licenseId: "",
                      licenseStartDate: "",
                      stateIssued:
                        value === "state-id" && f.residency === "resident" ? "CA" : value === "state-id" ? f.stateIssued : "",
                      idCountry: value === "passport" || value === "state-id" ? f.idCountry || "United States" : f.idCountry,
                    }));
                  }}
                >
                  {t(labelKey)}
                </ChoiceButton>
              ))}
            </ChoiceGroup>

            {form.identityType === "state-id" && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label={t("wizard.country")} required>
                  <select
                    className={inputClass}
                    value={form.idCountry}
                    onChange={(e) => set("idCountry", e.target.value)}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t("wizard.issuingState")} required>
                  <select
                    className={inputClass}
                    value={form.stateIssued}
                    onChange={(e) => set("stateIssued", e.target.value)}
                  >
                    <option value="">{t("wizard.selectIssuingState")}</option>
                    <option value="CA">CA — California</option>
                    <option disabled>──────────</option>
                    {/* Competitor parity: DC listed last, after the states. */}
                    {US_STATE_OPTIONS.filter((s) => s.value !== "CA" && s.value !== "DC").map(
                      (s) => (
                        <option key={s.value} value={s.value}>
                          {s.value}
                        </option>
                      ),
                    )}
                    <option value="DC">DC</option>
                  </select>
                </Field>
                <Field label={t("ca.idNumber")} required className="sm:col-span-2">
                  <input
                    className={inputClass}
                    placeholder={t("wizard.enterIdNumber")}
                    value={form.idNumber}
                    onChange={(e) => set("idNumber", e.target.value)}
                  />
                </Field>
              </div>
            )}

            {form.identityType === "passport" && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label={`${t("wizard.passport")} ${t("wizard.country")}`} required>
                  <select
                    className={inputClass}
                    value={form.idCountry}
                    onChange={(e) => {
                      set("idCountry", e.target.value);
                      set("licenseId", "");
                    }}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t("wizard.passport")} required>
                  <input
                    className={inputClass}
                    placeholder={t("wizard.enterIdNumber")}
                    value={form.idNumber}
                    onChange={(e) => set("idNumber", e.target.value)}
                  />
                </Field>
              </div>
            )}

            {form.identityType === "green-card" && (
              <div className="mt-4">
                <Field label={t("wizard.greenCard")} required>
                  <input
                    className={inputClass}
                    placeholder={t("wizard.enterIdNumber")}
                    value={form.idNumber}
                    onChange={(e) => set("idNumber", e.target.value)}
                  />
                </Field>
              </div>
            )}

            {form.identityType === "foreign-government-id" && (
              <div className="mt-4">
                <Field label={t("wizard.foreignGovId")} required>
                  <input
                    className={inputClass}
                    placeholder={t("wizard.enterIdNumber")}
                    value={form.idNumber}
                    onChange={(e) => set("idNumber", e.target.value)}
                  />
                </Field>
              </div>
            )}

            {qualification && (
              <div
                className={[
                  "mt-4 rounded border px-3 py-3 text-sm",
                  qualification.effective === "resident"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-slate-200 bg-slate-50 text-slate-800",
                ].join(" ")}
              >
                <p className="font-semibold">
                  {qualification.effective === "resident"
                    ? t("ca.qualifyResident")
                    : qualification.title}
                </p>
                {qualification.adjusted && (
                  <p className="mt-1 text-slate-600">
                    ⓘ Your residency has been adjusted based on the identification provided.
                  </p>
                )}
              </div>
            )}

            {form.residency && form.identityType && (
              <div className="mt-6">
                <h3 className="text-base font-bold text-slate-900">{t("ca.sportFishing")}</h3>
                {annual && (
                  <button
                    type="button"
                    onClick={() => {
                      set("licenseId", annual.id);
                      set("licenseStartDate", "");
                    }}
                    className={[
                      "mt-3 w-full rounded border px-4 py-4 text-left transition-colors",
                      form.licenseId === annual.id
                        ? "border-navy bg-navy/5 ring-1 ring-navy"
                        : "border-slate-200 bg-white hover:border-slate-300",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">365-Day Sport Fishing</p>
                        <p className="text-sm text-slate-500">Valid for 365 days</p>
                      </div>
                      <p className="text-lg font-bold text-navy">{formatPrice(displayPrice(annual.price))}</p>
                    </div>
                  </button>
                )}
                {shortTerm.length > 0 && (
                  <>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t("ca.shortTerm")}
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {shortTerm.map((lic) => (
                        <button
                          key={lic.id}
                          type="button"
                          onClick={() => {
                            set("licenseId", lic.id);
                            if (!form.licenseStartDate) {
                              set("licenseStartDate", localIsoDate());
                            }
                          }}
                          className={[
                            "rounded border px-4 py-3 text-left transition-colors",
                            form.licenseId === lic.id
                              ? "border-navy bg-navy/5 ring-1 ring-navy"
                              : "border-slate-200 bg-white hover:border-slate-300",
                          ].join(" ")}
                        >
                          <p className="font-semibold text-slate-900">{shortLicenseLabel(lic)}</p>
                          <p className="mt-1 font-bold text-navy">
                            {formatPrice(displayPrice(lic.price))}
                          </p>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {SHORT_TERM_IDS.has(form.licenseId) && (
              <LicenseStartDateField
                value={form.licenseStartDate}
                onChange={(v) => set("licenseStartDate", v)}
                inputClassName={inputClass}
              />
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
              {t("wizard.continue")}
            </button>
          </>
        )}

        {/* STEP 2 — Your Information */}
        {step === 1 && (
          <>
            <h2 className="text-center text-xl font-bold text-slate-900">
              {t("wizard.yourPersonalInformation")}
            </h2>
            <p className="mt-1 text-center text-sm text-slate-500">{t("ca.personalIntro")}</p>

            <div className="mt-4 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <span className="text-slate-500">{t("wizard.state")}</span>
              <p className="font-semibold text-slate-800">California</p>
            </div>

            <h3 className="mt-6 text-base font-bold text-slate-900">
              {t("wizard.personalInformation")}
            </h3>
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
            <div className="mt-3">
              <p className="mb-1 text-sm font-medium text-slate-700">
                {t("wizard.dob")} <span className="text-red-600">*</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
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
            </div>

            <h3 className="mt-6 text-base font-bold text-slate-900">
              {t("wizard.residentialAddress")}
            </h3>
            <div className="mt-3 grid gap-3">
              <Field label={t("wizard.street")} required>
                <input
                  className={inputClass}
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t("wizard.city")} required>
                  <input
                    className={inputClass}
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                  />
                </Field>
                <Field label={t("wizard.zipCode")} required>
                  <input
                    className={inputClass}
                    value={form.zip}
                    onChange={(e) => set("zip", e.target.value)}
                  />
                </Field>
              </div>
              {form.residency !== "resident" && (
                <Field label={t("wizard.state")} required>
                  <select
                    className={inputClass}
                    value={form.state}
                    onChange={(e) => set("state", e.target.value)}
                  >
                    <option value="">{t("wizard.selectState")}</option>
                    {US_STATE_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </div>

            <h3 className="mt-6 text-base font-bold text-slate-900">
              {t("wizard.contactInformation")}
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
                  type="tel"
                  className={inputClass}
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </Field>
            </div>

            <h3 className="mt-6 text-base font-bold text-slate-900">Physical description</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label={t("wizard.gender")} required>
                <select
                  className={inputClass}
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value)}
                >
                  <option value="">{t("wizard.selectGender")}</option>
                  <option value="male">{t("wizard.male")}</option>
                  <option value="female">{t("wizard.female")}</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label={t("wizard.weight")} required>
                <input
                  type="number"
                  min={1}
                  className={inputClass}
                  placeholder="e.g. 170"
                  value={form.weight}
                  onChange={(e) => set("weight", e.target.value)}
                />
              </Field>
              <Field label="Hair color" required>
                <select
                  className={inputClass}
                  value={form.hairColor}
                  onChange={(e) => set("hairColor", e.target.value)}
                >
                  <option value="">Select</option>
                  {HAIR.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Eye color" required>
                <select
                  className={inputClass}
                  value={form.eyeColor}
                  onChange={(e) => set("eyeColor", e.target.value)}
                >
                  <option value="">Select</option>
                  {EYES.map((eye) => (
                    <option key={eye} value={eye}>
                      {eye}
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
                    <option value="">{t("wizard.heightFt")}</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={String(n)}>
                        {n} ft
                      </option>
                    ))}
                  </select>
                  <select
                    className={inputClass}
                    value={form.heightIn}
                    onChange={(e) => set("heightIn", e.target.value)}
                  >
                    <option value="">{t("wizard.heightIn")}</option>
                    {Array.from({ length: 12 }, (_, i) => String(i)).map((n) => (
                      <option key={n} value={n}>
                        {n} in
                      </option>
                    ))}
                  </select>
                </div>
              </Field>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                {t("wizard.declarationConsent")}
              </h2>
              <div className="mt-3 flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={form.consent}
                  onChange={(e) => set("consent", e.target.checked)}
                  id="ca-consent"
                />
                <div className="min-w-0 flex-1">
                  <label htmlFor="ca-consent" className="cursor-pointer">
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
                        all terms and policies associated with the California fishing license as
                        outlined on the California Department of Fish and Wildlife (CDFW) website.
                      </p>
                      <p className="mt-2">
                        I hereby authorize AnglerPermit to act on my behalf in submitting my
                        California fishing license application. I acknowledge and accept that once
                        AnglerPermit has completed the application process on my behalf, this
                        transaction is non-refundable.
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
                className="rounded border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
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
                {t("wizard.completeOrder")}
              </button>
            </div>
          </>
        )}

        {/* STEP 3 — Payment */}
        {step === 2 && (
          <>
            <h2 className="mb-4 text-center text-xl font-bold text-slate-900">
              Complete your payment
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
                      name: (() => {
                        const short = shortLicenseLabel(selectedLicense);
                        return short.includes("Sport Fishing")
                          ? short
                          : `${short} Sport Fishing`;
                      })(),
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

      <p className="mt-6 text-center text-xs leading-relaxed text-slate-500">
        {NON_AFFILIATION_DISCLAIMER}
      </p>
    </div>
  );
}
