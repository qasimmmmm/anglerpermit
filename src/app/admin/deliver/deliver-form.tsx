"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";

const STATE_NAMES = [
  "California",
  "Colorado",
  "Florida",
  "Michigan",
  "North Carolina",
  "South Carolina",
  "Texas",
];

export function DeliverForm() {
  const [secret, setSecret] = useState("");
  const [to, setTo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [reference, setReference] = useState("");
  const [stateName, setStateName] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const files = fileRef.current?.files;
    if (!files || files.length === 0) {
      setError("Attach the issued license (PDF, PNG, or JPG).");
      return;
    }

    setStatus("sending");
    const form = new FormData();
    form.set("secret", secret);
    form.set("to", to.trim());
    form.set("customerName", customerName.trim());
    form.set("reference", reference.trim());
    form.set("stateName", stateName.trim());
    form.set("note", note.trim());
    for (const file of Array.from(files)) form.append("files", file);

    try {
      const res = await fetch("/api/admin/deliver-license", {
        method: "POST",
        body: form,
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };
      if (res.ok && json.ok) {
        setStatus("sent");
        return;
      }
      setError(json.message ?? "Send failed — check the fields and try again.");
      setStatus("idle");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <Card className="mt-8">
        <div className="px-6 py-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest-50">
            <CheckCircle2 className="h-8 w-8 text-forest-600" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-navy">License delivered</h2>
          <p className="mt-2 text-slate-600">
            Sent to <span className="font-semibold text-navy">{to.trim()}</span> — a copy is
            in the admin inbox.
          </p>
          <Button
            variant="outline"
            className="mt-8"
            onClick={() => {
              setTo("");
              setCustomerName("");
              setReference("");
              setNote("");
              if (fileRef.current) fileRef.current.value = "";
              setStatus("idle");
            }}
          >
            Deliver another
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <form onSubmit={handleSubmit} noValidate className="space-y-5 px-6 py-6">
        <Input
          label="Admin secret"
          name="secret"
          type="password"
          autoComplete="off"
          required
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          helpText="The ADMIN_PANEL_SECRET configured in Vercel."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Customer email"
            name="to"
            type="email"
            required
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <Input
            label="Customer name"
            name="customerName"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Reference"
            name="reference"
            placeholder="AP-…"
            required
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
          <div>
            <Input
              label="State"
              name="stateName"
              list="deliver-states"
              placeholder="Texas"
              required
              value={stateName}
              onChange={(e) => setStateName(e.target.value)}
            />
            <datalist id="deliver-states">
              {STATE_NAMES.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
        </div>
        <Textarea
          label="Personal note (optional)"
          name="note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          helpText="Shown in a highlighted box above the standard delivery copy."
        />
        <div>
          <label className="block text-sm font-medium text-navy" htmlFor="deliver-files">
            License file(s)
          </label>
          <input
            id="deliver-files"
            ref={fileRef}
            type="file"
            name="files"
            multiple
            accept="application/pdf,image/png,image/jpeg"
            className="mt-1.5 block w-full cursor-pointer rounded-lg border border-slate-300 bg-white text-sm text-slate-600 file:mr-4 file:cursor-pointer file:rounded-l-lg file:border-0 file:bg-navy file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-navy-700"
          />
          <p className="mt-1.5 text-xs text-slate-500">PDF, PNG, or JPG — up to 5 files, 15 MB combined.</p>
        </div>
        {error && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {error}
          </p>
        )}
        <Button type="submit" variant="accent" disabled={status === "sending"}>
          <Send className="h-4 w-4" aria-hidden="true" />
          {status === "sending" ? "Sending…" : "Send license email"}
        </Button>
      </form>
    </Card>
  );
}
