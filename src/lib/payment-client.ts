"use client";

/**
 * Client-side card tokenization (NMI Collect.js-style).
 *
 * The raw card number / expiry / CVV entered in the payment step are turned
 * into a single-use payment_token IN THE BROWSER. Only the token (plus
 * PCI-safe display metadata: brand, last4, billing ZIP) is ever sent to our
 * API — raw card data never touches our servers and is never logged.
 *
 * Two modes:
 *  - CONFIGURED (NEXT_PUBLIC_NMI_TOKENIZATION_KEY set): the NMI Collect.js
 *    script is loaded and produces the payment_token against NMI's vault.
 *  - DEV MODE (key unset): the token is simulated locally with the "tok_dev_"
 *    prefix so checkout works with zero env. The server mirrors this by
 *    simulating the charge when NMI_PRIVATE_SECURITY_KEY is unset.
 */

export interface CardDetails {
  number: string; // digits only
  expMonth: string; // "MM"
  expYear: string; // "YYYY"
  cvv: string;
}

export interface TokenizedCard {
  token: string;
  last4: string;
  brand: string;
}

/* Minimal typing for the Collect.js global (loaded on demand). */
interface CollectJsGlobal {
  configure?: (opts: Record<string, unknown>) => void;
  startPaymentRequest?: () => void;
  tokenize?: (
    card: Record<string, string>,
    cb: (err: unknown, token?: string) => void,
  ) => void;
}

declare global {
  interface Window {
    CollectJS?: CollectJsGlobal;
  }
}

let collectJsPromise: Promise<void> | null = null;

/** Inject the Collect.js script once, keyed by the public tokenization key. */
function loadCollectJs(tokenizationKey: string): Promise<void> {
  if (window.CollectJS) return Promise.resolve();
  if (collectJsPromise) return collectJsPromise;
  collectJsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://secure.networkmerchants.com/token/Collect.js";
    script.async = true;
    // Public TOKENIZATION key only — safe for the browser by design.
    script.dataset.tokenizationKey = tokenizationKey;
    script.onload = () => resolve();
    script.onerror = () => {
      collectJsPromise = null;
      reject(new Error("collectjs-load-failed"));
    };
    document.head.appendChild(script);
  });
  return collectJsPromise;
}

/**
 * Tokenize card details. Resolves with { token, last4, brand }.
 * Rejects with a user-friendly Error message (never containing card data).
 */
export async function tokenizeCard(card: CardDetails): Promise<TokenizedCard> {
  const last4 = card.number.slice(-4);
  const tokenizationKey = process.env.NEXT_PUBLIC_NMI_TOKENIZATION_KEY;

  if (tokenizationKey) {
    try {
      await loadCollectJs(tokenizationKey);
      const token = await new Promise<string>((resolve, reject) => {
        // Collect.js tokenizes the PAN against NMI's vault from the browser;
        // the raw number is transmitted only browser -> NMI, never to us.
        window.CollectJS?.tokenize?.(
          {
            number: card.number,
            expMonth: card.expMonth,
            expYear: card.expYear,
            cvv: card.cvv,
          },
          (err, token) => (token ? resolve(token) : reject(err ?? new Error("tokenize-failed"))),
        );
        // If the loaded script does not expose tokenize(), fail fast below.
        if (!window.CollectJS?.tokenize) reject(new Error("collectjs-unavailable"));
      });
      return { token, last4, brand: "" };
    } catch {
      throw new Error(
        "We couldn't securely process your card details. Please try again in a moment.",
      );
    }
  }

  // DEV MODE: no tokenization key configured — simulate the token locally.
  // The simulated token carries no card data; the server-side charge is also
  // simulated when NMI_PRIVATE_SECURITY_KEY is unset.
  const random = new Uint8Array(8);
  crypto.getRandomValues(random);
  const suffix = Array.from(random, (b) => (b % 36).toString(36)).join("");
  return { token: `tok_dev_${suffix}`, last4, brand: "" };
}
