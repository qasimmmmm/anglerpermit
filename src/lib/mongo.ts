import { MongoClient, ObjectId, type Collection, type Db, type Filter } from "mongodb";
import type { ApplicationRecord, ApplicationStatus, NewApplicationInput } from "@/lib/storage";

/**
 * Admin + optional checkout persistence on MongoDB.
 * - MONGODB_URI=mongodb://... or mongodb+srv://...  → real Mongo
 * - MONGODB_URI=memory (or unset in development)     → in-process store for local UI
 *
 * Postgres (DATABASE_URL) remains the source of truth for production lifecycle
 * when configured; we mirror into Mongo for the admin console.
 */

export type MongoAppDoc = Omit<ApplicationRecord, "id"> & {
  _id: string;
  updatedAt: string;
  /** Soft-delete timestamp — archived apps are hidden from the ops list. */
  archivedAt?: string | null;
  paymentMeta?: {
    transactionId?: string;
    last4?: string;
    brand?: string;
    descriptor?: string;
    devMode?: boolean;
  };
};

type MemStore = { apps: Map<string, MongoAppDoc> };

declare global {
  // eslint-disable-next-line no-var
  var __anglerMongoClient: MongoClient | null | undefined;
  // eslint-disable-next-line no-var
  var __anglerMongoMem: MemStore | undefined;
  // eslint-disable-next-line no-var
  var __anglerMongoConnect: Promise<MongoClient | null> | undefined;
  // eslint-disable-next-line no-var
  var __anglerMongoError: string | undefined;
}

const STATUSES: ApplicationStatus[] = [
  "pending_payment",
  "payment_failed",
  "received",
  "processing",
  "missing_info",
  "delivered",
  "cancelled",
  "refunded",
];

function uriMode(): "mongo" | "memory" | "off" {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) return process.env.NODE_ENV === "production" ? "off" : "memory";
  if (uri === "memory") return "memory";
  return "mongo";
}

export function mongoConfigured(): boolean {
  return uriMode() !== "off";
}

/** Effective backend after connect attempts (Atlas may fall back to memory). */
export function mongoBackendLabel(): string {
  if (uriMode() === "off") return "off";
  if (uriMode() === "memory") return "memory";
  if (globalThis.__anglerMongoClient) return "mongo";
  if (globalThis.__anglerMongoError) return "memory";
  return "mongo";
}

export function mongoLastError(): string | undefined {
  return globalThis.__anglerMongoError;
}

function mem(): MemStore {
  if (!globalThis.__anglerMongoMem) {
    globalThis.__anglerMongoMem = { apps: new Map() };
  }
  return globalThis.__anglerMongoMem;
}

async function getClient(): Promise<MongoClient | null> {
  if (uriMode() !== "mongo") return null;
  if (globalThis.__anglerMongoClient) return globalThis.__anglerMongoClient;
  // Don't keep retrying a dead Atlas link on every request (causes white-screen hangs).
  if (globalThis.__anglerMongoError) return null;

  if (!globalThis.__anglerMongoConnect) {
    const uri = process.env.MONGODB_URI!.trim();
    globalThis.__anglerMongoConnect = (async () => {
      try {
        const client = new MongoClient(uri, {
          maxPoolSize: 5,
          // Fail fast — Atlas IP blocks otherwise hang for minutes.
          serverSelectionTimeoutMS: 4_000,
          connectTimeoutMS: 4_000,
          socketTimeoutMS: 8_000,
        });
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        globalThis.__anglerMongoClient = client;
        globalThis.__anglerMongoError = undefined;
        // eslint-disable-next-line no-console
        console.log("[mongo] connected to Atlas");
        return client;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown";
        globalThis.__anglerMongoError = msg;
        // eslint-disable-next-line no-console
        console.error(
          `[mongo] connect failed within 4s — falling back to memory. Fix Atlas Network Access (allow your IP or 0.0.0.0/0). ${msg}`,
        );
        return null;
      } finally {
        globalThis.__anglerMongoConnect = undefined;
      }
    })();
  }

  return globalThis.__anglerMongoConnect;
}

export async function getMongoDb(): Promise<Db | null> {
  const client = await getClient();
  if (!client) return null;
  return client.db(process.env.MONGODB_DB?.trim() || "anglerpermit");
}

