"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutDashboard,
  FileStack,
  LogOut,
  Search,
  Send,
  Users,
  RefreshCw,
  Trash2,
  Archive,
  ArrowLeft,
  MessageSquareWarning,
  Ban,
  CircleDollarSign,
  PlayCircle,
  CalendarClock,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import type { ApplicationRecord, ApplicationStatus } from "@/lib/storage";
import type { PublicAdminUser } from "@/lib/admin-users";
import { CopyableValue } from "@/components/admin/copyable-value";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { StatusPill } from "@/components/admin/status-pill";
import {
  ALL_STATUSES,
  STATES,
  STATUS_COLOR,
  attachmentFileName,
  companionNameKeysToHide,
  customerName,
  fieldLabel,
  formatFieldValue,
  isImagePreviewValue,
  isMaskedSsnValue,
  isPdfPreviewValue,
  labelStatus,
  money,
  stateLabel,
} from "@/components/admin/admin-utils";

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
    { href: "/admin/users", label: "Team", icon: Users },
    { href: "/admin/deliver", label: "Deliver", icon: Send },
  ];

  return (
    <div className="admin-root">
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-brand">
            Angler<span>Permit</span>
            <div className="admin-brand-sub">Operations</div>
          </div>
          <nav className="admin-nav">
            {links.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link key={href} href={href} prefetch={false} className={active ? "active" : undefined}>
                  <Icon size={17} />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <button
              type="button"
              className="admin-btn admin-btn-ghost"
              style={{ width: "100%" }}
              onClick={() => void logout()}
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
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
  mongoError?: string | null;
};

type DashboardProps = {
  /** Server-prefetched — first paint skips the loader entirely. */
  initialStats?: Stats | null;
  initialOrders?: ApplicationRecord[];
};

function DashboardBootLoader() {
  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Dashboard</h1>
          <p className="admin-sub">Loading overview…</p>
        </div>
      </div>
      <div className="admin-kpi-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="admin-card admin-kpi">
            <div className="admin-skeleton" style={{ width: "40%" }} />
            <div className="admin-skeleton" style={{ width: "55%", height: 28, marginTop: 12 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardView({ initialStats = null, initialOrders = [] }: DashboardProps) {
  const [stats, setStats] = useState<Stats | null>(initialStats);
  const [orders, setOrders] = useState<ApplicationRecord[]>(initialOrders);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!initialStats);
  const [refreshing, setRefreshing] = useState(false);
  /** Loader stays mounted in code; only becomes visible if fetch exceeds this delay. */
  const [loaderVisible, setLoaderVisible] = useState(false);
  const hasDataRef = useRef(Boolean(initialStats));

  useEffect(() => {
    hasDataRef.current = Boolean(stats);
  }, [stats]);

  const loadStats = useCallback(async (signal?: AbortSignal, fresh = false) => {
    const hasData = hasDataRef.current;
    if (hasData) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setLoaderVisible(false);
    }
    setError("");

    // Keep the loader — but only reveal it if we're still waiting after 200ms.
    // Fast responses never get a chance to paint it.
    let revealTimer: ReturnType<typeof setTimeout> | undefined;
    if (!hasData) {
      revealTimer = setTimeout(() => setLoaderVisible(true), 200);
    }

    try {
      const qs = fresh ? "view=dashboard&limit=10&fresh=1" : "view=dashboard&limit=10";
      const res = await fetch(`/api/admin/data?${qs}`, { signal });
      const d = await res.json();
      if (signal?.aborted) return;
      if (!d.ok) {
        setError(d.error || "Failed to load");
        if (!hasData) {
          setStats(null);
          setOrders([]);
        }
      } else {
        const payload = d as Stats & {
          orders?: ApplicationRecord[];
          ok?: boolean;
          statuses?: unknown;
          backend?: unknown;
        };
        const nextOrders = payload.orders;
        const rest: Stats = {
          total: payload.total,
          paidCount: payload.paidCount,
          revenueCents: payload.revenueCents,
          byStatus: payload.byStatus,
          byState: payload.byState,
          last14: payload.last14,
          mongoError: payload.mongoError,
        };
        setStats(rest);
        setError("");
        setOrders(Array.isArray(nextOrders) ? nextOrders : []);
        hasDataRef.current = true;
      }
    } catch (err) {
      if (signal?.aborted || (err instanceof DOMException && err.name === "AbortError")) return;
      setError("Could not load dashboard. Try refresh.");
      if (!hasData) {
        setStats(null);
        setOrders([]);
      }
    } finally {
      if (revealTimer) clearTimeout(revealTimer);
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
        setLoaderVisible(false);
      }
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    void loadStats(ctrl.signal, false);
    return () => ctrl.abort();
  }, [loadStats]);

  // Loader stays in the tree for cold boots. With server hydrate / fast API it never paints
  // (loading clears before the 200ms reveal), so users rarely see it — by design.
  if (loading && !stats && loaderVisible) {
    return <DashboardBootLoader />;
  }

  if (loading && !stats) {
    return null;
  }

  if (error && !stats) {
    return (
      <div>
        <p className="admin-alert admin-alert-error">{error}</p>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={() => void loadStats(undefined, true)}
        >
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const maxBar = Math.max(1, ...stats.last14.map((d) => d.cents));
  const statusEntries = Object.entries(stats.byStatus).sort((a, b) => b[1] - a[1]);
  const stateEntries = Object.entries(stats.byState).sort((a, b) => b[1] - a[1]);
  const donutTotal = statusEntries.reduce((s, [, n]) => s + n, 0) || 1;
  const pendingCount =
    (stats.byStatus.pending_payment ?? 0) + (stats.byStatus.payment_failed ?? 0);
  const needsAttention =
    (stats.byStatus.received ?? 0) + (stats.byStatus.missing_info ?? 0) + (stats.byStatus.processing ?? 0);
  const futurePendingCount = stats.byStatus.future_pending ?? 0;

  let angle = 0;
  const arcs = statusEntries.map(([status, n]) => {
    const sweep = (n / donutTotal) * 360;
    const start = angle;
    angle += sweep;
    return { status, n, start, sweep };
  });

  return (
    <div>
      <div className="admin-page-head admin-rise">
        <div>
          <h1 className="admin-title">Dashboard</h1>
          <p className="admin-sub">Orders, revenue, and queue health</p>
        </div>
        <button
          type="button"
          className="admin-btn-icon"
          onClick={() => void loadStats(undefined, true)}
          disabled={refreshing}
          aria-label="Refresh dashboard"
          title="Refresh"
        >
          <RefreshCw size={16} className={refreshing ? "admin-spin" : undefined} />
        </button>
      </div>

      {stats.mongoError ? (
        <p className="admin-alert admin-alert-warn">
          Database temporarily unreachable. Showing fallback data if available.
        </p>
      ) : null}

      <div className="admin-kpi-grid">
        {[
          { label: "Applications", value: String(stats.total), href: "/admin/applications" },
          { label: "Needs attention", value: String(needsAttention), href: "/admin/applications" },
          { label: "Awaiting payment", value: String(pendingCount), href: "/admin/applications?status=pending_payment" },
          {
            label: "Future pending",
            value: String(futurePendingCount),
            href: "/admin/applications?status=future_pending",
          },
          { label: "Paid orders", value: String(stats.paidCount), href: "/admin/applications" },
          { label: "Gross volume", value: money(stats.revenueCents) },
          {
            label: "Avg ticket",
            value: money(stats.paidCount ? Math.round(stats.revenueCents / stats.paidCount) : 0),
          },
        ].map((card, i) => (
          <div key={card.label} className={`admin-card admin-kpi admin-rise admin-rise-${(i % 4) + 1}`}>
            <div className="admin-kpi-label">{card.label}</div>
            {"href" in card && card.href ? (
              <Link href={card.href} prefetch={false} className="admin-stat-value admin-link" style={{ textDecoration: "none" }}>
                {card.value}
              </Link>
            ) : (
              <div className="admin-stat-value">{card.value}</div>
            )}
          </div>
        ))}
      </div>

      <div className="admin-card admin-rise admin-rise-2" style={{ padding: "1.1rem 1.15rem", marginTop: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <strong style={{ fontSize: "0.95rem" }}>Recent paid orders</strong>
          <Link href="/admin/applications" prefetch={false} className="admin-btn admin-btn-secondary" style={{ padding: "0.4rem 0.75rem", fontSize: 13 }}>
            View all
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="admin-sub" style={{ margin: 0 }}>
            No paid orders yet.
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-apps">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>State</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <Link
                        href={`/admin/applications/${app.id}`}
                        prefetch={false}
                        className="admin-link"
                      >
                        {app.reference}
                      </Link>
                    </td>
                    <td>
                      <CopyableValue
                        value={customerName(app.firstName, app.lastName)}
                        strong={false}
                      />
                    </td>
                    <td>
                      <CopyableValue value={app.email} strong={false} />
                    </td>
                    <td>
                      <CopyableValue value={stateLabel(app.stateSlug)} strong={false} />
                    </td>
                    <td>
                      <StatusPill status={app.status} />
                    </td>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>
                      <CopyableValue value={money(app.amountCents)} strong={false} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div
        className="admin-charts"
        style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: "0.85rem", marginTop: "0.85rem" }}
      >
        <div className="admin-card admin-rise admin-rise-2" style={{ padding: "1.15rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <strong style={{ fontSize: "0.95rem" }}>Revenue · last 14 days</strong>
            <span className="admin-muted" style={{ fontSize: "0.8rem" }}>
              USD
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 150 }}>
            {stats.last14.map((d) => (
              <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div
                  title={`${d.label}: ${money(d.cents)}`}
                  style={{
                    width: "100%",
                    borderRadius: 6,
                    background: varSea(),
                    height: `${Math.max(4, (d.cents / maxBar) * 120)}px`,
                    opacity: d.cents ? 1 : 0.22,
                  }}
                />
                <span style={{ fontSize: 9, color: "var(--ap-muted)" }}>{d.label.slice(3)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card admin-rise admin-rise-3" style={{ padding: "1.15rem" }}>
          <strong style={{ fontSize: "0.95rem" }}>Status mix</strong>
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 12 }}>
            <svg width="128" height="128" viewBox="0 0 120 120" aria-hidden>
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
                    strokeWidth="12"
                    strokeDasharray={`${len} ${c - len}`}
                    transform={`rotate(${rot} 60 60)`}
                    style={{ opacity: 0.92 }}
                  />
                );
              })}
              <circle cx="60" cy="60" r="34" fill="#fff" />
              <text x="60" y="56" textAnchor="middle" fontSize="16" fontWeight="700" fill="#102a3a">
                {stats.total}
              </text>
              <text x="60" y="72" textAnchor="middle" fontSize="8" fill="#5a7180">
                TOTAL
              </text>
            </svg>
            <div style={{ display: "grid", gap: 7, flex: 1 }}>
              {statusEntries.slice(0, 6).map(([status, n]) => (
                <div key={status} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, gap: 8 }}>
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
                  <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 650 }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card admin-rise admin-rise-4" style={{ padding: "1.15rem", marginTop: "0.85rem" }}>
        <strong style={{ fontSize: "0.95rem" }}>By state</strong>
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {stateEntries.map(([slug, n]) => (
            <div key={slug}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                <span>{stateLabel(slug)}</span>
                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 650 }}>{n}</span>
              </div>
              <div className="admin-bar-track">
                <div
                  className="admin-bar-fill"
                  style={{ width: `${(n / Math.max(1, stats.total)) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function varSea() {
  return "var(--ap-sea)";
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

/** Build a compact page list with ellipses, e.g. [1, "…", 4, 5, 6, "…", 20]. */
function buildPageItems(current: number, totalPages: number): Array<number | "…"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const items: Array<number | "…"> = [];
  const push = (v: number | "…") => {
    if (items[items.length - 1] !== v) items.push(v);
  };
  push(1);
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  if (start > 2) push("…");
  for (let p = start; p <= end; p++) push(p);
  if (end < totalPages - 1) push("…");
  push(totalPages);
  return items;
}

export function ApplicationsView() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") ?? "";
  const [items, setItems] = useState<ApplicationRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [pageJump, setPageJump] = useState("");
  const [loading, setLoading] = useState(true);
  /** Empty-state loader is kept; only revealed if fetch exceeds 200ms. */
  const [loaderVisible, setLoaderVisible] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<ApplicationRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [filters, setFilters] = useState({
    q: "",
    status: initialStatus,
    state: "",
    from: "",
    to: "",
    minAmount: "",
    maxAmount: "",
    sort: "newest",
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  useEffect(() => {
    const status = searchParams.get("status") ?? "";
    setFilters((f) => (f.status === status ? f : { ...f, status }));
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    const t = window.setTimeout(() => setAppliedFilters(filters), 300);
    return () => window.clearTimeout(t);
  }, [filters]);

  useEffect(() => {
    setPage(1);
  }, [appliedFilters, pageSize]);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setLoadError("");
      setLoaderVisible(false);
      // Loader stays — only reveal empty-state "Loading…" if the request is still open after 200ms.
      const revealTimer = setTimeout(() => setLoaderVisible(true), 200);
      const sp = new URLSearchParams({
        view: "list",
        page: String(page),
        pageSize: String(pageSize),
        sort: appliedFilters.sort,
      });
      Object.entries(appliedFilters).forEach(([k, v]) => {
        if (k === "sort") return;
        const trimmed = v.trim();
        if (!trimmed) return;
        if (k === "minAmount" || k === "maxAmount") {
          const n = Number(trimmed);
          if (!Number.isFinite(n)) return;
          sp.set(k, String(Math.round(n * 100)));
          return;
        }
        sp.set(k, trimmed);
      });
      try {
        const listRes = await fetch(`/api/admin/data?${sp}`, { signal });
        const data = await listRes.json();
        if (signal?.aborted) return;
        if (!data.ok) {
          setLoadError(data.error || "Failed to load applications");
          return;
        }
        setItems(Array.isArray(data.items) ? data.items : []);
        setTotal(typeof data.total === "number" ? data.total : 0);
      } catch (err) {
        if (signal?.aborted || (err instanceof DOMException && err.name === "AbortError")) return;
        setLoadError("Could not load applications. Try refresh.");
      } finally {
        clearTimeout(revealTimer);
        if (!signal?.aborted) {
          setLoading(false);
          setLoaderVisible(false);
        }
      }
    },
    [appliedFilters, page, pageSize],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    void load(ctrl.signal);
    return () => ctrl.abort();
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
        setDeleteError(data.error || `Archive failed (${res.status})`);
        return;
      }
      setPendingDelete(null);
      void load();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Archive failed");
    } finally {
      setDeleting(false);
    }
  }

  async function exportExcel() {
    setExporting(true);
    setExportError("");
    try {
      const sp = new URLSearchParams({ sort: appliedFilters.sort });
      Object.entries(appliedFilters).forEach(([k, v]) => {
        if (k === "sort") return;
        const trimmed = v.trim();
        if (!trimmed) return;
        if (k === "minAmount" || k === "maxAmount") {
          const n = Number(trimmed);
          if (!Number.isFinite(n)) return;
          sp.set(k, String(Math.round(n * 100)));
          return;
        }
        sp.set(k, trimmed);
      });
      const res = await fetch(`/api/admin/applications/export?${sp}`);
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setExportError(data.error || `Export failed (${res.status})`);
        return;
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") || "";
      const match = cd.match(/filename="([^"]+)"/);
      const filename = match?.[1] || `anglerpermit-applications-${new Date().toISOString().slice(0, 10)}.xlsx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const pageItems = buildPageItems(page, pages);
  const rangeFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeTo = Math.min(page * pageSize, total);

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  function goToPage(next: number) {
    const clamped = Math.min(pages, Math.max(1, next));
    setPage(clamped);
    setPageJump("");
  }

  function submitPageJump(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(pageJump.trim());
    if (!Number.isFinite(n)) return;
    goToPage(Math.round(n));
  }

  return (
    <div>
      <div className="admin-page-head admin-rise">
        <div>
          <h1 className="admin-title">Applications</h1>
          <p className="admin-sub">{total} matching records</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => void exportExcel()}
            disabled={exporting || loading || total === 0}
            title="Download filtered applications as Excel"
          >
            <Download size={16} />
            {exporting ? "Exporting…" : "Export Excel"}
          </button>
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
      </div>

      {loadError ? <p className="admin-alert admin-alert-error">{loadError}</p> : null}
      {exportError ? <p className="admin-alert admin-alert-error">{exportError}</p> : null}

      <div className="admin-card admin-rise admin-rise-1">
        <div className="admin-filters">
          <label>
            <div className="admin-field-label">Search</div>
            <div style={{ position: "relative" }}>
              <Search size={15} style={{ position: "absolute", left: 10, top: 11, opacity: 0.4 }} />
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
            <div className="admin-field-label">Status</div>
            <select
              className="admin-select"
              value={filters.status}
              onChange={(e) => {
                setPage(1);
                setFilters((f) => ({ ...f, status: e.target.value }));
              }}
            >
              <option value="">All</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {labelStatus(s)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <div className="admin-field-label">State</div>
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
            <div className="admin-field-label">From</div>
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
            <div className="admin-field-label">To</div>
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
            <div className="admin-field-label">Sort</div>
            <select
              className="admin-select"
              value={filters.sort}
              onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="amount_desc">Amount high → low</option>
              <option value="amount_asc">Amount low → high</option>
            </select>
          </label>
        </div>
      </div>

      <div className="admin-card admin-rise admin-rise-2" style={{ marginTop: "0.85rem", padding: 0 }}>
        <div className="admin-table-wrap" style={{ opacity: loading && items.length > 0 ? 0.65 : 1 }}>
          <table className="admin-table admin-table-apps">
            <thead>
              <tr>
                <th className="admin-col-num">#</th>
                <th>Reference</th>
                <th>Customer</th>
                <th>Email</th>
                <th>State</th>
                <th>Status</th>
                <th>License expiry</th>
                <th>Amount</th>
                <th>Submitted</th>
                <th className="admin-col-action" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 && loaderVisible ? (
                <tr>
                  <td colSpan={10} style={{ padding: 24 }} className="admin-muted">
                    Loading…
                  </td>
                </tr>
              ) : !loading && items.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: 24 }} className="admin-muted">
                    No applications match these filters.
                  </td>
                </tr>
              ) : (
                items.map((app, idx) => (
                  <tr key={app.id}>
                    <td className="admin-col-num">{(page - 1) * pageSize + idx + 1}</td>
                    <td>
                      <Link
                        href={`/admin/applications/${app.id}`}
                        prefetch={false}
                        className="admin-link"
                      >
                        {app.reference}
                      </Link>
                    </td>
                    <td>
                      <CopyableValue
                        value={customerName(app.firstName, app.lastName)}
                        strong={false}
                      />
                    </td>
                    <td>
                      <CopyableValue value={app.email} strong={false} />
                    </td>
                    <td>
                      <CopyableValue value={stateLabel(app.stateSlug)} strong={false} />
                    </td>
                    <td>
                      <StatusPill status={app.status} />
                    </td>
                    <td className="admin-muted" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {app.existingLicenseExpiresOn || "—"}
                    </td>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>
                      <CopyableValue value={money(app.amountCents)} strong={false} />
                    </td>
                    <td className="admin-muted">{new Date(app.submittedAt).toLocaleString()}</td>
                    <td className="admin-col-action">
                      <button
                        type="button"
                        className="admin-archive-btn"
                        aria-label={`Archive ${app.reference}`}
                        title="Archive"
                        onClick={() => {
                          setDeleteError("");
                          setPendingDelete(app);
                        }}
                      >
                        <Archive size={15} strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="admin-pagination">
          <div className="admin-pagination-meta">
            <span>
              {total === 0
                ? "No records"
                : `Showing ${rangeFrom.toLocaleString()}–${rangeTo.toLocaleString()} of ${total.toLocaleString()}`}
            </span>
            <label className="admin-pagination-size">
              <span>Rows</span>
              <select
                className="admin-select"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                aria-label="Records per page"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="admin-pagination-controls">
            <button
              type="button"
              className="admin-page-btn"
              disabled={page <= 1 || loading}
              onClick={() => goToPage(1)}
              aria-label="First page"
              title="First page"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              type="button"
              className="admin-page-btn"
              disabled={page <= 1 || loading}
              onClick={() => goToPage(page - 1)}
              aria-label="Previous page"
              title="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="admin-page-numbers" role="navigation" aria-label="Pagination">
              {pageItems.map((item, i) =>
                item === "…" ? (
                  <span key={`e-${i}`} className="admin-page-ellipsis" aria-hidden>
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    className={`admin-page-btn admin-page-num${item === page ? " is-active" : ""}`}
                    disabled={loading}
                    aria-current={item === page ? "page" : undefined}
                    onClick={() => goToPage(item)}
                  >
                    {item}
                  </button>
                ),
              )}
            </div>

            <button
              type="button"
              className="admin-page-btn"
              disabled={page >= pages || loading}
              onClick={() => goToPage(page + 1)}
              aria-label="Next page"
              title="Next page"
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              className="admin-page-btn"
              disabled={page >= pages || loading}
              onClick={() => goToPage(pages)}
              aria-label="Last page"
              title="Last page"
            >
              <ChevronsRight size={16} />
            </button>

            <form className="admin-page-jump" onSubmit={submitPageJump}>
              <label htmlFor="admin-page-jump-input">Go to</label>
              <input
                id="admin-page-jump-input"
                className="admin-input"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={`${page}`}
                value={pageJump}
                onChange={(e) => setPageJump(e.target.value.replace(/[^\d]/g, ""))}
                aria-label="Jump to page number"
              />
              <button type="submit" className="admin-btn admin-btn-secondary" disabled={loading || !pageJump}>
                Go
              </button>
            </form>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        variant="warning"
        title="Archive this application?"
        body={
          pendingDelete
            ? `${pendingDelete.reference} (${pendingDelete.email || "no email"}) will be hidden from the ops list. This is a soft delete — the record is kept.`
            : ""
        }
        error={deleteError}
        confirmLabel="Archive"
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

interface LicenseSummary {
  name: string;
  duration: string;
  startDate: string | null;
  endDate: string | null;
  formatted: string | null;
}

export function ApplicationDetailView({ id }: { id: string }) {
  const router = useRouter();
  const [app, setApp] = useState<ApplicationRecord | null>(null);
  const [licenseSummary, setLicenseSummary] = useState<LicenseSummary | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("received");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [opsMsg, setOpsMsg] = useState("");
  const [opsBusy, setOpsBusy] = useState("");
  const [infoAsk, setInfoAsk] = useState("");
  const [forceInfo, setForceInfo] = useState(false);
  const [futureExpiry, setFutureExpiry] = useState("");
  const [futureNote, setFutureNote] = useState("");

  const reload = useCallback(
    async (signal?: AbortSignal) => {
      setError("");
      try {
        const res = await fetch(`/api/admin/data?view=one&id=${encodeURIComponent(id)}`, { signal });
        const d = await res.json();
        if (signal?.aborted) return;
        if (!d.ok) {
          setError(d.error || "Failed to load application");
          setApp(null);
          return;
        }
        setApp(d.app);
        setLicenseSummary((d.licenseSummary as LicenseSummary | null) ?? null);
        setStatus(d.app.status);
        setReason(d.app.statusReason || "");
        setFutureExpiry(d.app.existingLicenseExpiresOn || "");
        setFutureNote(d.app.status === "future_pending" ? d.app.statusReason || "" : "");
      } catch (err) {
        if (signal?.aborted || (err instanceof DOMException && err.name === "AbortError")) return;
        setError("Could not load application.");
      }
    },
    [id],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    void reload(ctrl.signal);
    return () => ctrl.abort();
  }, [reload]);

  const formEntries = useMemo(() => {
    const formData = app?.formData ?? {};
    const hideNames = companionNameKeysToHide(formData);
    const entries = Object.entries(formData).filter(([k]) => !hideNames.has(k));
    const order = [
      "firstName",
      "lastName",
      "suffix",
      "email",
      "primaryPhone",
      "phone",
      "dateOfBirth",
      "gender",
      "heightFt",
      "heightIn",
      "weightPounds",
      "idType",
      "idNumber",
      "driversLicenseState",
      "dlFrontData",
      "dlBackData",
      "dlUploadData",
      "resStreet1",
      "resStreet2",
      "address",
      "attentionLine",
      "resCity",
      "city",
      "resState",
      "state",
      "resZip",
      "zipCode",
      "resCountry",
      "country",
      "internationalProvince",
      "michiganResident",
      "licenseStartDate",
      "updatesEmail",
      "updatesText",
    ];
    const rank = (k: string) => {
      const i = order.indexOf(k);
      return i === -1 ? 1000 + k.localeCompare("") : i;
    };
    return entries.sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0]));
  }, [app]);

  async function saveStatus() {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/data", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, reason: reason || undefined }),
      });
      const data = await res.json();
      if (!data.ok) {
        setMsg(data.error || "Update failed");
        return;
      }
      setApp(data.app);
      setMsg("Status updated");
    } catch {
      setMsg("Network error — status not saved");
    } finally {
      setSaving(false);
    }
  }

  async function runOps(
    action: "mark-processing" | "request-info" | "mark-future-pending" | "cancel" | "refund",
  ) {
    if (!app) return;
    setOpsBusy(action);
    setOpsMsg("");
    try {
      const res = await fetch("/api/admin/ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reference: app.reference,
          message:
            action === "request-info"
              ? infoAsk
              : action === "mark-future-pending"
                ? futureNote || undefined
                : reason || undefined,
          force: action === "request-info" ? forceInfo : undefined,
          existingLicenseExpiresOn:
            action === "mark-future-pending" ? futureExpiry || undefined : undefined,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setOpsMsg(data.message || "Action failed");
        return;
      }
      setOpsMsg(
        action === "refund"
          ? `Refunded · ${data.refundTransactionId || "ok"}`
          : `Updated to ${labelStatus(data.status)}`,
      );
      void reload();
    } catch {
      setOpsMsg("Network error — action not completed");
    } finally {
      setOpsBusy("");
    }
  }

  if (!app && !error) {
    return <p className="admin-sub">Loading application…</p>;
  }

  if (error && !app) {
    return (
      <div>
        <button type="button" className="admin-back" onClick={() => router.push("/admin/applications")}>
          <ArrowLeft size={16} /> Back to applications
        </button>
        <p className="admin-alert admin-alert-error">{error}</p>
        <button type="button" className="admin-btn admin-btn-primary" onClick={() => void reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (!app) return null;

  return (
    <div>
      <button type="button" className="admin-back" onClick={() => router.push("/admin/applications")}>
        <ArrowLeft size={16} /> Back to applications
      </button>

      <div className="admin-rise">
        <h1 className="admin-title">
          <CopyableValue value={app.reference} />
        </h1>
        <div className="admin-meta-row admin-sub">
          <span>{stateLabel(app.stateSlug)}</span>
          <span className="admin-dot-sep">·</span>
          <span>{customerName(app.firstName, app.lastName)}</span>
          <span className="admin-dot-sep">·</span>
          <CopyableValue value={app.email} strong={false} />
          <span className="admin-dot-sep">·</span>
          <StatusPill status={app.status} />
        </div>
      </div>

      <div
        className="admin-detail-grid"
        style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "0.85rem", marginTop: "1.15rem" }}
      >
        <div className="admin-card admin-rise admin-rise-1" style={{ padding: "1.15rem" }}>
          <strong style={{ fontSize: "0.95rem" }}>Applicant</strong>
          <dl style={{ margin: "12px 0 0" }}>
            {formEntries.length === 0 ? (
              <p className="admin-muted" style={{ margin: 0 }}>
                No form fields stored.
              </p>
            ) : (
              formEntries.map(([k, v]) => {
                const maskedSsn = isMaskedSsnValue(k, v);
                const fileName = attachmentFileName(app.formData ?? {}, k);
                if (isImagePreviewValue(v)) {
                  return (
                    <div key={k} className="admin-kv admin-kv-media">
                      <dt>{fieldLabel(k)}</dt>
                      <dd>
                        <figure className="admin-id-preview">
                          <img src={v} alt={fieldLabel(k)} />
                          {fileName ? <figcaption>{fileName}</figcaption> : null}
                        </figure>
                      </dd>
                    </div>
                  );
                }
                if (isPdfPreviewValue(v)) {
                  return (
                    <div key={k} className="admin-kv admin-kv-media">
                      <dt>{fieldLabel(k)}</dt>
                      <dd>
                        <figure className="admin-id-preview admin-id-preview-pdf">
                          <object data={v} type="application/pdf" title={fieldLabel(k)}>
                            <p className="admin-muted" style={{ margin: 0, fontSize: 12 }}>
                              PDF uploaded{fileName ? ` (${fileName})` : ""}. Preview unavailable in
                              this browser.
                            </p>
                          </object>
                          {fileName ? <figcaption>{fileName}</figcaption> : null}
                        </figure>
                      </dd>
                    </div>
                  );
                }
                const display = formatFieldValue(v);
                return (
                  <div key={k} className="admin-kv">
                    <dt>{fieldLabel(k)}</dt>
                    <dd>
                      <CopyableValue value={display} strong={false} />
                      {maskedSsn ? (
                        <p className="admin-muted" style={{ margin: "4px 0 0", fontSize: 12 }}>
                          Full SSN was not saved for this order. Use{" "}
                          <strong>Request info</strong> to ask the customer for it.
                        </p>
                      ) : null}
                    </dd>
                  </div>
                );
              })
            )}
          </dl>
        </div>

        <div style={{ display: "grid", gap: "0.85rem", alignContent: "start" }}>
          <div className="admin-card admin-rise admin-rise-2" style={{ padding: "1.15rem" }}>
            <strong style={{ fontSize: "0.95rem" }}>Order</strong>
            <div style={{ marginTop: 12, display: "grid", gap: 10, fontSize: 14 }}>
              {[
                ["Amount", money(app.amountCents)],
                ["State", stateLabel(app.stateSlug)],
                ["License", licenseSummary?.name ?? app.licenseId],
                ...(licenseSummary?.formatted
                  ? ([["Valid", licenseSummary.formatted]] as [string, string][])
                  : []),
                ["Residency", app.residency],
                ["Phone", app.phone],
                ["Submitted", new Date(app.submittedAt).toLocaleString()],
                ...(app.existingLicenseExpiresOn
                  ? ([["Current license expiry", app.existingLicenseExpiresOn]] as [string, string][])
                  : []),
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span className="admin-muted">{label}</span>
                  <CopyableValue value={value || "—"} strong={false} />
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card admin-rise admin-rise-3" style={{ padding: "1.15rem" }}>
            <strong style={{ fontSize: "0.95rem" }}>Ops actions</strong>
            <p className="admin-sub" style={{ marginTop: 6, fontSize: 13 }}>
              These actions update order status and notify the customer when applicable.
            </p>
            <div className="admin-actions-row" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={!!opsBusy || app.status === "processing"}
                onClick={() => void runOps("mark-processing")}
              >
                <PlayCircle size={15} />
                {opsBusy === "mark-processing" ? "Working…" : "Mark processing"}
              </button>
              <Link
                href={`/admin/deliver?reference=${encodeURIComponent(app.reference)}`}
                prefetch={false}
                className="admin-btn admin-btn-primary"
              >
                <Send size={15} /> Deliver license
              </Link>
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
              <textarea
                className="admin-textarea"
                placeholder="What do you need from the customer?"
                value={infoAsk}
                onChange={(e) => setInfoAsk(e.target.value)}
              />
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={forceInfo}
                  onChange={(e) => setForceInfo(e.target.checked)}
                />
                Force resend if already requested
              </label>
              <button
                type="button"
                className="admin-btn admin-btn-warn"
                disabled={!!opsBusy || !infoAsk.trim()}
                onClick={() => void runOps("request-info")}
              >
                <MessageSquareWarning size={15} />
                {opsBusy === "request-info" ? "Sending…" : "Request info"}
              </button>
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
              <p className="admin-sub" style={{ margin: 0, fontSize: 13 }}>
                Park when the customer already has an active annual license. Process after the
                expiry date.
              </p>
              <label>
                <div className="admin-field-label">Current license expiry</div>
                <input
                  type="date"
                  className="admin-input"
                  value={futureExpiry}
                  onChange={(e) => setFutureExpiry(e.target.value)}
                />
              </label>
              <input
                className="admin-input"
                placeholder="Note (optional)"
                value={futureNote}
                onChange={(e) => setFutureNote(e.target.value)}
              />
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={
                  !!opsBusy ||
                  !futureExpiry ||
                  ["cancelled", "refunded", "delivered"].includes(app.status)
                }
                onClick={() => void runOps("mark-future-pending")}
              >
                <CalendarClock size={15} />
                {opsBusy === "mark-future-pending"
                  ? "Saving…"
                  : app.status === "future_pending"
                    ? "Update future pending"
                    : "Mark future pending"}
              </button>
            </div>

            <div className="admin-actions-row" style={{ marginTop: 14 }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={!!opsBusy || ["cancelled", "refunded"].includes(app.status)}
                onClick={() => void runOps("cancel")}
              >
                <Ban size={15} />
                {opsBusy === "cancel" ? "Working…" : "Cancel order"}
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                disabled={!!opsBusy || app.status === "refunded"}
                onClick={() => void runOps("refund")}
              >
                <CircleDollarSign size={15} />
                {opsBusy === "refund" ? "Working…" : "Refund"}
              </button>
            </div>
            {opsMsg ? (
              <p
                className={`admin-alert ${opsMsg.includes("fail") || opsMsg.includes("error") || opsMsg.includes("No ") || opsMsg.includes("Already") || opsMsg.includes("rejected") || opsMsg.includes("Unauthorized") || opsMsg.includes("Database") ? "admin-alert-error" : "admin-alert-ok"}`}
                style={{ marginBottom: 0 }}
              >
                {opsMsg}
              </p>
            ) : null}
          </div>

          <div className="admin-card admin-rise admin-rise-4" style={{ padding: "1.15rem" }}>
            <strong style={{ fontSize: "0.95rem" }}>Manual status</strong>
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              <select
                className="admin-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
              >
                {ALL_STATUSES.map((s) => (
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
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                disabled={saving}
                onClick={() => void saveStatus()}
              >
                {saving ? "Saving…" : "Save status"}
              </button>
              {msg ? (
                <span style={{ fontSize: 13, color: msg.includes("fail") || msg.includes("error") ? "#b91c1c" : "var(--ap-sea)" }}>
                  {msg}
                </span>
              ) : null}
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
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Login failed");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error — could not sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-root admin-login-wrap">
      <form onSubmit={(e) => void onSubmit(e)} className="admin-card admin-rise" style={{ width: "min(400px, 100%)", padding: "2rem" }}>
        <div className="admin-brand" style={{ color: "var(--ap-ink)", marginBottom: 4 }}>
          Angler<span style={{ color: "var(--ap-sea)" }}>Permit</span>
        </div>
        <h1 className="admin-title" style={{ fontSize: "1.5rem" }}>
          Ops sign-in
        </h1>
        <p className="admin-sub">Sign in with your admin email and password.</p>
        <label style={{ display: "block", marginTop: 20 }}>
          <div className="admin-field-label">Email</div>
          <input
            className="admin-input"
            type="email"
            autoFocus
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
          />
        </label>
        <label style={{ display: "block", marginTop: 12 }}>
          <div className="admin-field-label">Password</div>
          <input
            className="admin-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />
        </label>
        {error ? <p className="admin-alert admin-alert-error">{error}</p> : null}
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

export function UsersView() {
  const [users, setUsers] = useState<PublicAdminUser[]>([]);
  const [me, setMe] = useState<PublicAdminUser | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [msg, setMsg] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<PublicAdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setListLoading(true);
    setListError("");
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.ok) {
        setUsers(data.users);
        setMe(data.me);
      } else {
        setListError(data.error || "Failed to load users");
      }
    } catch {
      setListError("Could not load team.");
    } finally {
      setListLoading(false);
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
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role }),
      });
      const data = await res.json();
      if (!data.ok) {
        setMsg(data.error || "Invite failed");
        return;
      }
      setTempPassword(data.temporaryPassword || "");
      if (data.emailDelivered) {
        setMsg(`Invite sent to ${data.user.email}. Status: pending until they sign in.`);
      } else {
        setMsg(
          `User created (pending). Email not delivered${data.emailError ? `: ${data.emailError}` : ""}. Share the temp password below.`,
        );
      }
      setEmail("");
      setName("");
      void load();
    } catch {
      setMsg("Network error — invite failed");
    } finally {
      setLoading(false);
    }
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
    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(pendingDelete._id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.ok) {
        setMsg(data.error || "Delete failed");
        setPendingDelete(null);
        return;
      }
      setMsg(`Deleted ${pendingDelete.email}.`);
      setPendingDelete(null);
      void load();
    } catch {
      setMsg("Network error — delete failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="admin-page-head admin-rise">
        <div>
          <h1 className="admin-title">Team</h1>
          <p className="admin-sub">
            Invite teammates by email. They receive a temporary password; first login activates the account.
          </p>
        </div>
      </div>

      {me?.role === "admin" ? (
        <form
          onSubmit={(e) => void invite(e)}
          className="admin-card admin-rise admin-rise-1"
          style={{ padding: "1.15rem", display: "grid", gap: 10 }}
        >
          <strong style={{ fontSize: "0.95rem" }}>Invite user</strong>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
            <label>
              <div className="admin-field-label">Email</div>
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
              <div className="admin-field-label">Name</div>
              <input
                className="admin-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Optional"
              />
            </label>
            <label>
              <div className="admin-field-label">Role</div>
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
              Temporary password:{" "}
              <CopyableValue value={tempPassword} style={{ fontFamily: "ui-monospace, monospace" }} />
            </p>
          ) : null}
        </form>
      ) : (
        <p className="admin-sub">Only admins can invite new users.</p>
      )}

      {listError ? <p className="admin-alert admin-alert-error">{listError}</p> : null}

      <div className="admin-card admin-rise admin-rise-2" style={{ marginTop: "0.85rem", padding: 0 }}>
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
              {listLoading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 24 }} className="admin-muted">
                    Loading team…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 24 }} className="admin-muted">
                    No users yet.
                  </td>
                </tr>
              ) : (
                users.map((u, idx) => {
                  const canDelete = me?.role === "admin" && u.role === "user" && u._id !== me._id;
                  return (
                    <tr key={u._id}>
                      <td className="admin-col-num">{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{u.name || "—"}</td>
                      <td>
                        <CopyableValue value={u.email} strong={false} />
                      </td>
                      <td className="admin-muted">{u.role}</td>
                      <td>
                        <span
                          className="admin-pill"
                          style={{
                            background:
                              u.status === "active"
                                ? "rgba(21, 128, 61, 0.12)"
                                : u.status === "pending"
                                  ? "rgba(180, 83, 9, 0.12)"
                                  : "rgba(100, 116, 139, 0.14)",
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
                      <td className="admin-muted">{new Date(u.createdAt).toLocaleString()}</td>
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
                })
              )}
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
