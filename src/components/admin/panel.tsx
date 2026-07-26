"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  FileStack,
  LogOut,
  Search,
  Send,
  ArrowUpRight,
  Filter,
  Users,
  RefreshCw,
  Trash2,
} from "lucide-react";
import type { ApplicationRecord, ApplicationStatus } from "@/lib/storage";
import type { PublicAdminUser } from "@/lib/admin-users";

const STATES = [
  "florida",
  "south-carolina",
  "michigan",
  "texas",
  "california",
  "colorado",
  "north-carolina",
];

const STATUS_COLOR: Record<string, string> = {
  pending_payment: "#b45309",
  payment_failed: "#b91c1c",
  received: "#0f766e",
  processing: "#1d4ed8",
  missing_info: "#c2410c",
  delivered: "#15803d",
  cancelled: "#64748b",
  refunded: "#6d28d9",
};

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function labelStatus(s: string) {
  return s.replace(/_/g, " ");
}

function stateLabel(slug: string) {
  return slug
    .split("-")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/admin/applications", label: "Applications", icon: FileStack },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/deliver", label: "Deliver license", icon: Send },
  ];

  return (
    <div className="admin-root">
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-brand">
            Angler<span>Permit</span>
            <div style={{ fontSize: "0.72rem", opacity: 0.65, marginTop: 4, fontWeight: 500 }}>
              Ops console
            </div>
          </div>
          <nav className="admin-nav" style={{ display: "grid", gap: 6 }}>
            {links.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link key={href} href={href} className={active ? "active" : undefined}>
                  <Icon size={17} />
                  {label}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            className="admin-btn admin-btn-ghost"
            style={{ width: "100%", marginTop: "2rem", display: "flex", gap: 8, justifyItems: "center", justifyContent: "center" }}
            onClick={() => void logout()}
          >
            <LogOut size={16} /> Sign out
          </button>
        </aside>
        <div className="admin-main">{children}</div>
      </div>
    </div>
  );
}

type Stats = {
  total: number;
  paidCount: number;
  revenueCents: number;
  byStatus: Record<string, number>;
  byState: Record<string, number>;
  last14: { date: string; cents: number; label: string }[];
  backend: string;
  mongoError?: string | null;
};

