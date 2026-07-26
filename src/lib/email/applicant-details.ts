import type { StateConfig } from "@/lib/state-config";
import { detailCard, detailRow, esc } from "./email-layout";

function formatValue(value: unknown): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function prettyKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

/**
 * Renders every submitted applicant field in state-config order (then extras).
 * Expects MASKED data only (SSN already ***-**-####).
 */
export function buildApplicantDetails(
  config: StateConfig | null | undefined,
  data: Record<string, unknown> | null | undefined,
  opts?: { heading?: string },
): { html: string; textLines: string[] } {
  if (!data || Object.keys(data).length === 0) {
    return { html: "", textLines: [] };
  }

  const heading = opts?.heading ?? "Your application details";
  const rendered = new Set<string>();
  const rows: string[] = [];
  const textLines: string[] = [];

  if (config) {
    for (const field of config.formFields) {
      if (!(field.name in data)) continue;
      rendered.add(field.name);
      const value = formatValue(data[field.name]);
      const label = field.label.replace(/:\s*$/, "");
      rows.push(detailRow(label, esc(value)));
      textLines.push(`${label}: ${value}`);
    }
  }

  for (const [key, value] of Object.entries(data)) {
    if (rendered.has(key)) continue;
    const v = formatValue(value);
    const label = prettyKey(key);
    rows.push(detailRow(label, esc(v)));
    textLines.push(`${label}: ${v}`);
  }

  if (!rows.length) return { html: "", textLines: [] };

  return {
    html: `${detailCard(rows.join(""), { heading })}
    <p style="margin:10px 0 0;font-size:12px;line-height:1.5;color:#64748B;">
      Sensitive identifiers such as Social Security numbers are masked (***-**-last4) for your security.
    </p>`,
    textLines: [
      heading.toUpperCase(),
      ...textLines,
      "",
      "Sensitive identifiers such as Social Security numbers are masked (***-**-last4) for your security.",
    ],
  };
}
