import type { ApplicationStatus } from "@/lib/storage";

export const STATES = [
  "florida",
  "south-carolina",
  "michigan",
  "texas",
  "california",
  "colorado",
  "north-carolina",
] as const;

export const STATUS_COLOR: Record<string, string> = {
  pending_payment: "#b45309",
  payment_failed: "#b91c1c",
  received: "#0f766e",
  processing: "#1d4ed8",
  missing_info: "#c2410c",
  delivered: "#15803d",
  cancelled: "#64748b",
  refunded: "#6d28d9",
};

export const STATUS_BG: Record<string, string> = {
  pending_payment: "rgba(180, 83, 9, 0.12)",
  payment_failed: "rgba(185, 28, 28, 0.12)",
  received: "rgba(15, 118, 110, 0.12)",
  processing: "rgba(29, 78, 216, 0.12)",
  missing_info: "rgba(194, 65, 12, 0.12)",
  delivered: "rgba(21, 128, 61, 0.12)",
  cancelled: "rgba(100, 116, 139, 0.14)",
  refunded: "rgba(109, 40, 217, 0.12)",
};

const FIELD_LABELS: Record<string, string> = {
  firstName: "First name",
  lastName: "Last name",
  email: "Email",
  primaryPhone: "Phone",
  phone: "Phone",
  dateOfBirth: "Date of birth",
  gender: "Gender",
  suffix: "Suffix",
  heightFt: "Height (ft)",
  heightIn: "Height (in)",
  weightPounds: "Weight (lb)",
  idType: "ID type",
  idNumber: "ID number",
  driversLicenseState: "Driver license state",
  resStreet1: "Street",
  resStreet2: "Street 2",
  resCity: "City",
  resState: "State / region",
  resZip: "ZIP / postal",
  resCountry: "Country",
  michiganResident: "Michigan resident",
  licenseStartDate: "License start",
  updatesEmail: "Email updates",
  updatesText: "Text updates",
};

export function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function labelStatus(s: string) {
  return s.replace(/_/g, " ");
}

export function stateLabel(slug: string) {
  return slug
    .split("-")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

export function fieldLabel(key: string) {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function formatFieldValue(v: unknown): string {
  if (v == null || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

export function customerName(first?: string | null, last?: string | null) {
  const name = [first, last].filter(Boolean).join(" ").trim();
  return name || "—";
}

export const ALL_STATUSES = Object.keys(STATUS_COLOR) as ApplicationStatus[];
