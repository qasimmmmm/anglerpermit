"use client";

/**
 * Client-side card tokenization (NMI Collect.js).
 *
 * Collect.js does NOT accept raw card numbers from our DOM — it only tokenizes
 * via its hosted lightbox / iframes. Calling a fictional CollectJS.tokenize()
 * always fails once NEXT_PUBLIC_NMI_TOKENIZATION_KEY is set.
 *
 * Modes:
 *  - CONFIGURED: load Collect.js → lightbox → payment_token
 *  - DEV (key unset): simulate tok_dev_* so local checkout works
 */

export interface CardDetails {
  number: string; // digits only — used in DEV mode only
  expMonth: string; // "MM"
  expYear: string; // "YYYY"
  cvv: string;
}

export interface TokenizedCard {
  token: string;
  last4: string;
  brand: string;
}

interface CollectJsCard {
  number?: string;
  bin?: string;
  exp?: string;
  type?: string;
}

interface CollectJsResponse {
  token?: string;
  tokenType?: string;
  card?: CollectJsCard;
}

interface CollectJsGlobal {
  configure?: (opts: Record<string, unknown>) => void;
  startPaymentRequest?: (event?: Event) => void;
  closePaymentRequest?: () => void;
}

declare global {
  interface Window {
    CollectJS?: CollectJsGlobal;
  }
}

let collectJsPromise: Promise<void> | null = null;

/** True when a real NMI public tokenization key is baked into the client bundle. */
export function nmiBrowserConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_NMI_TOKENIZATION_KEY?.trim());
}

/** Inject the Collect.js script once, keyed by the public tokenization key. */
function loadCollectJs(tokenizationKey: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("collectjs-ssr"));
  }
  if (window.CollectJS?.configure && window.CollectJS?.startPaymentRequest) {
    return Promise.resolve();
  }
  if (collectJsPromise) return collectJsPromise;

  collectJsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-nmi-collectjs]");
    if (existing && window.CollectJS) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://secure.networkmerchants.com/token/Collect.js";
    script.async = true;
    script.dataset.nmiCollectjs = "1";
    // Public TOKENIZATION key only — safe for the browser by design.
    script.dataset.tokenizationKey = tokenizationKey;
    script.onload = () => {
      // Collect.js attaches CollectJS asynchronously after onload in some builds.
      const start = Date.now();
      const waitReady = () => {
        if (window.CollectJS?.configure && window.CollectJS?.startPaymentRequest) {
          resolve();
          return;
        }
        if (Date.now() - start > 8000) {
          collectJsPromise = null;
          reject(new Error("collectjs-unavailable"));
          return;
        }
        requestAnimationFrame(waitReady);
      };
      waitReady();
    };
    script.onerror = () => {
      collectJsPromise = null;
      reject(new Error("collectjs-load-failed"));
    };
    document.head.appendChild(script);
  });
  return collectJsPromise;
}

function last4FromMasked(number?: string): string {
  if (!number) return "";
  const digits = number.replace(/\D/g, "");
  return digits.slice(-4);
}

/**
 * Open NMI's hosted lightbox and resolve with a single-use payment_token.
 * Card data never touches our DOM or servers.
 */
async function tokenizeViaLightbox(): Promise<TokenizedCard> {
  const tokenizationKey = process.env.NEXT_PUBLIC_NMI_TOKENIZATION_KEY?.trim();
  if (!tokenizationKey) throw new Error("tokenization-key-missing");

  await loadCollectJs(tokenizationKey);

  return new Promise<TokenizedCard>((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    try {
      window.CollectJS!.configure!({
        variant: "lightbox",
        callback: (response: CollectJsResponse) => {
          const token = response?.token?.trim();
          if (!token) {
            finish(() => reject(new Error("tokenize-failed")));
            return;
          }
          finish(() =>
            resolve({
              token,
              last4: last4FromMasked(response.card?.number),
              brand: response.card?.type ?? "",
            }),
          );
        },
        fieldsAvailableCallback: () => {
          /* lightbox ready */
        },
      });
      window.CollectJS!.startPaymentRequest!();
    } catch (err) {
      finish(() =>
        reject(err instanceof Error ? err : new Error("collectjs-configure-failed")),
      );
    }
  });
}

function tokenizeDev(card: CardDetails): TokenizedCard {
  const last4 = card.number.slice(-4);
  const random = new Uint8Array(8);
  crypto.getRandomValues(random);
  const suffix = Array.from(random, (b) => (b % 36).toString(36)).join("");
  return { token: `tok_dev_${suffix}`, last4, brand: "" };
}

/**
 * Tokenize card details. Resolves with { token, last4, brand }.
 * Rejects with a user-friendly Error message (never containing card data).
 *
 * When NMI is configured, `card` is ignored — Collect.js lightbox collects
 * the PAN. Pass card details only for local DEV mode (no public key).
 */
export async function tokenizeCard(card?: CardDetails): Promise<TokenizedCard> {
  if (nmiBrowserConfigured()) {
    try {
      return await tokenizeViaLightbox();
    } catch {
      throw new Error(
        "We couldn't securely process your card details. Please try again in a moment.",
      );
    }
  }

  if (!card?.number) {
    throw new Error("Card details are required.");
  }
  return tokenizeDev(card);
}
