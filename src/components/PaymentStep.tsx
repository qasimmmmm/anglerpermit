"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CreditCard, HelpCircle, Loader2, Lock } from "lucide-react";
import type { TokenizedPayment } from "@/lib/state-config";
import { tokenizeCard } from "@/lib/payment-client";
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
 * Wizard payment step — NMI Collect.js-style tokenized checkout.
 *
 * PCI posture: the card number / expiry / CVV entered here are validated and
 * formatted locally, then tokenized IN THE BROWSER via tokenizeCard(). Only
 * the resulting single-use token (plus brand/last4 display metadata and the
 * billing ZIP) is handed to onPay -> our API. Raw card data is never sent to
 * our server, never stored in state longer than the entry session, and never
 * logged.
 */

type FieldKey = "number" | "expiry" | "cvv" | "zip";

/** Small brand badge shown inside the card-number field. */
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
    if (busy) return; // double-submit guard
    setTokenizeError(null);
    const checks: [FieldKey, boolean][] = [
      ["number", false],
      ["expiry", false],
      ["cvv", false],
      ["zip", false],
    ];
    const nextErrors: Partial<Record<FieldKey, string>> = {};
    for (const [key] of checks) {
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
      // Move keyboard/screen-reader users to the first invalid card field.
      document.querySelector<HTMLElement>('[data-payment-fields] [aria-invalid="true"]')?.focus();
      return;
    }

    const digits = number.replace(/\D/g, "");
    const [mm, yy] = expiry.split("/");
    setTokenizing(true);
    try {
      // Raw card data goes browser -> token vault only; never to our API.
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
    <Card>
      <div className="px-6 py-6 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold text-navy">Payment details</h3>
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Lock className="h-3.5 w-3.5 text-forest-600" aria-hidden="true" />
            256-bit SSL &middot; card details never touch our servers
          </span>
        </div>

        <div data-payment-fields className="mt-5 grid gap-5 sm:grid-cols-2">
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
            className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
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
          className="mt-4 w-full min-h-[44px]"
          onClick={handlePay}
          disabled={busy}
          aria-live="polite"
        >
          {busy ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Processing payment&hellip;
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
