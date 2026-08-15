import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { mongoConfigured, mongoListApps } from "@/lib/mongo";

export const runtime = "nodejs";

function labelStatus(s: string) {
  return s.replace(/_/g, " ");
}

function stateLabel(slug: string) {
  return slug
    .split("-")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * GET /api/admin/applications/export
 * Excel (.xlsx) download of applications matching the same filters as the CRM list.
 */
export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!mongoConfigured()) {
    return NextResponse.json(
      { ok: false, error: "MongoDB is not configured. Set MONGODB_URI." },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const num = (v: string | null) => {
    if (v == null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  try {
    const result = await mongoListApps({
      q: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      state: url.searchParams.get("state") ?? undefined,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
      minAmount: num(url.searchParams.get("minAmount")),
      maxAmount: num(url.searchParams.get("maxAmount")),
      page: 1,
      pageSize: 10_000,
      sort:
        (url.searchParams.get("sort") as "newest" | "oldest" | "amount_desc" | "amount_asc") ||
        "newest",
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "AnglerPermit CRM";
    workbook.created = new Date();
    const sheet = workbook.addWorksheet("Applications", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    sheet.columns = [
      { header: "Reference", key: "reference", width: 16 },
      { header: "First name", key: "firstName", width: 14 },
      { header: "Last name", key: "lastName", width: 14 },
      { header: "Email", key: "email", width: 28 },
      { header: "Phone", key: "phone", width: 16 },
      { header: "State", key: "state", width: 16 },
      { header: "License ID", key: "licenseId", width: 18 },
      { header: "Residency", key: "residency", width: 14 },
      { header: "Status", key: "status", width: 16 },
      { header: "Status reason", key: "statusReason", width: 28 },
      { header: "License expiry", key: "expiry", width: 14 },
      { header: "Amount (USD)", key: "amount", width: 14 },
      { header: "Submitted", key: "submitted", width: 22 },
      { header: "Paid at", key: "paidAt", width: 22 },
    ];

    const header = sheet.getRow(1);
    header.font = { bold: true };
    header.alignment = { vertical: "middle" };

    for (const app of result.items) {
      sheet.addRow({
        reference: app.reference,
        firstName: app.firstName ?? "",
        lastName: app.lastName ?? "",
        email: app.email ?? "",
        phone: app.phone ?? "",
        state: stateLabel(app.stateSlug),
        licenseId: app.licenseId,
        residency: app.residency,
        status: labelStatus(app.status),
        statusReason: app.statusReason ?? "",
        expiry: app.existingLicenseExpiresOn ?? "",
        amount: app.amountCents / 100,
        submitted: app.submittedAt ? new Date(app.submittedAt).toISOString() : "",
        paidAt: app.paidAt ? new Date(app.paidAt).toISOString() : "",
      });
    }

    sheet.getColumn("amount").numFmt = "0.00";

    const buffer = await workbook.xlsx.writeBuffer();
    const stamp = new Date().toISOString().slice(0, 10);
    const statusPart = url.searchParams.get("status")?.trim() || "all";
    const filename = `anglerpermit-applications-${statusPart}-${stamp}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
        "X-Export-Count": String(result.items.length),
        "X-Export-Total": String(result.total),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed";
    // eslint-disable-next-line no-console
    console.error(`[api/admin/applications/export] ${message}`);
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