export function DashboardView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/admin/data?view=stats", { signal });
      const d = await r.json();
      if (signal?.aborted) return;
      if (!d.ok) {
        setError(d.error || "Failed to load");
        setStats(null);
      } else {
        setStats(d);
        setError("");
      }
    } catch (err) {
      // React Strict Mode / navigation aborts in-flight fetches — ignore those.
      if (signal?.aborted || (err instanceof DOMException && err.name === "AbortError")) return;
      setError("Could not load dashboard stats. Try refresh — if this persists, check Mongo Atlas Network Access.");
      setStats(null);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    void loadStats(ctrl.signal);
    return () => ctrl.abort();
  }, [loadStats]);

  if (loading && !stats) {
    return <p className="admin-sub">Loading dashboard…</p>;
  }
  if (error && !stats) {
    return (
      <div>
        <p style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</p>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={() => void loadStats()}
          aria-label="Retry dashboard"
          title="Retry"
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }
  if (!stats) {
    return <p className="admin-sub">Loading dashboard…</p>;
  }

  const maxBar = Math.max(1, ...stats.last14.map((d) => d.cents));
  const statusEntries = Object.entries(stats.byStatus).sort((a, b) => b[1] - a[1]);
  const stateEntries = Object.entries(stats.byState).sort((a, b) => b[1] - a[1]);
  const donutTotal = statusEntries.reduce((s, [, n]) => s + n, 0) || 1;

  let angle = 0;
  const arcs = statusEntries.map(([status, n]) => {
    const sweep = (n / donutTotal) * 360;
    const start = angle;
    angle += sweep;
    return { status, n, start, sweep };
  });

  return (
    <div>
      <div className="admin-rise" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="admin-live-dot" />
            <h1 className="admin-title">Command center</h1>
          </div>
          <p className="admin-sub">
            Live snapshot of applications · storage:{" "}
            <strong>{stats.backend === "mongo" ? "MongoDB Atlas" : "local memory"}</strong>
          </p>
        </div>
        <button
          type="button"
          className="admin-btn-icon"
          onClick={() => void loadStats()}
          disabled={loading}
          aria-label="Refresh dashboard"
          title="Refresh"
          style={{ alignSelf: "flex-start" }}
        >
          <RefreshCw size={16} className={loading ? "admin-spin" : undefined} />
        </button>
      </div>
      {stats.mongoError ? (
        <p
          style={{
            marginTop: 10,
            padding: "10px 12px",
            borderRadius: 12,
            background: "#fff7ed",
            border: "1px solid #fdba74",
            color: "#9a3412",
            fontSize: 13,
            maxWidth: 720,
          }}
        >
          Atlas unreachable (usually Network Access / IP allowlist). Using memory so the console
          stays fast. In Atlas → Network Access, allow your IP or <code>0.0.0.0/0</code>, then
          restart the dev server.
        </p>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          marginTop: "1.4rem",
        }}
      >
        {[
          { label: "Applications", value: String(stats.total), delay: "admin-rise-1" },
          { label: "Paid orders", value: String(stats.paidCount), delay: "admin-rise-2" },
          { label: "Gross volume", value: money(stats.revenueCents), delay: "admin-rise-3" },
          {
            label: "Avg ticket",
            value: money(stats.paidCount ? Math.round(stats.revenueCents / stats.paidCount) : 0),
            delay: "admin-rise-4",
          },
        ].map((card) => (
          <div key={card.label} className={`admin-card admin-rise ${card.delay}`} style={{ padding: "1.15rem 1.25rem" }}>
            <div style={{ fontSize: "0.78rem", color: "var(--ap-muted)", fontWeight: 600 }}>{card.label}</div>
            <div className="admin-stat-value" style={{ marginTop: 6 }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: "1rem",
          marginTop: "1rem",
        }}
        className="admin-charts"
      >
        <style>{`@media (max-width:900px){.admin-charts{grid-template-columns:1fr!important}}`}</style>
        <div className="admin-card admin-rise admin-rise-2" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <strong>Revenue · last 14 days</strong>
            <span style={{ color: "var(--ap-muted)", fontSize: "0.8rem" }}>USD</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 160 }}>
            {stats.last14.map((d, i) => (
              <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div
                  title={`${d.label}: ${money(d.cents)}`}
                  style={{
                    width: "100%",
                    borderRadius: 8,
                    background: `linear-gradient(180deg, #2bb59a, #1f7a6c)`,
                    height: `${Math.max(6, (d.cents / maxBar) * 130)}px`,
                    transition: "height 0.6s ease",
                    animation: `admin-rise 0.5s ease both`,
                    animationDelay: `${i * 0.04}s`,
                    opacity: d.cents ? 1 : 0.25,
                  }}
                />
                <span style={{ fontSize: 9, color: "var(--ap-muted)" }}>{d.label.slice(3)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card admin-rise admin-rise-3" style={{ padding: "1.25rem" }}>
          <strong>Status mix</strong>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 12 }}>
            <svg width="140" height="140" viewBox="0 0 120 120">
              {arcs.map((a) => {
                const r = 46;
                const c = 2 * Math.PI * r;
                const len = (a.sweep / 360) * c;
                const rot = a.start - 90;
                return (
                  <circle
                    key={a.status}
                    cx="60"
                    cy="60"
                    r={r}
                    fill="none"
                    stroke={STATUS_COLOR[a.status] || "#64748b"}
                    strokeWidth="14"
                    strokeDasharray={`${len} ${c - len}`}
                    strokeDashoffset={0}
                    transform={`rotate(${rot} 60 60)`}
                    className="admin-chart-line"
                    style={{ opacity: 0.92 }}
                  />
                );
              })}
              <circle cx="60" cy="60" r="32" fill="rgba(255,255,255,0.85)" />
              <text x="60" y="56" textAnchor="middle" fontSize="16" fontWeight="700" fill="#123047">
                {stats.total}
              </text>
              <text x="60" y="72" textAnchor="middle" fontSize="8" fill="#5c7380">
                TOTAL
              </text>
            </svg>
            <div style={{ display: "grid", gap: 6, flex: 1 }}>
              {statusEntries.slice(0, 6).map(([status, n]) => (
                <div key={status} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 99,
                        background: STATUS_COLOR[status] || "#64748b",
                      }}
                    />
                    {labelStatus(status)}
                  </span>
                  <strong>{n}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card admin-rise admin-rise-4" style={{ padding: "1.25rem", marginTop: "1rem" }}>
        <strong>By state</strong>
        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          {stateEntries.map(([slug, n]) => (
            <div key={slug}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span>{stateLabel(slug)}</span>
                <strong>{n}</strong>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: "rgba(18,48,71,0.08)", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${(n / Math.max(1, stats.total)) * 100}%`,
                    height: "100%",
                    background: "linear-gradient(90deg,#1f7a6c,#2bb59a)",
                    transition: "width 0.7s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ApplicationsView() {
  const router = useRouter();
  const [items, setItems] = useState<ApplicationRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ApplicationRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [filters, setFilters] = useState({
    q: "",
    status: "",
    state: "",
    from: "",
    to: "",
    minAmount: "",
    maxAmount: "",
    sort: "newest",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams({ view: "list", page: String(page), pageSize: "25", sort: filters.sort });
    Object.entries(filters).forEach(([k, v]) => {
      if (k === "sort") return;
      if (v) {
        if (k === "minAmount" || k === "maxAmount") sp.set(k, String(Math.round(Number(v) * 100)));
        else sp.set(k, v);
      }
    });
    const [listRes, usersRes] = await Promise.all([
      fetch(`/api/admin/data?${sp}`),
      fetch("/api/admin/users"),
    ]);
    const data = await listRes.json();
    if (data.ok) {
      setItems(data.items);
      setTotal(data.total);
    }
    const usersData = await usersRes.json().catch(() => null);
    if (usersData?.ok && usersData.me) {
      setIsAdmin(usersData.me.role === "admin");
    }
    setLoading(false);
  }, [filters, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmDeleteApp() {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/admin/data?id=${encodeURIComponent(pendingDelete.id)}`, {
        method: "DELETE",
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setDeleteError(data.error || `Delete failed (${res.status})`);
        return;
      }
      setPendingDelete(null);
      void load();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  const pages = Math.max(1, Math.ceil(total / 25));

  return (
    <div>
      <div className="admin-rise" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 className="admin-title">Applications</h1>
          <p className="admin-sub">{total} matching records</p>
        </div>
        <button
          type="button"
          className="admin-btn-icon"
          onClick={() => void load()}
          disabled={loading}
          aria-label="Refresh applications"
          title="Refresh"
        >
          <RefreshCw size={16} className={loading ? "admin-spin" : undefined} />
        </button>
      </div>

      <div className="admin-card admin-rise admin-rise-1" style={{ padding: "1rem", marginTop: "1.2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, color: "var(--ap-muted)", fontSize: 13, fontWeight: 600 }}>
          <Filter size={15} /> Filters
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 10,
          }}
        >
          <label style={{ gridColumn: "span 2" }}>
            <div style={{ fontSize: 11, marginBottom: 4, color: "var(--ap-muted)" }}>Search</div>
            <div style={{ position: "relative" }}>
              <Search size={15} style={{ position: "absolute", left: 10, top: 12, opacity: 0.45 }} />
              <input
                className="admin-input"
                style={{ paddingLeft: 32 }}
                placeholder="Reference, email, name, phone"
                value={filters.q}
                onChange={(e) => {
                  setPage(1);
                  setFilters((f) => ({ ...f, q: e.target.value }));
                }}
              />
            </div>
          </label>
          <label>
            <div style={{ fontSize: 11, marginBottom: 4, color: "var(--ap-muted)" }}>Status</div>
            <select
              className="admin-select"
              value={filters.status}
              onChange={(e) => {
                setPage(1);
                setFilters((f) => ({ ...f, status: e.target.value }));
              }}
            >
              <option value="">All</option>
              {Object.keys(STATUS_COLOR).map((s) => (
                <option key={s} value={s}>
                  {labelStatus(s)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <div style={{ fontSize: 11, marginBottom: 4, color: "var(--ap-muted)" }}>State</div>
            <select
              className="admin-select"
              value={filters.state}
              onChange={(e) => {
                setPage(1);
                setFilters((f) => ({ ...f, state: e.target.value }));
              }}
            >
              <option value="">All</option>
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {stateLabel(s)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <div style={{ fontSize: 11, marginBottom: 4, color: "var(--ap-muted)" }}>From</div>
            <input
              type="date"
              className="admin-input"
              value={filters.from}
              onChange={(e) => {
                setPage(1);
                setFilters((f) => ({ ...f, from: e.target.value }));
              }}
            />
          </label>
          <label>
            <div style={{ fontSize: 11, marginBottom: 4, color: "var(--ap-muted)" }}>To</div>
            <input
              type="date"
              className="admin-input"
              value={filters.to}
              onChange={(e) => {
                setPage(1);
                setFilters((f) => ({ ...f, to: e.target.value }));
              }}
            />
          </label>
          <label>
            <div style={{ fontSize: 11, marginBottom: 4, color: "var(--ap-muted)" }}>Min $</div>
            <input
              className="admin-input"
              inputMode="decimal"
              placeholder="0"
              value={filters.minAmount}
              onChange={(e) => {
                setPage(1);
                setFilters((f) => ({ ...f, minAmount: e.target.value }));
              }}
            />
          </label>
          <label>
            <div style={{ fontSize: 11, marginBottom: 4, color: "var(--ap-muted)" }}>Max $</div>
            <input
              className="admin-input"
              inputMode="decimal"
              placeholder="999"
              value={filters.maxAmount}
              onChange={(e) => {
                setPage(1);
                setFilters((f) => ({ ...f, maxAmount: e.target.value }));
              }}
            />
          </label>
          <label>
            <div style={{ fontSize: 11, marginBottom: 4, color: "var(--ap-muted)" }}>Sort</div>
            <select
              className="admin-select"
              value={filters.sort}
              onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="amount_desc">Amount ↓</option>
              <option value="amount_asc">Amount ↑</option>
            </select>
          </label>
        </div>
      </div>

      <div className="admin-card admin-rise admin-rise-2" style={{ marginTop: "1rem", padding: 0 }}>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 48 }}>#</th>
                <th>Reference</th>
                <th>Customer</th>
                <th>State</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Submitted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: 24, color: "var(--ap-muted)" }}>
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 24, color: "var(--ap-muted)" }}>
                    No applications match these filters.
                  </td>
                </tr>
              ) : (
                items.map((app, idx) => (
                  <tr key={app.id}>
                    <td style={{ color: "var(--ap-muted)", fontVariantNumeric: "tabular-nums" }}>
                      {(page - 1) * 25 + idx + 1}
                    </td>
                    <td>
                      <strong style={{ letterSpacing: "-0.02em" }}>{app.reference}</strong>
                    </td>
                    <td>
                      <div>
                        {[app.firstName, app.lastName].filter(Boolean).join(" ") || "—"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ap-muted)" }}>{app.email}</div>
                    </td>
                    <td>{stateLabel(app.stateSlug)}</td>
                    <td>
                      <span
                        className="admin-pill"
                        style={{
                          background: `${STATUS_COLOR[app.status] || "#64748b"}22`,
                          color: STATUS_COLOR[app.status] || "#64748b",
                        }}
                      >
                        {labelStatus(app.status)}
                      </span>
                    </td>
                    <td>{money(app.amountCents)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {new Date(app.submittedAt).toLocaleString()}
                    </td>
                    <td style={{ position: "sticky", right: 0, background: "var(--ap-card, #fff)" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn-primary"
                          style={{ padding: "0.45rem 0.7rem", display: "inline-flex", gap: 4, alignItems: "center" }}
                          onClick={() => router.push(`/admin/applications/${app.id}`)}
                        >
                          Open <ArrowUpRight size={14} />
                        </button>
                        {isAdmin ? (
                          <button
                            type="button"
                            className="admin-btn"
                            aria-label={`Delete ${app.reference}`}
                            title="Delete application"
                            onClick={() => {
                              setDeleteError("");
                              setPendingDelete(app);
                            }}
                            style={{
                              padding: "0.45rem 0.65rem",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              background: "#fef2f2",
                              color: "#b91c1c",
                              border: "1px solid #fecaca",
                            }}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0.9rem 1rem", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "var(--ap-muted)" }}>
            Page {page} of {pages}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="admin-btn"
              style={{ background: "#fff", border: "1px solid var(--ap-line)" }}
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <button
              type="button"
              className="admin-btn"
              style={{ background: "#fff", border: "1px solid var(--ap-line)" }}
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this application?"
        body={
          pendingDelete
            ? `${pendingDelete.reference} (${pendingDelete.email || "no email"}) will be permanently removed from the ops list.`
            : ""
        }
        error={deleteError}
        confirmLabel="Delete application"
        busy={deleting}
        onCancel={() => {
          if (!deleting) {
            setPendingDelete(null);
            setDeleteError("");
          }
        }}
        onConfirm={() => void confirmDeleteApp()}
      />
    </div>
  );
}

export function ApplicationDetailView({ id }: { id: string }) {
  const router = useRouter();
  const [app, setApp] = useState<ApplicationRecord | null>(null);
  const [status, setStatus] = useState<ApplicationStatus>("received");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    void fetch(`/api/admin/data?view=one&id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setApp(d.app);
          setStatus(d.app.status);
          setReason(d.app.statusReason || "");
        }
      });
  }, [id]);

  const formEntries = useMemo(() => Object.entries(app?.formData ?? {}), [app]);

  async function saveStatus() {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/admin/data", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, reason: reason || undefined }),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.ok) {
      setMsg(data.error || "Update failed");
      return;
    }
    setApp(data.app);
    setMsg("Status updated");
  }

  if (!app) return <p className="admin-sub">Loading application…</p>;

  return (
    <div>
      <button
        type="button"
        onClick={() => router.push("/admin/applications")}
        style={{ background: "none", border: 0, color: "var(--ap-sea)", fontWeight: 600, cursor: "pointer", marginBottom: 8 }}
      >
        ← Back to applications
      </button>
      <div className="admin-rise">
        <h1 className="admin-title">{app.reference}</h1>
        <p className="admin-sub">
          {stateLabel(app.stateSlug)} · {[app.firstName, app.lastName].filter(Boolean).join(" ")} ·{" "}
          {app.email}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: "1rem",
          marginTop: "1.2rem",
        }}
        className="admin-detail-grid"
      >
        <style>{`@media (max-width:900px){.admin-detail-grid{grid-template-columns:1fr!important}}`}</style>

        <div className="admin-card admin-rise admin-rise-1" style={{ padding: "1.25rem" }}>
          <strong>Applicant data</strong>
          <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
            {formEntries.length === 0 ? (
              <span style={{ color: "var(--ap-muted)" }}>No form fields stored.</span>
            ) : (
              formEntries.map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "140px 1fr",
                    gap: 8,
                    fontSize: 13,
                    paddingBottom: 8,
                    borderBottom: "1px solid rgba(18,48,71,0.06)",
                  }}
                >
                  <span style={{ color: "var(--ap-muted)" }}>{k}</span>
                  <strong style={{ wordBreak: "break-word" }}>
                    {typeof v === "object" ? JSON.stringify(v) : String(v ?? "—")}
                  </strong>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ display: "grid", gap: "1rem", alignContent: "start" }}>
          <div className="admin-card admin-rise admin-rise-2" style={{ padding: "1.25rem" }}>
            <strong>Order</strong>
            <div style={{ marginTop: 12, display: "grid", gap: 8, fontSize: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ap-muted)" }}>Amount</span>
                <strong>{money(app.amountCents)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ap-muted)" }}>License</span>
                <strong>{app.licenseId}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ap-muted)" }}>Residency</span>
                <strong>{app.residency}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ap-muted)" }}>Phone</span>
                <strong>{app.phone || "—"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--ap-muted)" }}>Submitted</span>
                <strong>{new Date(app.submittedAt).toLocaleString()}</strong>
              </div>
            </div>
          </div>

          <div className="admin-card admin-rise admin-rise-3" style={{ padding: "1.25rem" }}>
            <strong>Update status</strong>
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value as ApplicationStatus)}>
                {Object.keys(STATUS_COLOR).map((s) => (
                  <option key={s} value={s}>
                    {labelStatus(s)}
                  </option>
                ))}
              </select>
              <input
                className="admin-input"
                placeholder="Reason (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <button type="button" className="admin-btn admin-btn-primary" disabled={saving} onClick={() => void saveStatus()}>
                {saving ? "Saving…" : "Save status"}
              </button>
              {msg ? <span style={{ fontSize: 13, color: "var(--ap-sea)" }}>{msg}</span> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.ok) {
      setError(data.error || "Login failed");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="admin-root" style={{ display: "grid", placeItems: "center", padding: 24 }}>
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="admin-card admin-rise"
        style={{ width: "min(420px, 100%)", padding: "2rem" }}
      >
        <div className="admin-brand" style={{ color: "var(--ap-ink)", marginBottom: 8 }}>
          Angler<span style={{ color: "var(--ap-sea)" }}>Permit</span>
        </div>
        <h1 className="admin-title" style={{ fontSize: "1.6rem" }}>
          Ops sign-in
        </h1>
        <p className="admin-sub">Sign in with your admin email and password.</p>
        <label style={{ display: "block", marginTop: 20 }}>
          <div style={{ fontSize: 12, marginBottom: 6, color: "var(--ap-muted)" }}>Email</div>
          <input
            className="admin-input"
            type="email"
            autoFocus
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </label>
        <label style={{ display: "block", marginTop: 12 }}>
          <div style={{ fontSize: 12, marginBottom: 6, color: "var(--ap-muted)" }}>Password</div>
          <input
            className="admin-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
          />
        </label>
        {error ? <p style={{ color: "#b91c1c", fontSize: 13, marginTop: 10 }}>{error}</p> : null}
        <button
          type="submit"
          className="admin-btn admin-btn-primary"
          style={{ width: "100%", marginTop: 16 }}
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function ConfirmDialog(props: {
  open: boolean;
  title: string;
  body: string;
  error?: string;
  confirmLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!props.open) return null;
  return (
    <div
      className="admin-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !props.busy) props.onCancel();
      }}
    >
      <div
        className="admin-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        aria-describedby="admin-confirm-desc"
      >
        <div className="admin-modal-icon" aria-hidden>
          <Trash2 size={22} />
        </div>
        <h2 id="admin-confirm-title" className="admin-modal-title">
          {props.title}
        </h2>
        <p id="admin-confirm-desc" className="admin-modal-body">
          {props.body}
        </p>
        {props.error ? (
          <p className="admin-modal-body" style={{ color: "#b91c1c", marginTop: 8 }} role="alert">
            {props.error}
          </p>
        ) : null}
        <div className="admin-modal-actions">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={props.onCancel}
            disabled={props.busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-danger"
            onClick={props.onConfirm}
            disabled={props.busy}
          >
            {props.busy ? "Deleting…" : props.confirmLabel || "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function UsersView() {
  const [users, setUsers] = useState<PublicAdminUser[]>([]);
  const [me, setMe] = useState<PublicAdminUser | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [msg, setMsg] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PublicAdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    if (data.ok) {
      setUsers(data.users);
      setMe(data.me);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setTempPassword("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, role }),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.ok) {
      setMsg(data.error || "Invite failed");
      return;
    }
    setTempPassword(data.temporaryPassword || "");
    if (data.emailDelivered) {
      setMsg(`Invite sent to ${data.user.email}. Status: pending until they sign in.`);
    } else {
      const resendHint =
        typeof data.emailError === "string" && /verify a domain|own email/i.test(data.emailError)
          ? " Resend test mode only delivers to your Resend account email (not +aliases). Verify a domain at resend.com/domains for teammates, or share the temp password below."
          : "";
      setMsg(
        `User created (pending). Email not delivered${data.emailError ? `: ${data.emailError}` : ""}.${resendHint}`,
      );
    }
    setEmail("");
    setName("");
    void load();
  }

  function requestDelete(u: PublicAdminUser) {
    if (me?.role !== "admin") return;
    if (u.role === "admin") {
      setMsg("Admins cannot delete other admins.");
      return;
    }
    if (u._id === me?._id) {
      setMsg("You cannot delete your own account.");
      return;
    }
    setPendingDelete(u);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/users?id=${encodeURIComponent(pendingDelete._id)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    setDeleting(false);
    if (!data.ok) {
      setMsg(data.error || "Delete failed");
      setPendingDelete(null);
      return;
    }
    setMsg(`Deleted ${pendingDelete.email}.`);
    setPendingDelete(null);
    void load();
  }

  return (
    <div>
      <div className="admin-rise">
        <h1 className="admin-title">Team access</h1>
        <p className="admin-sub">
          Invite teammates by email. They get a temporary password and login link; first login
          activates the account.
        </p>
      </div>

      {me?.role === "admin" ? (
        <form
          onSubmit={(e) => void invite(e)}
          className="admin-card admin-rise admin-rise-1"
          style={{ padding: "1.25rem", marginTop: "1.2rem", display: "grid", gap: 10 }}
        >
          <strong>Invite user</strong>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 10,
            }}
          >
            <label>
              <div style={{ fontSize: 11, marginBottom: 4, color: "var(--ap-muted)" }}>Email</div>
              <input
                className="admin-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@company.com"
              />
            </label>
            <label>
              <div style={{ fontSize: 11, marginBottom: 4, color: "var(--ap-muted)" }}>Name</div>
              <input
                className="admin-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Optional"
              />
            </label>
            <label>
              <div style={{ fontSize: 11, marginBottom: 4, color: "var(--ap-muted)" }}>Role</div>
              <select
                className="admin-select"
                value={role}
                onChange={(e) => setRole(e.target.value as "user" | "admin")}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </div>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={loading} style={{ width: "fit-content" }}>
            {loading ? "Inviting…" : "Create & email invite"}
          </button>
          {msg ? <p style={{ margin: 0, fontSize: 13, color: "var(--ap-sea)" }}>{msg}</p> : null}
          {tempPassword ? (
            <p style={{ margin: 0, fontSize: 13 }}>
              Temporary password: <code style={{ fontWeight: 700 }}>{tempPassword}</code>
            </p>
          ) : null}
        </form>
      ) : (
        <p className="admin-sub" style={{ marginTop: 16 }}>
          Only admins can invite new users.
        </p>
      )}

      <div className="admin-card admin-rise admin-rise-2" style={{ marginTop: "1rem", padding: 0 }}>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 48 }}>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                {me?.role === "admin" ? <th style={{ width: 56 }} /> : null}
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => {
                const canDelete =
                  me?.role === "admin" && u.role === "user" && u._id !== me._id;
                return (
                  <tr key={u._id}>
                    <td style={{ color: "var(--ap-muted)", fontVariantNumeric: "tabular-nums" }}>
                      {idx + 1}
                    </td>
                    <td>
                      <strong>{u.name}</strong>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>
                      <span
                        className="admin-pill"
                        style={{
                          background:
                            u.status === "active"
                              ? "#15803d22"
                              : u.status === "pending"
                                ? "#b4530922"
                                : "#64748b22",
                          color:
                            u.status === "active"
                              ? "#15803d"
                              : u.status === "pending"
                                ? "#b45309"
                                : "#64748b",
                        }}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleString()}</td>
                    {me?.role === "admin" ? (
                      <td>
                        {canDelete ? (
                          <button
                            type="button"
                            className="admin-btn-icon"
                            onClick={() => requestDelete(u)}
                            aria-label={`Delete ${u.email}`}
                            title="Delete user"
                            style={{ color: "#b91c1c" }}
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : null}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this user?"
        body={
          pendingDelete
            ? `${pendingDelete.email} will lose ops access immediately. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete user"
        busy={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
