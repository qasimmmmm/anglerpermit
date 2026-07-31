import { NextResponse } from "next/server";
import { getAdminSessionUser, isAdminAuthenticated } from "@/lib/admin-auth";
import {
  mongoConfigured,
  mongoGetById,
  mongoGetByReference,
  mongoListApps,
  mongoPatchStatus,
  mongoStats,
} from "@/lib/mongo";
import { deleteApplication, type ApplicationStatus } from "@/lib/storage";

async function guard() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!mongoConfigured()) {
    return NextResponse.json(
      { ok: false, error: "MongoDB is not configured. Set MONGODB_URI." },
      { status: 503 },
    );
  }
  return null;
}

export async function GET(req: Request) {
  const denied = await guard();
  if (denied) return denied;

  const url = new URL(req.url);
  const view = url.searchParams.get("view") ?? "list";

  try {
    if (view === "stats") {
      return NextResponse.json({ ok: true, ...(await mongoStats()) });
    }

    if (view === "one") {
      const id = url.searchParams.get("id");
      if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
      const app = await mongoGetById(id);
      if (!app) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
      return NextResponse.json({ ok: true, app });
    }

    if (view === "byRef") {
      const reference = url.searchParams.get("reference")?.trim();
      if (!reference) {
        return NextResponse.json({ ok: false, error: "reference required" }, { status: 400 });
      }
      const app = await mongoGetByReference(reference);
      if (!app) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
      return NextResponse.json({ ok: true, app });
    }

    const result = await mongoListApps({
      q: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      state: url.searchParams.get("state") ?? undefined,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
      minAmount: num(url.searchParams.get("minAmount")),
      maxAmount: num(url.searchParams.get("maxAmount")),
      page: num(url.searchParams.get("page")) ?? 1,
      pageSize: num(url.searchParams.get("pageSize")) ?? 25,
      sort:
        (url.searchParams.get("sort") as "newest" | "oldest" | "amount_desc" | "amount_asc") ||
        "newest",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Data load failed";
    // eslint-disable-next-line no-console
    console.error(`[api/admin/data] ${message}`);
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}

export async function PATCH(req: Request) {
  const denied = await guard();
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    status?: ApplicationStatus;
    reason?: string;
  };
  if (!body.id || !body.status) {
    return NextResponse.json({ ok: false, error: "id and status required" }, { status: 400 });
  }
  const app = await mongoPatchStatus(body.id, body.status, body.reason);
  if (!app) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, app });
}

export async function DELETE(req: Request) {
  const denied = await guard();
  if (denied) return denied;

  const me = await getAdminSessionUser();
  if (!me || me.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Only admins can archive applications." }, { status: 403 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id")?.trim() || "";
  if (!id) {
    return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
  }

  try {
    const archived = await deleteApplication(id);
    if (!archived) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Archive failed";
    // eslint-disable-next-line no-console
    console.error(`[api/admin/data] DELETE/archive ${id}: ${message}`);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

function num(v: string | null): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
