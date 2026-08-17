"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import type { LicenseOption, StateConfig, TokenizedPayment } from "@/lib/state-config";
import { computeOrderTotal, displayPrice } from "@/lib/state-config";
import { US_STATE_OPTIONS } from "@/lib/us-states";
import { formatPrice } from "@/lib/format";
import { PaymentStep } from "@/components/PaymentStep";
import { PurchaseConversionBeacon } from "@/components/PurchaseConversionBeacon";
import { LicenseStartDateField } from "@/components/LicenseStartDateField";
import { NON_AFFILIATION_DISCLAIMER } from "@/lib/disclaimer";
import { isoToMmDdYyyy, localIsoDate } from "@/lib/local-date";
import { useLocale } from "@/i18n/LocaleProvider";

const RESIDENT_LICENSE_IDS = [
  "daily-all-species",
  "annual-all-species-resident",
  "hunt-fish-combo-resident",
] as const;

const ANNUAL_NONRESIDENT_IDS = [
  "annual-all-species-nonresident",
  "hunt-fish-combo-nonresident",
] as const;

const SHORT_TERM_IDS = [
  "daily-all-species",
  "nonresident-2-day-all-species",
  "nonresident-3-day-all-species",
  "nonresident-4-day-all-species",
  "nonresident-5-day-all-species",
  "nonresident-6-day-all-species",
  "nonresident-7-day-all-species",
  "nonresident-8-day-all-species",
  "nonresident-9-day-all-species",
] as const;

const SHORT_TERM_ID_SET = new Set<string>(SHORT_TERM_IDS);

const LICENSE_LABELS: Record<string, string> = {
  "daily-all-species": "1-Day Fishing License",
  "annual-all-species-resident": "Fish All Species 2026",
  "hunt-fish-combo-resident": "Hunt & Fish Combination License",
  "annual-all-species-nonresident": "Fish All Species 2026",
  "hunt-fish-combo-nonresident": "Hunt & Fish Combination License",
  "nonresident-2-day-all-species": "2-Day",
  "nonresident-3-day-all-species": "3-Day",
  "nonresident-4-day-all-species": "4-Day",
  "nonresident-5-day-all-species": "5-Day",
  "nonresident-6-day-all-species": "6-Day",
  "nonresident-7-day-all-species": "7-Day",
  "nonresident-8-day-all-species": "8-Day",
  "nonresident-9-day-all-species": "9-Day",
};

/** Short-term card title on nonresident path matches competitor (1-Day … 9-Day). */
const SHORT_TERM_LABELS: Record<string, string> = {
  "daily-all-species": "1-Day",
  "nonresident-2-day-all-species": "2-Day",
  "nonresident-3-day-all-species": "3-Day",
  "nonresident-4-day-all-species": "4-Day",
  "nonresident-5-day-all-species": "5-Day",
  "nonresident-6-day-all-species": "6-Day",
  "nonresident-7-day-all-species": "7-Day",
  "nonresident-8-day-all-species": "8-Day",
  "nonresident-9-day-all-species": "9-Day",
};

const LICENSE_SUB: Record<string, string> = {
  "daily-all-species": "Valid for selected date",
  "annual-all-species-resident": "Valid to 03/31/2027",
  "hunt-fish-combo-resident": "Valid to 03/31/2027",
  "annual-all-species-nonresident": "Valid to 03/31/2027",
  "hunt-fish-combo-nonresident": "Valid to 03/31/2027",
};