/** Clear a cached Atlas failure so the next call retries (e.g. after IP allowlist). */
export function resetMongoConnectionCache() {
  globalThis.__anglerMongoError = undefined;
  globalThis.__anglerMongoConnect = undefined;
}

async function getDb(): Promise<Db | null> {
  return getMongoDb();
}

async function col(): Promise<Collection<MongoAppDoc> | null> {
  const db = await getDb();
  return db ? db.collection<MongoAppDoc>("applications") : null;
}

function nowIso() {
  return new Date().toISOString();
}

function fromInput(input: NewApplicationInput, id: string, reference: string): MongoAppDoc {
  const t = nowIso();
  return {
    _id: id,
    reference,
    stateSlug: input.stateSlug,
    residency: input.residency,
    licenseId: input.licenseId,
    addOnIds: input.addOnIds,
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    formData: input.formData,
    consents: input.consents,
    amountCents: input.amountCents,
    status: "pending_payment",
    statusReason: null,
    nmiCustomerVaultId: null,
    submittedAt: t,
    paidAt: null,
    paymentFailedAt: null,
    deliveredAt: null,
    cancelledAt: null,
    refundedAt: null,
    updatedAt: t,
  };
}

export function docToRecord(doc: MongoAppDoc): ApplicationRecord {
  return {
    id: doc._id,
    reference: doc.reference,
    stateSlug: doc.stateSlug,
    residency: doc.residency,
    licenseId: doc.licenseId,
    addOnIds: doc.addOnIds ?? [],
    email: doc.email,
    firstName: doc.firstName,
    lastName: doc.lastName,
    phone: doc.phone,
    formData: doc.formData ?? {},
    consents: doc.consents ?? {},
    amountCents: doc.amountCents,
    status: doc.status,
    statusReason: doc.statusReason,
    nmiCustomerVaultId: doc.nmiCustomerVaultId,
    submittedAt: doc.submittedAt,
    paidAt: doc.paidAt,
    paymentFailedAt: doc.paymentFailedAt,
    deliveredAt: doc.deliveredAt,
    cancelledAt: doc.cancelledAt,
    refundedAt: doc.refundedAt,
  };
}

/** Upsert mirror of a Postgres (or Mongo-primary) application record. */
export async function mongoUpsertApp(
  app: ApplicationRecord,
  paymentMeta?: MongoAppDoc["paymentMeta"],
): Promise<void> {
  if (!mongoConfigured()) return;
  const doc: MongoAppDoc = {
    _id: app.id,
    reference: app.reference,
    stateSlug: app.stateSlug,
    residency: app.residency,
    licenseId: app.licenseId,
    addOnIds: app.addOnIds,
    email: app.email,
    firstName: app.firstName,
    lastName: app.lastName,
    phone: app.phone,
    formData: app.formData,
    consents: app.consents,
    amountCents: app.amountCents,
    status: app.status,
    statusReason: app.statusReason,
    nmiCustomerVaultId: app.nmiCustomerVaultId,
    submittedAt: app.submittedAt,
    paidAt: app.paidAt,
    paymentFailedAt: app.paymentFailedAt,
    deliveredAt: app.deliveredAt,
    cancelledAt: app.cancelledAt,
    refundedAt: app.refundedAt,
    updatedAt: nowIso(),
    ...(paymentMeta ? { paymentMeta } : {}),
  };

  const c = await col();
  if (c) {
    const { _id, ...rest } = doc;
    await c.updateOne({ _id }, { $set: rest, $setOnInsert: { _id } }, { upsert: true });
    return;
  }
  const prev = mem().apps.get(app.id);
  mem().apps.set(app.id, { ...prev, ...doc, paymentMeta: paymentMeta ?? prev?.paymentMeta });
}

