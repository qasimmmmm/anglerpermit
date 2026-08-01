"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CreditCard, HelpCircle, Loader2, Lock, ShieldCheck } from "lucide-react";
import type { TokenizedPayment } from "@/lib/state-config";
import { nmiBrowserConfigured, tokenizeCard } from "@/lib/payment-client";
import {
  billingZipError,
  BRAND_LABELS,
  cardNumberError,
  cvvError,
  detectBrand,
  expiryError,
  formatCardNumber,
  formatExpiry,
  type CardBrand,
} from "@/lib/card";
import { formatPrice } from "@/lib/format";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

/**
 * Wizard payment step — NMI Collect.js tokenized checkout.
 *
 * Production (NEXT_PUBLIC_NMI_TOKENIZATION_KEY set): card PAN/expiry/CVV are
 * collected in NMI's hosted lightbox. We only keep billing ZIP in our DOM.
 *
 * Dev (key unset): local card fields + tok_dev_* simulation.
 */

type FieldKey = "number" | "expiry" | "cvv" | "zip";

/** Small brand badge shown inside the card-number field (dev mode). */
function BrandBadge({ brand }: { brand: CardBrand }) {
  if (brand === "unknown") {
    return <CreditCard className="h-5 w-5 text-slate-400" aria-hidden="true" />;
  }
  const styles: Record<Exclude<CardBrand, "unknown">, string> = {
    visa: "bg-[#1a1f71] text-white",
    mastercard: "bg-slate-900 text-white",
    amex: "bg-[#2e77bc] text-white",
    discover: "bg-[#f48120] text-white",
  };
  const labels: Record<Exclude<CardBrand, "unknown">, string> = {
    visa: "VISA",
    mastercard: "Mastercard",
    amex: "AMEX",
    discover: "Discover",
  };
  return (
    <span
      aria-label={BRAND_LABELS[brand]}
      className={`rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${styles[brand]}`}
    >
      {labels[brand]}
    </span>
  );
}

