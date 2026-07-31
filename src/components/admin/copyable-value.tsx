"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function toCopyText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

type Props = {
  value: unknown;
  /** Visible label when value is empty */
  empty?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Stronger weight for primary values */
  strong?: boolean;
  /**
   * When set, click navigates instead of copying (used for application reference → detail).
   */
  href?: string;
};

/**
 * Click any admin text value to copy it — no icon, click the text itself.
 * Pass `href` to open a page instead (reference → application detail).
 */
export function CopyableValue({
  value,
  empty = "—",
  className,
  style,
  strong = true,
  href,
}: Props) {
  const text = toCopyText(value);
  const emptyValue = !text.trim();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const onCopy = useCallback(async () => {
    if (emptyValue) return;
    const ok = await writeClipboard(text);
    if (!ok) return;
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1200);
  }, [emptyValue, text]);

  if (emptyValue) {
    return (
      <span className={className} style={{ color: "var(--ap-muted)", ...style }}>
        {empty}
      </span>
    );
  }

  const sharedClass = `admin-copyable${copied ? " is-copied" : ""}${className ? ` ${className}` : ""}`;
  const sharedStyle: React.CSSProperties = { fontWeight: strong ? 650 : 500, ...style };

  if (href) {
    return (
      <Link
        href={href}
        className={`${sharedClass} admin-copyable-link`}
        title="Open application"
        aria-label={`Open ${text}`}
        style={sharedStyle}
      >
        <span className="admin-copyable-text">{text}</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={sharedClass}
      onClick={() => void onCopy()}
      title={copied ? "Copied" : "Click to copy"}
      aria-label={copied ? "Copied" : `Copy ${text}`}
      style={sharedStyle}
    >
      <span className="admin-copyable-text">{text}</span>
      {copied ? <span className="admin-copyable-toast">Copied</span> : null}
    </button>
  );
}
