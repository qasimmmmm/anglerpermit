import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { sendLicenseDeliveryEmail } from "@/lib/email";

export const runtime = "nodejs";

/**
 * POST /api/admin/deliver-license  (multipart/form-data)
 *
 * Team-only endpoint behind ADMIN_PANEL_SECRET: sends the branded
 * license-delivery email (with the issued license attached) to a customer,
 * and a copy to the admin inbox. Used by the unlisted /admin/deliver page.
 *
 * Fields: secret, to, customerName, reference, stateName, note?, files (1–5)
 * Limits: PDF/PNG/JPG only, 15 MB combined (Resend caps messages at 40 MB
 * after base64 encoding).
 *
 * Returns 503 when ADMIN_PANEL_SECRET is unset (feature not enabled),
 * 401 on a wrong secret, 400 on validation problems, 502 if the provider
 * rejects the send.
 */

const MAX_FILES = 5;
const MAX_TOTAL_BYTES = 15 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
};

function secretMatches(provided: string): boolean {
  const expected = process.env.ADMIN_PANEL_SECRET;
  if (!expected) return false;
  // Hash both sides so timingSafeEqual gets equal-length buffers.
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(request: Request) {
  if (!process.env.ADMIN_PANEL_SECRET) {
    return bad("License delivery is not enabled: ADMIN_PANEL_SECRET is not configured.", 503);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return bad("Expected multipart/form-data.");
  }

  const secret = String(form.get("secret") ?? "");
  if (!secretMatches(secret)) {
    return bad("Invalid admin secret.", 401);
  }

  const to = String(form.get("to") ?? "").trim();
  const customerName = String(form.get("customerName") ?? "").trim();
  const reference = String(form.get("reference") ?? "").trim();
  const stateName = String(form.get("stateName") ?? "").trim();
  const note = String(form.get("note") ?? "").trim();

  if (!/.+@.+\..+/.test(to)) return bad("Enter a valid customer email address.");
  if (!customerName) return bad("Enter the customer's name.");
  if (!reference) return bad("Enter the application reference (AP-…).");
  if (!stateName) return bad("Enter the state name.");

  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return bad("Attach at least one license file (PDF, PNG, or JPG).");
  if (files.length > MAX_FILES) return bad(`Attach at most ${MAX_FILES} files.`);

  let totalBytes = 0;
  const attachments: Array<{ filename: string; content: Buffer; contentType?: string }> = [];
  for (const file of files) {
    if (!ALLOWED_TYPES[file.type]) {
      return bad(`"${file.name}": only PDF, PNG, or JPG files can be attached.`);
    }
    totalBytes += file.size;
    if (totalBytes > MAX_TOTAL_BYTES) {
      return bad("Attachments exceed the 15 MB combined limit.");
    }
    attachments.push({
      filename: file.name || `license${ALLOWED_TYPES[file.type]}`,
      content: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
    });
  }

  const result = await sendLicenseDeliveryEmail({
    to,
    customerName,
    reference,
    stateName,
    note: note || undefined,
    attachmentNames: attachments.map((a) => a.filename),
    attachments,
  });

  if (!result.delivered) {
    return NextResponse.json(
      { ok: false, message: `The email provider rejected the send: ${result.error ?? "unknown error"}` },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, id: result.id });
}
