"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { LicenseOption, StateConfig, TokenizedPayment } from "@/lib/state-config";
import { computeOrderTotal, displayPrice } from "@/lib/state-config";
import { US_STATE_OPTIONS } from "@/lib/us-states";
import { formatPrice } from "@/lib/format";
import { PaymentStep } from "@/components/PaymentStep";
import { PurchaseConversionBeacon } from "@/components/PurchaseConversionBeacon";
import { LicenseStartDateField } from "@/components/LicenseStartDateField";
import { isoToMmDdYyyy, localIsoDate } from "@/lib/local-date";
import { useLocale } from "@/i18n/LocaleProvider";
import { DlUploadFields } from "@/components/DlUploadFields";
import { EMPTY_DL_UPLOAD, mergeDlUploads } from "@/lib/dl-upload";

const RESIDENT_ANNUAL_IDS = [
  "resident-annual-fishing",
  "small-game-fishing-combo",
] as const;
const RESIDENT_SHORT_IDS = ["one-day-fishing-resident"] as const;
const NONRESIDENT_ANNUAL_IDS = ["nonresident-annual-fishing"] as const;
const NONRESIDENT_SHORT_IDS = [
  "one-day-fishing-nonresident",
  "five-day-fishing-nonresident",
] as const;

const SHORT_TERM_IDS = new Set<string>([
  ...RESIDENT_SHORT_IDS,
  ...NONRESIDENT_SHORT_IDS,
  "additional-day-fishing",
]);

const LICENSE_LABELS: Record<string, string> = {
  "resident-annual-fishing": "Adult Annual Fishing",
  "small-game-fishing-combo": "Small Game & Fishing Combo",
  "one-day-fishing-resident": "1-Day Fishing",
  "nonresident-annual-fishing": "Nonresident Annual Fishing",
  "one-day-fishing-nonresident": "1-Day Fishing",
  "five-day-fishing-nonresident": "5-Day Fishing",
};

