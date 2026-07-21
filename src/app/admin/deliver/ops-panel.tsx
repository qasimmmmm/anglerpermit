"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";

/**
 * Team ops actions — request info (#9), refund (#10), cancel (#8),
 * mark processing. Same ADMIN_PANEL_SECRET as license delivery; all email
 * sends go through the idempotent pipeline server-side.
 */
export function OpsPanel() {
  const [secret, setSecret] = useState("");
  const [reference, setReference] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function run(action: string, extra?: Record<string, unknown>) {
    if (!secret.trim() || !reference.trim()) {
      setResult({ ok: false, text: "Enter the admin secret and an application reference." });
      return;
    }
    if (action === "refund" || action === "cancel") {
      const sure = window.confirm(
        action === "refund"
          ? "Refund the full charge for this application and email the customer?"
          : "Cancel this application and email the customer?",
      );
      if (!sure) return;
    }
    setBusy(action);
    setResult(null);
    try {
      const res = await fetch("/api/admin/ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: secret.trim(),
          action,
          reference: reference.trim(),
          ...(message.trim() ? { message: message.trim() } : {}),
          ...extra,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string; status?: string; refundTransactionId?: string };
      setResult(
        json.ok
          ? { ok: true, text: `Done — status: ${json.status ?? "updated"}${json.refundTransactionId ? ` (refund txn ${json.refundTransactionId})` : ""}` }
          : { ok: false, text: json.message ?? `Failed (${res.status})` },
      );
    } catch {
      setResult({ ok: false, text: "Could not reach the server." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="mt-10">
      <div className="space-y-5 px-6 py-6">
        <div>
          <h2 className="text-lg font-bold text-navy">Other actions</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Request info sends email #9 with your message below. Refund reverses the full charge
            via NMI and sends #10. Cancel sends #8. Every email is duplicate-proof.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Admin secret"
            name="opsSecret"
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
          <Input
            label="Application reference"
            name="opsReference"
            placeholder="AP-…"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </div>
        <Textarea
          label="Message (used by Request info; optional note for Cancel/Refund)"
          name="opsMessage"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          helpText="For Request info: exactly what you need from the customer, in plain English."
        />
        <div className="flex flex-wrap gap-3">
          <Button variant="accent" disabled={busy !== null} onClick={() => run("request-info")}>
            {busy === "request-info" ? "Sending…" : "Request info (#9)"}
          </Button>
          <Button variant="primary" disabled={busy !== null} onClick={() => run("mark-processing")}>
            {busy === "mark-processing" ? "Updating…" : "Mark processing"}
          </Button>
          <Button variant="outline" disabled={busy !== null} onClick={() => run("refund")}>
            {busy === "refund" ? "Refunding…" : "Refund (#10)"}
          </Button>
          <Button variant="outline" disabled={busy !== null} onClick={() => run("cancel")}>
            {busy === "cancel" ? "Cancelling…" : "Cancel (#8)"}
          </Button>
        </div>
        {result && (
          <p
            role="status"
            className={`text-sm font-medium ${result.ok ? "text-forest-700" : "text-red-600"}`}
          >
            {result.text}
          </p>
        )}
      </div>
    </Card>
  );
}