export async function mongoCreateOrReuse(
  input: NewApplicationInput,
): Promise<{ app: ApplicationRecord; reused: boolean }> {
  const since = Date.now() - 24 * 3600 * 1000;
  const c = await col();

  if (input.email) {
    const reuseFilter = {
      email: { $regex: `^${escapeRegex(input.email)}$`, $options: "i" },
      stateSlug: input.stateSlug,
      licenseId: input.licenseId,
      amountCents: input.amountCents,
      status: { $in: ["pending_payment", "payment_failed"] as ApplicationStatus[] },
      submittedAt: { $gt: new Date(since).toISOString() },
    };

    if (c) {
      const existing = await c.find(reuseFilter).sort({ submittedAt: -1 }).limit(1).next();
      if (existing) {
        await c.updateOne(
          { _id: existing._id },
          {
            $set: {
              formData: input.formData,
              consents: input.consents,
              addOnIds: input.addOnIds,
              residency: input.residency,
              firstName: input.firstName,
              lastName: input.lastName,
              phone: input.phone,
              updatedAt: nowIso(),
            },
          },
        );
        const fresh = await c.findOne({ _id: existing._id });
        return { app: docToRecord(fresh!), reused: true };
      }
    } else {
      const existing = Array.from(mem().apps.values())
        .filter(
          (d) =>
            d.email?.toLowerCase() === input.email!.toLowerCase() &&
            d.stateSlug === input.stateSlug &&
            d.licenseId === input.licenseId &&
            d.amountCents === input.amountCents &&
            (d.status === "pending_payment" || d.status === "payment_failed") &&
            new Date(d.submittedAt).getTime() > since,
        )
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
      if (existing) {
        const next = {
          ...existing,
          formData: input.formData,
          consents: input.consents,
          addOnIds: input.addOnIds,
          residency: input.residency,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          updatedAt: nowIso(),
        };
        mem().apps.set(existing._id, next);
        return { app: docToRecord(next), reused: true };
      }
    }
  }

  const id = new ObjectId().toHexString();
  const doc = fromInput(input, id, input.reference);
  if (c) await c.insertOne(doc);
  else mem().apps.set(id, doc);
  return { app: docToRecord(doc), reused: false };
}

export async function mongoGetById(id: string): Promise<ApplicationRecord | null> {
  if (!mongoConfigured()) return null;
  const c = await col();
  if (c) {
    const doc = await c.findOne({ _id: id });
    return doc ? docToRecord(doc) : null;
  }
  const doc = mem().apps.get(id);
  return doc ? docToRecord(doc) : null;
}

export async function mongoGetByReference(reference: string): Promise<ApplicationRecord | null> {
  if (!mongoConfigured()) return null;
  const c = await col();
  if (c) {
    const doc = await c.findOne({ reference });
    return doc ? docToRecord(doc) : null;
  }
  const doc = Array.from(mem().apps.values()).find((d) => d.reference === reference);
  return doc ? docToRecord(doc) : null;
}

/** Soft-delete: hide from ops lists without destroying the record. */
export async function mongoArchiveApp(id: string): Promise<boolean> {
  if (!mongoConfigured()) return false;
  const t = nowIso();
  const c = await col();
  if (c) {
    const existing = await c.findOne({ _id: id });
    if (!existing) return false;
    if (existing.archivedAt) return true;
    const res = await c.updateOne({ _id: id }, { $set: { archivedAt: t, updatedAt: t } });
    return res.matchedCount === 1;
  }
  const prev = mem().apps.get(id);
  if (!prev) return false;
  if (!prev.archivedAt) {
    mem().apps.set(id, { ...prev, archivedAt: t, updatedAt: t });
  }
  return true;
}

/** @deprecated Prefer mongoArchiveApp — hard delete kept for scripts only. */
export async function mongoDeleteApp(id: string): Promise<boolean> {
  return mongoArchiveApp(id);
}

export async function mongoPatchStatus(
  id: string,
  status: ApplicationStatus,
  reason?: string | null,
): Promise<ApplicationRecord | null> {
  if (!mongoConfigured()) return null;
  const patch: Partial<MongoAppDoc> = {
    status,
    statusReason: reason ?? null,
    updatedAt: nowIso(),
  };
  const t = nowIso();
  if (status === "received" || status === "processing") patch.paidAt = t;
  if (status === "payment_failed") patch.paymentFailedAt = t;
  if (status === "delivered") patch.deliveredAt = t;
  if (status === "cancelled") patch.cancelledAt = t;
  if (status === "refunded") patch.refundedAt = t;

  const c = await col();
  if (c) {
    await c.updateOne({ _id: id }, { $set: patch });
    const doc = await c.findOne({ _id: id });
    return doc ? docToRecord(doc) : null;
  }
  const prev = mem().apps.get(id);
  if (!prev) return null;
  const next = { ...prev, ...patch };
  mem().apps.set(id, next);
  return docToRecord(next);
}