export function PaymentStep({
  total,
  stateName,
  processing,
  error,
  onPay,
}: {
  total: number;
  stateName: string;
  processing: boolean;
  error: string | null;
  onPay: (payment: TokenizedPayment) => void;
}) {
  const liveNmi = nmiBrowserConfigured();
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [zip, setZip] = useState("");
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [tokenizing, setTokenizing] = useState(false);
  const [tokenizeError, setTokenizeError] = useState<string | null>(null);

  const brand = useMemo(() => detectBrand(number), [number]);
  const busy = processing || tokenizing;

  function validateField(key: FieldKey) {
    const message =
      key === "number"
        ? cardNumberError(number)
        : key === "expiry"
          ? expiryError(expiry)
          : key === "cvv"
            ? cvvError(cvv, brand)
            : billingZipError(zip);
    setErrors((e) => ({ ...e, [key]: message ?? undefined }));
    return message === null;
  }

  async function handlePay() {
    if (busy) return;
    setTokenizeError(null);

    if (liveNmi) {
      const zipMessage = billingZipError(zip);
      if (zipMessage) {
        setErrors({ zip: zipMessage });
        document.querySelector<HTMLElement>('[data-payment-fields] [aria-invalid="true"]')?.focus();
        return;
      }
      setTokenizing(true);
      try {
        // Lightbox collects PAN/expiry/CVV; only the token returns here.
        const tokenized = await tokenizeCard();
        onPay({
          token: tokenized.token,
          last4: tokenized.last4,
          brand: tokenized.brand
            ? tokenized.brand.charAt(0).toUpperCase() + tokenized.brand.slice(1)
            : "",
          billingZip: zip.trim(),
        });
      } catch (err) {
        setTokenizeError(
          err instanceof Error ? err.message : "We couldn't process your card. Please try again.",
        );
      } finally {
        setTokenizing(false);
      }
      return;
    }

    const nextErrors: Partial<Record<FieldKey, string>> = {};
    for (const key of ["number", "expiry", "cvv", "zip"] as FieldKey[]) {
      const message =
        key === "number"
          ? cardNumberError(number)
          : key === "expiry"
            ? expiryError(expiry)
            : key === "cvv"
              ? cvvError(cvv, brand)
              : billingZipError(zip);
      if (message) nextErrors[key] = message;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      document.querySelector<HTMLElement>('[data-payment-fields] [aria-invalid="true"]')?.focus();
      return;
    }

    const digits = number.replace(/\D/g, "");
    const [mm, yy] = expiry.split("/");
    setTokenizing(true);
    try {
      const tokenized = await tokenizeCard({
        number: digits,
        expMonth: mm,
        expYear: `20${yy}`,
        cvv,
      });
      onPay({
        token: tokenized.token,
        last4: tokenized.last4,
        brand: BRAND_LABELS[brand],
        billingZip: zip.trim(),
      });
    } catch (err) {
      setTokenizeError(
        err instanceof Error ? err.message : "We couldn't process your card. Please try again.",
      );
    } finally {
      setTokenizing(false);
    }
  }

  return (
    <Card className="overflow-hidden rounded-[22px] border-slate-200 bg-white shadow-[0_18px_60px_-24px_rgba(15,23,42,0.45)]">
      <div className="bg-gradient-to-r from-navy to-[#17305f] px-6 py-4 text-white sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
              Secure checkout
            </p>
            <h3 className="mt-1 text-lg font-semibold text-white">Payment details</h3>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
            <Lock className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
            256-bit SSL protected
          </div>
        </div>
      </div>

      <div className="px-6 py-6 sm:px-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2 rounded-2xl border border-forest-200 bg-gradient-to-br from-forest-50 via-white to-sky-50 px-4 py-4">
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-forest-100">
                <ShieldCheck className="h-5 w-5 text-forest-700" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-navy">Secure card entry</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  After you click Pay, a secure payment window opens to collect your card details.
                  Those details go straight to our payment processor and never touch AnglerPermit.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
                    <CheckCircle2 className="h-3.5 w-3.5 text-forest-600" aria-hidden="true" />
                    Hosted by our processor
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
                    <CheckCircle2 className="h-3.5 w-3.5 text-forest-600" aria-hidden="true" />
                    One-time tokenized payment
                  </span>
                </div>
              </div>
            </div>
          </div>

          {liveNmi ? null : (
            <>
              <div className="sm:col-span-2">
                <Input
                  label="Card number"
                  name="cardNumber"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="1234 5678 9012 3456"
                  value={number}
                  onChange={(e) => setNumber(formatCardNumber(e.target.value))}
                  onBlur={() => validateField("number")}
                  error={errors.number}
                  required
                  disabled={busy}
                  rightAdornment={<BrandBadge brand={brand} />}
                />
              </div>
              <Input
                label="Expiry (MM/YY)"
                name="cardExpiry"
                type="text"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                onBlur={() => validateField("expiry")}
                error={errors.expiry}
                required
                disabled={busy}
              />
              <div className="relative">
                <Input
                  label="Security code (CVV)"
                  name="cardCvv"
                  type="password"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder={brand === "amex" ? "4 digits" : "3 digits"}
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  onBlur={() => validateField("cvv")}
                  error={errors.cvv}
                  required
                  disabled={busy}
                  rightAdornment={
                    <span className="group relative inline-flex">
                      <button
                        type="button"
                        aria-label="Where is my security code?"
                        className="rounded p-1 text-slate-400 hover:text-navy focus-visible:text-navy"
                      >
                        <HelpCircle className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <span
                        role="tooltip"
                        className="pointer-events-none absolute bottom-full right-0 z-10 mb-2 w-56 rounded-lg bg-navy px-3 py-2 text-xs leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                      >
                        {brand === "amex"
                          ? "American Express: the 4-digit code printed on the front of your card."
                          : "The 3-digit code in the signature panel on the back of your card."}
                      </span>
                    </span>
                  }
                />
              </div>
            </>
          )}
          <div className="sm:col-span-2">
            <Input
              label="Billing ZIP code"
              name="billingZip"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="12345"
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/[^\d-]/g, "").slice(0, 10))}
              onBlur={() => validateField("zip")}
              error={errors.zip}
              required
              disabled={busy}
            />
          </div>
        </div>

        {(tokenizeError || error) && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {tokenizeError ?? error}
          </div>
        )}

        <p className="mt-6 text-sm leading-relaxed text-slate-600">
          By paying, you agree to our{" "}
          <Link href="/terms" target="_blank" className="font-medium text-forest-700 underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" target="_blank" className="font-medium text-forest-700 underline">
            Privacy Policy
          </Link>{" "}
          and authorize AnglerPermit to purchase this {stateName} license on your behalf.
        </p>

        <Button
          variant="accent"
          size="lg"
          className="mt-5 w-full min-h-[48px] rounded-xl bg-gradient-to-r from-forest-600 to-forest-500 text-base shadow-[0_12px_30px_-12px_rgba(22,163,74,0.7)] hover:from-forest-500 hover:to-forest-400"
          onClick={handlePay}
          disabled={busy}
          aria-live="polite"
        >
          {busy ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              {liveNmi ? "Opening secure payment…" : "Processing payment…"}
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" aria-hidden="true" />
              Pay {formatPrice(total)} securely
            </>
          )}
        </Button>
        <p className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Your card is charged once, and your receipt shows &ldquo;ANGLER PERMIT&rdquo;.
        </p>
      </div>
    </Card>
  );
}