const ID_COUNTRIES = [
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

/** Competitor issuing-state order: MI pinned first with separator, DC last. */
const MI_ISSUING_STATE_OPTIONS = [
  ...US_STATE_OPTIONS.filter((s) => s.value === "MI"),
  ...US_STATE_OPTIONS.filter((s) => s.value !== "MI" && s.value !== "DC"),
  ...US_STATE_OPTIONS.filter((s) => s.value === "DC"),
];

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

type IdKind = "drivers-license" | "personal-id";
type Step = 0 | 1 | 2;

type FormState = {
  residency: string;
  idKind: IdKind | "";
  idNumber: string;
  idCountry: string;
  issuingState: string;
  licenseId: string;
  licenseStartDate: string;
  firstName: string;
  middleName: string;
  lastName: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  email: string;
  phone: string;
  gender: string;
  heightFt: string;
  heightIn: string;
  weightPounds: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  consent: boolean;
};

const INITIAL: FormState = {
  residency: "",
  idKind: "",
  idNumber: "",
  idCountry: "United States",
  issuingState: "MI",
  licenseId: "",
  licenseStartDate: "",
  firstName: "",
  middleName: "",
  lastName: "",
  dobDay: "",
  dobMonth: "",
  dobYear: "",
  email: "",
  phone: "",
  gender: "",
  heightFt: "",
  heightIn: "",
  weightPounds: "",
  street: "",
  city: "",
  state: "MI",
  zip: "",
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

function toMiStateName(code: string): string {
  const opt = US_STATE_OPTIONS.find((s) => s.value === code);
  return (opt?.label ?? "Michigan").toUpperCase();
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
        "min-w-0 flex-1 rounded border-2 px-3 py-3 text-center text-sm font-semibold transition-colors",
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

function licenseLabel(lic: LicenseOption, shortTerm = false): string {
  if (shortTerm) return SHORT_TERM_LABELS[lic.id] ?? LICENSE_LABELS[lic.id] ?? lic.name;
  return LICENSE_LABELS[lic.id] ?? lic.name;
}

function LicenseCard({
  lic,
  selected,
  onSelect,
  shortTerm = false,
}: {
  lic: LicenseOption;
  selected: boolean;
  onSelect: () => void;
  shortTerm?: boolean;
}) {
  const price = displayPrice(lic.price);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "flex w-full items-center justify-between gap-3 rounded border px-3 py-3 text-left text-sm transition-colors",
        selected
          ? "border-navy bg-navy/5 ring-1 ring-navy"
          : "border-slate-200 bg-white hover:border-slate-300",
      ].join(" ")}
    >
      <span>
        <span className="block font-medium text-slate-800">
          {licenseLabel(lic, shortTerm)}
        </span>
        {!shortTerm && LICENSE_SUB[lic.id] && (
          <span className="block text-xs text-slate-500">{LICENSE_SUB[lic.id]}</span>
        )}
      </span>
      <span className="shrink-0 font-bold text-navy">{formatPrice(price)}</span>
    </button>
  );
}