export async function mongoSyncStatus(
  id: string,
  status: ApplicationStatus,
  extra: Partial<MongoAppDoc> = {},
): Promise<void> {
  if (!mongoConfigured()) return;
  const c = await col();
  const $set = { status, updatedAt: nowIso(), ...extra };
  if (c) {
    await c.updateOne({ _id: id }, { $set });
    return;
  }
  const prev = mem().apps.get(id);
  if (prev) mem().apps.set(id, { ...prev, ...$set });
}

export interface AppListQuery {
  q?: string;
  status?: string;
  state?: string;
  from?: string;
  to?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  pageSize?: number;
  sort?: "newest" | "oldest" | "amount_desc" | "amount_asc";
}

export async function mongoListApps(query: AppListQuery): Promise<{
  items: ApplicationRecord[];
  total: number;
  page: number;
  pageSize: number;
}> {
  await ensureDemoSeed();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));
  const filter = buildFilter(query);

  const c = await col();
  if (c) {
    const sortSpec: Record<string, 1 | -1> =
      query.sort === "oldest"
        ? { submittedAt: 1 }
        : query.sort === "amount_desc"
          ? { amountCents: -1 }
          : query.sort === "amount_asc"
            ? { amountCents: 1 }
            : { submittedAt: -1 };
    const total = await c.countDocuments(filter);
    const docs = await c
      .find(filter)
      .sort(sortSpec)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();
    return { items: docs.map(docToRecord), total, page, pageSize };
  }

  let rows = Array.from(mem().apps.values()).filter((d) => matchMem(d, query));
  rows = sortMem(rows, query.sort);
  const total = rows.length;
  const slice = rows.slice((page - 1) * pageSize, page * pageSize);
  return { items: slice.map(docToRecord), total, page, pageSize };
}

export async function mongoStats() {
  await ensureDemoSeed();
  const c = await col();
  const docs = (
    c ? await c.find({}).toArray() : Array.from(mem().apps.values())
  ).filter((d) => !d.archivedAt);

  const byStatus: Record<string, number> = {};
  const byState: Record<string, number> = {};
  const revenueByDay: Record<string, number> = {};
  let revenueCents = 0;
  let paidCount = 0;

  for (const d of docs) {
    byStatus[d.status] = (byStatus[d.status] ?? 0) + 1;
    byState[d.stateSlug] = (byState[d.stateSlug] ?? 0) + 1;
    const day = d.submittedAt.slice(0, 10);
    if (["received", "processing", "missing_info", "delivered"].includes(d.status)) {
      revenueCents += d.amountCents;
      paidCount += 1;
      revenueByDay[day] = (revenueByDay[day] ?? 0) + d.amountCents;
    }
  }

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const dt = new Date();
    dt.setHours(12, 0, 0, 0);
    dt.setDate(dt.getDate() - (13 - i));
    const key = dt.toISOString().slice(0, 10);
    return { date: key, cents: revenueByDay[key] ?? 0, label: key.slice(5) };
  });

  return {
    total: docs.length,
    paidCount,
    revenueCents,
    byStatus,
    byState,
    last14,
    statuses: STATUSES,
    backend: mongoBackendLabel(),
    mongoError: mongoLastError() ?? null,
  };
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildFilter(query: AppListQuery): Filter<MongoAppDoc> {
  const and: Filter<MongoAppDoc>[] = [
    // Soft-deleted rows stay in Mongo but never appear in the ops console.
    { $or: [{ archivedAt: null }, { archivedAt: { $exists: false } }] },
  ];
  if (query.status && STATUSES.includes(query.status as ApplicationStatus)) {
    and.push({ status: query.status as ApplicationStatus });
  }
  if (query.state) and.push({ stateSlug: query.state });
  if (query.from) and.push({ submittedAt: { $gte: query.from } });
  if (query.to) and.push({ submittedAt: { $lte: `${query.to}T23:59:59.999Z` } });
  if (query.minAmount != null) and.push({ amountCents: { $gte: query.minAmount } });
  if (query.maxAmount != null) and.push({ amountCents: { $lte: query.maxAmount } });
  if (query.q?.trim()) {
    const q = query.q.trim();
    and.push({
      $or: [
        { reference: { $regex: escapeRegex(q), $options: "i" } },
        { email: { $regex: escapeRegex(q), $options: "i" } },
        { firstName: { $regex: escapeRegex(q), $options: "i" } },
        { lastName: { $regex: escapeRegex(q), $options: "i" } },
        { phone: { $regex: escapeRegex(q), $options: "i" } },
      ],
    });
  }
  return and.length ? { $and: and } : {};
}

