import { NextResponse } from "next/server";
import { getStateConfig } from "@/lib/states";
import {
  buildSubmissionSchema,
  genericSubmissionSchema,
  maskSensitiveFields,
} from "@/lib/state-config";
import { storage, type StoredApplication } from "@/lib/storage";
import { sendApplicationEmail } from "@/lib/email";

export const runtime = "nodejs";

/**
 * POST /api/applications
 *
 * Validates the submission server-side against a zod schema generated from the
 * submitted state's config (dynamically discovered in src/data/states/). When
 * the state file does not exist yet, a generic base schema is used so the
 * endpoint works before Phase B lands.
 *
 * SSN HANDLING: raw SSNs are NEVER logged or emailed. The admin email and the
 * console storage adapter receive a masked copy (***-**-####). When a real
 * database adapter replaces consoleStorage, it must encrypt PII/SSN at rest.
 */

function generateReference(stateSlug: string): string {
  const state = stateSlug.toUpperCase().replace(/-/g, "");
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomBytes = new Uint8Array(3);
  crypto.getRandomValues(randomBytes);
  const random = Array.from(randomBytes)
    .map((b) => (b % 36).toString(36))
    .join("")
    .toUpperCase()
    .slice(0, 4)
    .padStart(4, "0");
  return `AP-${state}-${timestamp}-${random}`;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const stateSlug =
    body && typeof body === "object" && "stateSlug" in body
      ? String((body as { stateSlug: unknown }).stateSlug)
      : "";

  const config = stateSlug ? await getStateConfig(stateSlug) : null;
  const schema = config ? buildSubmissionSchema(config) : genericSubmissionSchema;
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".") || "form";
      (errors[path] ??= []).push(issue.message);
    }
    return NextResponse.json(
      { ok: false, message: "Please correct the highlighted fields.", errors },
      { status: 400 },
    );
  }

  const submission = parsed.data as {
    stateSlug: string;
    residency: string;
    licenseId: string;
    addOnIds: string[];
    data: Record<string, unknown>;
    consents: { accurate: boolean; purchaseAuthorized: boolean; termsAccepted: boolean };
  };

  const reference = generateReference(submission.stateSlug);

  // Mask SSNs before ANY storage/logging/email. The unmasked payload stays in
  // `submission.data` only for the future encrypted-at-rest database adapter.
  const maskedData = maskSensitiveFields(config, submission.data);

  const app: StoredApplication = {
    reference,
    stateSlug: submission.stateSlug,
    residency: submission.residency,
    licenseId: submission.licenseId,
    addOnIds: submission.addOnIds,
    data: maskedData,
    consents: submission.consents,
    submittedAt: new Date().toISOString(),
  };

  try {
    await storage.saveApplication(app);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `[api/applications] storage failed for ${reference}: ${err instanceof Error ? err.message : "unknown"}`,
    );
  }

  const { delivered } = await sendApplicationEmail({ config, app, maskedData });
  if (!delivered) {
    // Dev-mode fallback already logged the masked summary. Masked values only —
    // never log submission.data (contains raw SSN).
    // eslint-disable-next-line no-console
    console.log(`[api/applications] ${reference} received (email delivery: no provider configured)`);
  }

  return NextResponse.json({ ok: true, reference });
}