export function MichiganCompetitorApply({ config }: { config: StateConfig }) {
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

  const isResident = form.residency === "resident";

  const residentLicenses = useMemo(() => {
    if (!isResident) return [] as LicenseOption[];
    return RESIDENT_LICENSE_IDS.map((id) => config.licenses.find((l) => l.id === id)).filter(
      (l): l is LicenseOption => Boolean(l),
    );
  }, [config.licenses, isResident]);

  const annualNonresidentLicenses = useMemo(() => {
    if (isResident || !form.residency) return [] as LicenseOption[];
    return ANNUAL_NONRESIDENT_IDS.map((id) => config.licenses.find((l) => l.id === id)).filter(
      (l): l is LicenseOption => Boolean(l),
    );
  }, [config.licenses, form.residency, isResident]);

  const shortTermLicenses = useMemo(() => {
    if (isResident || !form.residency) return [] as LicenseOption[];
    return SHORT_TERM_IDS.map((id) => config.licenses.find((l) => l.id === id)).filter(
      (l): l is LicenseOption => Boolean(l),
    );
  }, [config.licenses, form.residency, isResident]);

  const selectedLicense = config.licenses.find((l) => l.id === form.licenseId);
  const total = form.licenseId ? computeOrderTotal(config, form.licenseId, []) : 0;
  const isShortTerm = SHORT_TERM_ID_SET.has(form.licenseId);

  function selectResidency(value: string) {
    setForm((f) => ({
      ...f,
      residency: value,
      licenseId: "",
      licenseStartDate: "",
      idCountry: value === "nonresident" ? f.idCountry || "United States" : "United States",
      issuingState: value === "resident" ? "MI" : f.issuingState === "MI" ? "" : f.issuingState,
      state: value === "resident" ? "MI" : f.state || "MI",
      // Competitor leaves ID type unset until the user picks; label defaults to Personal ID Number.
      idKind: f.idKind,
    }));
    setErrors([]);
  }

  function validateStep0(): string[] {
    const e: string[] = [];
    if (!form.residency) e.push("Select whether you are a Michigan resident.");
    if (!form.idKind) e.push("Select an identification type.");
    if (!form.idNumber.trim()) e.push("Enter your identification number.");
    if (!isResident && !form.idCountry) e.push("Select the issuing country.");
    if (!form.issuingState) e.push("Select the issuing state.");
    if (!form.licenseId) e.push("Select a license.");
    if (isShortTerm && !form.licenseStartDate) {
      e.push("Choose a license start date.");
    }
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
    if (!form.weightPounds.trim() || Number(form.weightPounds) < 1) {
      e.push("Weight is required.");
    }
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

  function genderToPortal(g: string): string {
    if (g === "male") return "MALE";
    if (g === "female") return "FEMALE";
    if (g === "non-binary") return "NON-BINARY";
    return "OTHER";
  }

  function buildPayload(payment: TokenizedPayment) {
    const dob = `${pad2(monthIndex(form.dobMonth))}/${pad2(form.dobDay)}/${form.dobYear}`;
    const data: Record<string, string | boolean | number> = {
      idType: "Driver's License/State ID",
      idNumber: form.idNumber.trim(),
      driversLicenseState: toMiStateName(form.issuingState),
      idCountry: form.idCountry,
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim(),
      lastName: form.lastName.trim(),
      dateOfBirth: dob,
      gender: genderToPortal(form.gender),
      heightFt: form.heightFt,
      heightIn: form.heightIn,
      weightPounds: Number(form.weightPounds),
      email: form.email.trim(),
      primaryPhone: form.phone.trim() ? formatPhone(form.phone) : "",
      resStreet1: form.street.trim(),
      resCity: form.city.trim(),
      resState: toMiStateName(form.state || (isResident ? "MI" : form.issuingState || "MI")),
      resZip: form.zip.trim(),
      resCountry:
        !isResident && form.idCountry && form.idCountry !== "United States"
          ? form.idCountry.toUpperCase()
          : "UNITED STATES",
      michiganResident: isResident ? "Yes" : "No",
    };
    if (isShortTerm && form.licenseStartDate) {
      data.licenseStartDate = isoToMmDdYyyy(form.licenseStartDate);
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
          Thank you — your Michigan fishing license application and payment have been received.
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
    t("wizard.idLicense"),
    t("wizard.applicantInfo"),
    t("wizard.payment"),
  ] as const;
  // Competitor defaults the label to Personal ID Number until Driver's License is selected.
  const idNumberLabel =
    form.idKind === "drivers-license" ? "Driver's License Number" : "Personal ID Number";

  const miResidencyLabel = (value: string) => {
    if (value === "resident") return t("mi.yesResident");
    if (value === "nonresident") return t("mi.noNonResident");
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
            <h2 className="text-xl font-bold text-slate-900">{t("mi.step0Title")}</h2>
            <p className="mt-1 text-sm text-slate-500">{t("mi.step0Sub")}</p>

            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-800">
                {t("mi.areYouResident")} <span className="text-red-600">*</span>
              </p>
              <div className="mt-2 flex w-full flex-row gap-2">
                {config.residencyOptions.map((opt) => (
                  <ChoiceButton
                    key={opt.value}
                    selected={form.residency === opt.value}
                    onClick={() => selectResidency(opt.value)}
                  >
                    {miResidencyLabel(opt.value)}
                  </ChoiceButton>
                ))}
              </div>
            </div>

            {form.residency && (
              <>
                <div className="mt-6">
                  <p className="text-sm font-semibold text-slate-800">
                    {t("wizard.idType")} <span className="text-red-600">*</span>
                  </p>
                  <div className="mt-2 flex w-full flex-row gap-2">
                    <ChoiceButton
                      selected={form.idKind === "drivers-license"}
                      onClick={() => set("idKind", "drivers-license")}
                    >
                      {t("wizard.driversLicense")}
                    </ChoiceButton>
                    <ChoiceButton
                      selected={form.idKind === "personal-id"}
                      onClick={() => set("idKind", "personal-id")}
                    >
                      {t("wizard.personalId")}
                    </ChoiceButton>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  <Field label={idNumberLabel} required>
                    <input
                      className={inputClass}
                      placeholder={t("wizard.enterIdNumber")}
                      value={form.idNumber}
                      onChange={(e) => set("idNumber", e.target.value)}
                    />
                  </Field>
                  {!isResident && (
                    <Field label={t("wizard.country")} required>
                      <select
                        className={inputClass}
                        value={form.idCountry}
                        onChange={(e) => set("idCountry", e.target.value)}
                      >
                        {ID_COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                  <Field label={t("wizard.issuingState")} required>
                    <select
                      className={inputClass}
                      value={form.issuingState}
                      onChange={(e) => set("issuingState", e.target.value)}
                    >
                      <option value="">{t("wizard.selectIssuingState")}</option>
                      <option value="MI">MI — Michigan</option>
                      <option disabled>──────────</option>
                      {MI_ISSUING_STATE_OPTIONS.filter((s) => s.value !== "MI").map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.value}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div
                  className={[
                    "mt-4 rounded border px-3 py-2 text-sm",
                    isResident
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-amber-200 bg-amber-50 text-amber-900",
                  ].join(" ")}
                >
                  {isResident
                    ? t("mi.residentBanner")
                    : "You are a Non-Resident of Michigan"}
                </div>

                {isResident && residentLicenses.length > 0 && (
                  <>
                    <SectionHeading>{t("wizard.fishingLicenses")}</SectionHeading>
                    <div className="mt-3 space-y-2">
                      {residentLicenses.map((lic) => (
                        <LicenseCard
                          key={lic.id}
                          lic={lic}
                          selected={form.licenseId === lic.id}
                          onSelect={() => {
                            setForm((f) => ({
                              ...f,
                              licenseId: lic.id,
                              licenseStartDate: SHORT_TERM_ID_SET.has(lic.id)
                                ? f.licenseStartDate || localIsoDate()
                                : "",
                            }));
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}

                {!isResident && annualNonresidentLicenses.length > 0 && (
                  <>
                    <SectionHeading>{t("wizard.fishingLicenses")}</SectionHeading>
                    <div className="mt-3 space-y-2">
                      {annualNonresidentLicenses.map((lic) => (
                        <LicenseCard
                          key={lic.id}
                          lic={lic}
                          selected={form.licenseId === lic.id}
                          onSelect={() =>
                            setForm((f) => ({ ...f, licenseId: lic.id, licenseStartDate: "" }))
                          }
                        />
                      ))}
                    </div>
                    <SectionHeading>{t("wizard.shortTermLicenses")}</SectionHeading>
                    <div className="mt-3 space-y-2">
                      {shortTermLicenses.map((lic) => (
                        <LicenseCard
                          key={lic.id}
                          lic={lic}
                          shortTerm
                          selected={form.licenseId === lic.id}
                          onSelect={() =>
                            setForm((f) => ({
                              ...f,
                              licenseId: lic.id,
                              licenseStartDate: f.licenseStartDate || localIsoDate(),
                            }))
                          }
                        />
                      ))}
                    </div>
                  </>
                )}

                {isShortTerm && (
                  <LicenseStartDateField
                    value={form.licenseStartDate}
                    onChange={(v) => set("licenseStartDate", v)}
                    inputClassName={inputClass}
                  />
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
              {t("wizard.continueShort")}
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-xl font-bold text-slate-900">{t("wizard.applicantInfo")}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Provide your personal details and demographics.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
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

            <Field label={t("wizard.dob")} required className="mt-3">
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

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label={t("wizard.email")} required>
                <input
                  className={inputClass}
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
              <Field label={t("wizard.phone")}>
                <input
                  className={inputClass}
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </Field>
            </div>

            <SectionHeading>{t("wizard.demographics")}</SectionHeading>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label={t("wizard.gender")} required className="sm:col-span-2">
                <select
                  className={inputClass}
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value)}
                >
                  <option value="">{t("wizard.selectGender")}</option>
                  <option value="male">{t("wizard.male")}</option>
                  <option value="female">{t("wizard.female")}</option>
                  <option value="non-binary">{t("wizard.nonBinary")}</option>
                  <option value="prefer-not">{t("wizard.preferNot")}</option>
                </select>
              </Field>
              <Field label={t("wizard.heightFt")} required>
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
              <Field label={t("wizard.heightIn")} required>
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
              <Field label={t("wizard.weight")} required className="sm:col-span-2">
                <input
                  className={inputClass}
                  type="number"
                  min={1}
                  max={999}
                  inputMode="numeric"
                  value={form.weightPounds}
                  onChange={(e) => set("weightPounds", digitsOnly(e.target.value).slice(0, 3))}
                />
              </Field>
            </div>

            <SectionHeading>{t("wizard.residentialAddress")}</SectionHeading>
            <div className="mt-3 grid gap-3">
              <Field label={t("wizard.street")} required>
                <input
                  className={inputClass}
                  value={form.street}
                  onChange={(e) => set("street", e.target.value)}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label={t("wizard.city")} required>
                  <input
                    className={inputClass}
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                  />
                </Field>
                <Field label={t("wizard.state")} required>
                  <select
                    className={inputClass}
                    value={form.state}
                    onChange={(e) => set("state", e.target.value)}
                  >
                    <option value="">{t("wizard.selectState")}</option>
                    {MI_ISSUING_STATE_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.value === "MI" ? "MI — Michigan" : s.value}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t("wizard.zip")} required>
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
                  {t("wizard.consent")} <span className="text-red-600">*</span>{" "}
                  <button
                    type="button"
                    className="font-semibold text-navy underline"
                    onClick={() => setShowConsentTerms((v) => !v)}
                  >
                    {showConsentTerms ? t("wizard.showLess") : t("wizard.readMore")}
                  </button>
                </span>
              </label>
              {showConsentTerms && (
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  {NON_AFFILIATION_DISCLAIMER} By submitting, you authorize AnglerPermit to assist
                  with your Michigan fishing license application and to process payment for the
                  selected license.
                </p>
              )}
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                className="rounded border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setStep(0);
                  setErrors([]);
                }}
              >
                {t("wizard.backShort")}
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

        {step === 2 && selectedLicense && (
          <>
            <h2 className="text-xl font-bold text-slate-900">{t("wizard.payment")}</h2>
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
                {t("wizard.backShort")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