function matchMem(d: MongoAppDoc, query: AppListQuery): boolean {
  if (d.archivedAt) return false;
  if (query.status && d.status !== query.status) return false;
  if (query.state && d.stateSlug !== query.state) return false;
  if (query.from && d.submittedAt < query.from) return false;
  if (query.to && d.submittedAt > `${query.to}T23:59:59.999Z`) return false;
  if (query.minAmount != null && d.amountCents < query.minAmount) return false;
  if (query.maxAmount != null && d.amountCents > query.maxAmount) return false;
  if (query.q?.trim()) {
    const q = query.q.trim().toLowerCase();
    const hay = [d.reference, d.email, d.firstName, d.lastName, d.phone]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function sortMem(rows: MongoAppDoc[], sort?: AppListQuery["sort"]) {
  const copy = [...rows];
  copy.sort((a, b) => {
    if (sort === "oldest") return a.submittedAt.localeCompare(b.submittedAt);
    if (sort === "amount_desc") return b.amountCents - a.amountCents;
    if (sort === "amount_asc") return a.amountCents - b.amountCents;
    return b.submittedAt.localeCompare(a.submittedAt);
  });
  return copy;
}

/** Demo rows so the console looks alive before real checkouts land. */
async function ensureDemoSeed() {
  if (process.env.ADMIN_SEED_DEMO === "false") return;
  const c = await col();
  const count = c ? await c.countDocuments() : mem().apps.size;
  if (count > 0) return;

  const states = [
    "florida",
    "south-carolina",
    "michigan",
    "texas",
    "california",
    "colorado",
    "north-carolina",
  ];
  const statuses: ApplicationStatus[] = [
    "received",
    "processing",
    "delivered",
    "missing_info",
    "payment_failed",
    "received",
    "cancelled",
    "refunded",
    "pending_payment",
    "delivered",
    "processing",
    "received",
  ];
  const names = [
    ["Maya", "Chen"],
    ["Jordan", "Ellis"],
    ["Sam", "Rivera"],
    ["Avery", "Brooks"],
    ["Leo", "Nguyen"],
    ["Riley", "Patel"],
    ["Casey", "Morgan"],
    ["Quinn", "Hayes"],
    ["Drew", "Santos"],
    ["Jamie", "Cole"],
    ["Taylor", "Reed"],
    ["Cameron", "Walsh"],
  ];

  for (let i = 0; i < names.length; i++) {
    const [firstName, lastName] = names[i];
    const day = new Date();
    day.setDate(day.getDate() - (i % 12));
    const submittedAt = day.toISOString();
    const status = statuses[i];
    const amountCents = [4900, 7200, 11500, 3800, 15600, 6400][i % 6];
    const id = new ObjectId().toHexString();
    const stateSlug = states[i % states.length];
    const doc: MongoAppDoc = {
      _id: id,
      reference: `AP-DEMO-${String(100000 + i)}`,
      stateSlug,
      residency: i % 3 === 0 ? "nonresident" : "resident",
      licenseId: "annual",
      addOnIds: i % 2 === 0 ? ["trout"] : [],
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      firstName,
      lastName,
      phone: `555-01${String(i).padStart(2, "0")}`,
      formData: { firstName, lastName, city: "Austin", state: "TX" },
      consents: { accurateAndTerms: true },
      amountCents,
      status,
      statusReason: status === "missing_info" ? "DOB mismatch on ID" : null,
      nmiCustomerVaultId: null,
      submittedAt,
      paidAt: ["received", "processing", "missing_info", "delivered"].includes(status)
        ? submittedAt
        : null,
      paymentFailedAt: status === "payment_failed" ? submittedAt : null,
      deliveredAt: status === "delivered" ? submittedAt : null,
      cancelledAt: status === "cancelled" ? submittedAt : null,
      refundedAt: status === "refunded" ? submittedAt : null,
      updatedAt: submittedAt,
      paymentMeta: { last4: "4242", brand: "Visa", descriptor: "ANGLER PERMIT", devMode: true },
    };
    if (c) await c.insertOne(doc);
    else mem().apps.set(id, doc);
  }
}
