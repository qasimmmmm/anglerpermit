/**
 * NMI (Network Merchants Inc.) payment gateway — server side.
 *
 * Flow (Collect.js-style tokenization):
 *   1. The browser collects card number / expiry / CVV and tokenizes them
 *      CLIENT-SIDE. Raw card data never touches this server (see
 *      src/components/PaymentStep.tsx — grep-proof: no PAN in any request
 *      to our API).
 *   2. Our API receives only the single-use `payment_token` and calls the
 *      NMI Direct Post API (transact.php) with type=sale, the SERVER-COMPUTED
 *      amount (never a client-sent amount), and the statement descriptor.
 *
 * Environment (NEVER hardcode keys in this repo):
 *   NMI_TOKENIZATION_KEY          public tokenization key; may be mirrored to
 *                                 NEXT_PUBLIC_NMI_TOKENIZATION_KEY for the
 *                                 client script. Not used here.
 *   NMI_PRIVATE_SECURITY_KEY      SERVER ONLY. Private security key used to
 *                                 authenticate transact.php. When unset the
 *                                 gateway runs in dev mode (see below).
 *   NMI_DESCRIPTOR                Card-statement descriptor shown on the
 *                                 customer's receipt. Default "ANGLER PERMIT".
 */

const NMI_ENDPOINT = "https://secure.networkmerchants.com/api/transact.php";

export const NMI_DESCRIPTOR = process.env.NMI_DESCRIPTOR ?? "ANGLER PERMIT";

export interface ChargeRequest {
  /** USD amount, computed server-side from the state config. */
  amount: number;
  /** Single-use payment_token produced by client-side tokenization. */
  paymentToken: string;
  /** Order reference, echoed into the gateway for reconciliation. */
  orderId: string;
  billingZip?: string;
}

export type ChargeResult =
  | { ok: true; transactionId: string; devMode: boolean }
  | { ok: false; message: string };

interface NmiParsedResponse {
  response: string;
  responsetext: string;
  transactionid: string;
  [key: string]: string;
}

/** Map common NMI decline codes to a friendly, non-technical message. */
function friendlyDeclineMessage(responsetext: string): string {
  const text = responsetext.toLowerCase();
  if (text.includes("insufficient")) {
    return "Your card was declined (insufficient funds). Try a different card.";
  }
  if (text.includes("expired")) {
    return "Your card is expired. Check the expiration date or use a different card.";
  }
  if (text.includes("cvv") || text.includes("cvd") || text.includes("security code")) {
    return "The security code (CVV) was rejected. Check the code and try again.";
  }
  if (text.includes("do not honor") || text.includes("decline")) {
    return "Your card was declined by the issuing bank. Try a different card or contact your bank.";
  }
  return "Your payment could not be completed. Check your card details and try again.";
}

function parseNmiBody(body: string): NmiParsedResponse {
  const params = new URLSearchParams(body);
  return {
    response: params.get("response") ?? "",
    responsetext: params.get("responsetext") ?? "",
    transactionid: params.get("transactionid") ?? "",
    ...Object.fromEntries(params.entries()),
  };
}

/**
 * Charge a tokenized card via NMI type=sale.
 *
 * DEV MODE: when NMI_PRIVATE_SECURITY_KEY is not set, the charge is
 * SIMULATED as successful (clearly logged) so the site works with zero env.
 * The returned transaction id is prefixed "DEV-".
 */
export async function chargeSale(req: ChargeRequest): Promise<ChargeResult> {
  const privateKey = process.env.NMI_PRIVATE_SECURITY_KEY;
  const amount = req.amount.toFixed(2);

  if (!privateKey) {
    // Dev mode: no gateway configured — simulate a successful charge so the
    // full checkout flow is exercisable locally and in CI. No network call.
    // eslint-disable-next-line no-console
    console.log(
      `[nmi:dev] NMI_PRIVATE_SECURITY_KEY not set — SIMULATED sale of $${amount} ` +
        `(token accepted, descriptor "${NMI_DESCRIPTOR}", order ${req.orderId})`,
    );
    return {
      ok: true,
      transactionId: `DEV-${Date.now().toString(36).toUpperCase()}`,
      devMode: true,
    };
  }

  const params = new URLSearchParams({
    security_key: privateKey,
    type: "sale",
    amount,
    payment_token: req.paymentToken,
    orderid: req.orderId,
    // Statement descriptor (soft descriptor) shown on the card statement.
    custom_descriptor: NMI_DESCRIPTOR,
  });
  if (req.billingZip) params.set("zip", req.billingZip);

  let body: string;
  try {
    const res = await fetch(NMI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      // NMI responds quickly; fail closed on a hung gateway.
      signal: AbortSignal.timeout(20_000),
    });
    body = await res.text();
  } catch {
    return {
      ok: false,
      message:
        "We could not reach the payment processor. You have not been charged — please try again.",
    };
  }

  const parsed = parseNmiBody(body);

  // NMI: response=1 approved, 2 declined, 3 error.
  if (parsed.response === "1") {
    return { ok: true, transactionId: parsed.transactionid, devMode: false };
  }
  if (parsed.response === "2") {
    // Log only the decline code — never card data.
    // eslint-disable-next-line no-console
    console.log(`[nmi] sale declined for order ${req.orderId}: ${parsed.responsetext}`);
    return { ok: false, message: friendlyDeclineMessage(parsed.responsetext) };
  }
  // eslint-disable-next-line no-console
  console.error(`[nmi] gateway error for order ${req.orderId}: ${parsed.responsetext}`);
  return {
    ok: false,
    message:
      "The payment processor reported an error. You have not been charged — please try again.",
  };
}