const LICENSE_SUB: Record<string, string> = {
  "resident-annual-fishing": "Valid March 1 – March 31 (13 months)",
  "small-game-fishing-combo": "Annual combo · small game + fishing",
  "one-day-fishing-resident": "Valid for 1 day",
  "nonresident-annual-fishing": "Valid March 1 – March 31 (13 months)",
  "one-day-fishing-nonresident": "Valid for 1 day",
  "five-day-fishing-nonresident": "Valid for 5 consecutive days",
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

const CO_STATE_OPTIONS = [
  ...US_STATE_OPTIONS.filter((s) => s.value === "CO"),
  ...US_STATE_OPTIONS.filter((s) => s.value !== "CO" && s.value !== "DC"),
  ...US_STATE_OPTIONS.filter((s) => s.value === "DC"),
];

type IdKind = "drivers-license" | "state-id";
type Step = 0 | 1 | 2;

type FormState = {
  residency: "" | "resident" | "nonresident";
  idKind: IdKind | "";
  idNumber: string;
  issuingState: string;
  ssn: string;
  licenseId: string;
  licenseStartDate: string;
  secondRod: boolean;
  firstName: string;
  middleInitial: string;
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
  consent: boolean;
  dlFrontName: string;
  dlFrontData: string;
  dlBackName: string;
  dlBackData: string;
};

const INITIAL: FormState = {
  residency: "",
  idKind: "",
  idNumber: "",
  issuingState: "CO",
  ssn: "",
  licenseId: "",
  licenseStartDate: "",
  secondRod: false,
  firstName: "",
  middleInitial: "",
  lastName: "",
  dobDay: "",
  dobMonth: "",
  dobYear: "",
  street: "",
  city: "",
  state: "CO",
  zip: "",
  email: "",
  phone: "",
  consent: false,
  ...EMPTY_DL_UPLOAD,
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
  const d = digitsOnly(raw);
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return raw.trim();
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
  className = "",
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
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
        className,
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

function LicenseCard({
  lic,
  selected,
  onSelect,
}: {
  lic: LicenseOption;
  selected: boolean;
  onSelect: () => void;
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
          {LICENSE_LABELS[lic.id] ?? lic.name}
        </span>
        {LICENSE_SUB[lic.id] && (
          <span className="block text-xs text-slate-500">{LICENSE_SUB[lic.id]}</span>
        )}
      </span>
      <span className="shrink-0 font-bold text-navy">{formatPrice(price)}</span>
    </button>
  );
}

export function ColoradoCompetitorApply({ config }: { config: StateConfig }) {
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

  const isResident = form.residency === "resident";

  const annualLicenses = useMemo(() => {
    if (!form.residency) return [] as LicenseOption[];
    const ids = isResident ? RESIDENT_ANNUAL_IDS : NONRESIDENT_ANNUAL_IDS;
    return ids
      .map((id) => config.licenses.find((l) => l.id === id))
      .filter((l): l is LicenseOption => Boolean(l));
  }, [config.licenses, form.residency, isResident]);

  const shortTermLicenses = useMemo(() => {
    if (!form.residency) return [] as LicenseOption[];
    const ids = isResident ? RESIDENT_SHORT_IDS : NONRESIDENT_SHORT_IDS;
    return ids
      .map((id) => config.licenses.find((l) => l.id === id))
      .filter((l): l is LicenseOption => Boolean(l));
  }, [config.licenses, form.residency, isResident]);

  const selectedLicense = config.licenses.find((l) => l.id === form.licenseId);
  const addOnIds = form.secondRod ? ["second-rod-stamp"] : [];
  const total = form.licenseId
    ? computeOrderTotal(config, form.licenseId, addOnIds)
    : 0;
  const habitat = config.addOns.find((a) => a.id === "habitat-stamp");
  const secondRod = config.addOns.find((a) => a.id === "second-rod-stamp");
  const needsStartDate = SHORT_TERM_IDS.has(form.licenseId);

  function selectResidency(value: "resident" | "nonresident") {
    setForm((f) => ({
      ...f,
      residency: value,
      licenseId: "",
      licenseStartDate: "",
      issuingState: value === "resident" ? "CO" : "",
      state: value === "resident" ? "CO" : f.state,
    }));
    setErrors([]);
  }

  function validateStep0(): string[] {
    const e: string[] = [];
    if (!form.residency) e.push("Select whether you are a Colorado resident.");
    if (!form.idKind) e.push("Select an ID type.");
    if (!form.idNumber.trim()) e.push("Identification number is required.");
    if (!form.issuingState) e.push("ID issuing state is required.");
    if (digitsOnly(form.ssn).length !== 9) e.push("Enter a valid Social Security number.");
    if (!form.licenseId) e.push("Select a license.");
    if (needsStartDate && !form.licenseStartDate) {
      e.push("Choose a license start date.");
    }
    return e;
  }

  function validateStep1(): string[] {
    const e: string[] = [];
    if (!form.firstName.trim()) e.push("First legal name is required.");
    if (!form.lastName.trim()) e.push("Last legal name is required.");
    if (!form.dobDay || !form.dobMonth || !form.dobYear) e.push("Date of birth is required.");
    if (!form.street.trim()) e.push("Mailing address is required.");
    if (!form.city.trim()) e.push("City is required.");
    if (!form.state) e.push("State is required.");
    if (!/^\d{5}(-\d{4})?$/.test(form.zip.trim())) e.push("Enter a valid ZIP code.");
    if (!form.email.trim() || !form.email.includes("@")) e.push("Email is required.");
    if (!digitsOnly(form.phone)) e.push("Phone number is required.");
    if (!form.consent) e.push("Please confirm your information and agree to the terms.");
    return e;
  }

  function buildPayload(payment: TokenizedPayment) {
    const dateOfBirth = `${pad2(monthIndex(form.dobMonth))}/${pad2(form.dobDay)}/${form.dobYear}`;
    const data: Record<string, string | boolean | number> = {
      firstName: form.firstName.trim(),
      middleInitial: form.middleInitial.trim().slice(0, 1),
      lastName: form.lastName.trim(),
      dateOfBirth,
      email: form.email.trim(),
      addressLine1: form.street.trim(),
      city: form.city.trim(),
      state: form.state,
      zipCode: form.zip.trim(),
      phone: formatPhone(form.phone),
      identificationType: form.idKind,
      identificationNumber: form.idNumber.trim(),
      identificationState: form.issuingState,
      ssn: digitsOnly(form.ssn),
      residencyDeclaration: form.residency,
    };
    mergeDlUploads(data, form);

    if (needsStartDate && form.licenseStartDate) {
      data.licenseStartDate = isoToMmDdYyyy(form.licenseStartDate);
    }

    return {
      stateSlug: config.slug,
      residency: form.residency,
      licenseId: form.licenseId,
      addOnIds,
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
          Thank you — your Colorado fishing license application and payment have been received.
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
    t("wizard.residencyLicense"),
    t("wizard.yourInformation"),
    t("wizard.payment"),
  ] as const;

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
            <h2 className="text-xl font-bold text-slate-900">{t("co.step0Title")}</h2>
            <p className="mt-1 text-sm text-slate-500">{t("co.step0Sub")}</p>

            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-800">
                {t("co.areYouResident")} <span className="text-red-600">*</span>
              </p>
              <div className="mt-2 flex w-full flex-row gap-2">
                <ChoiceButton
                  className="flex-1"
                  selected={form.residency === "resident"}
                  onClick={() => selectResidency("resident")}
                >
                  {t("tx.yes")}
                </ChoiceButton>
                <ChoiceButton
                  className="flex-1"
                  selected={form.residency === "nonresident"}
                  onClick={() => selectResidency("nonresident")}
                >
                  {t("tx.no")}
                </ChoiceButton>
              </div>
              <p className="mt-3 text-sm text-slate-500">
                Colorado residents generally need a Colorado driver&apos;s license or ID issued at
                least six months prior (or two additional proofs of residency). Youth 15 and under
                fish free.
              </p>
            </div>

            {form.residency && (
              <>
                <div className="mt-6">
                  <p className="text-sm font-semibold text-slate-800">
                    {t("wizard.idType")} <span className="text-red-600">*</span>
                  </p>
                  <div className="mt-2 flex w-full flex-row gap-2">
                    <ChoiceButton
                      className="flex-1"
                      selected={form.idKind === "drivers-license"}
                      onClick={() => set("idKind", "drivers-license")}
                    >
                      {t("wizard.driversLicense")}
                    </ChoiceButton>
                    <ChoiceButton
                      className="flex-1"
                      selected={form.idKind === "state-id"}
                      onClick={() => set("idKind", "state-id")}
                    >
                      {t("wizard.personalId")}
                    </ChoiceButton>
                  </div>
                </div>

                {form.idKind && (
                  <div className="mt-4 grid gap-3">
                    <Field label="Identification Number" required>
                      <input
                        className={inputClass}
                        placeholder={t("wizard.enterIdNumber")}
                        value={form.idNumber}
                        onChange={(e) => set("idNumber", e.target.value)}
                      />
                    </Field>
                    <Field label={t("wizard.issuingState")} required>
                      <select
                        className={inputClass}
                        value={form.issuingState}
                        onChange={(e) => set("issuingState", e.target.value)}
                      >
                        <option value="">{t("wizard.selectIssuingState")}</option>
                        {CO_STATE_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.value === "CO" ? "CO — Colorado" : s.value}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label={t("wizard.ssn")} required>
                      <input
                        className={inputClass}
                        placeholder="XXX-XX-XXXX"
                        inputMode="numeric"
                        value={formatSsnDisplay(form.ssn)}
                        onChange={(e) => set("ssn", digitsOnly(e.target.value))}
                      />
                    </Field>
                    <DlUploadFields
                      value={form}
                      onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
                      onError={(msg) => setErrors([msg])}
                    />
                    <div
                      className={[
                        "rounded border px-3 py-2 text-sm",
                        isResident
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-amber-200 bg-amber-50 text-amber-900",
                      ].join(" ")}
                    >
                      {isResident ? t("co.residentBanner") : t("co.nonResidentBanner")}
                    </div>
                  </div>
                )}

                {form.idKind && annualLicenses.length > 0 && (
                  <>
                    <SectionHeading>{t("wizard.fishingLicenses")}</SectionHeading>
                    <div className="mt-3 space-y-2">
                      {annualLicenses.map((lic) => (
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
                  </>
                )}

                {form.idKind && shortTermLicenses.length > 0 && (
                  <>
                    <SectionHeading>{t("wizard.shortTermLicenses")}</SectionHeading>
                    <div className="mt-3 space-y-2">
                      {shortTermLicenses.map((lic) => (
                        <LicenseCard
                          key={lic.id}
                          lic={lic}
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

                {needsStartDate && (
                  <LicenseStartDateField
                    value={form.licenseStartDate}
                    onChange={(v) => set("licenseStartDate", v)}
                    inputClassName={inputClass}
                  />
                )}

                {form.licenseId && habitat && (
                  <div className="mt-4 rounded border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">
                      Annual Habitat Stamp ({formatPrice(displayPrice(habitat.price))})
                    </span>{" "}
                    is included when applicable — required for ages 18–64 on most license purchases.
                  </div>
                )}

                {form.licenseId && secondRod && (
                  <label className="mt-4 flex items-start gap-2 rounded border border-slate-200 px-3 py-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={form.secondRod}
                      onChange={(e) => set("secondRod", e.target.checked)}
                    />
                    <span>
                      <span className="font-semibold text-slate-800">
                        Add Second-rod Stamp ({formatPrice(displayPrice(secondRod.price))})
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        Allows fishing with a second rod. Does not increase bag limits.
                      </span>
                    </span>
                  </label>
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
              {t("wizard.continue")}
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-xl font-bold text-slate-900">
              {t("wizard.yourPersonalInformation")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Please provide us with some personal information — this is essential for your CO
              Fishing License guidance.
            </p>
            <p className="mt-4 text-sm text-slate-600">
              {t("wizard.state")}: <span className="font-semibold text-slate-900">Colorado</span>
            </p>

            <SectionHeading>{t("wizard.personalInformation")}</SectionHeading>
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
                  maxLength={1}
                  value={form.middleInitial}
                  onChange={(e) => set("middleInitial", e.target.value)}
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
            </Field>

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
                    {US_STATE_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.value}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t("wizard.zipCode")} required>
                  <input
                    className={inputClass}
                    value={form.zip}
                    onChange={(e) => set("zip", e.target.value)}
                  />
                </Field>
              </div>
            </div>

            <SectionHeading>{t("wizard.contactInformation")}</SectionHeading>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label={t("wizard.email")} required>
                <input
                  className={inputClass}
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
              <Field label={t("wizard.phone")} required>
                <input
                  className={inputClass}
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </Field>
            </div>

            <SectionHeading>{t("wizard.declarationConsent")}</SectionHeading>
            <div className="mt-3">
              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={form.consent}
                  onChange={(e) => set("consent", e.target.checked)}
                />
                <span>
                  {t("wizard.consent")}{" "}
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
                  By submitting, you authorize AnglerPermit to assist
                  with your Colorado fishing license application and to process payment for the
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
                  name: LICENSE_LABELS[selectedLicense.id] ?? selectedLicense.name,
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
