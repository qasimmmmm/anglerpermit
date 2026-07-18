"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";

/**
 * Contact form — presentational only.
 * Builds a mailto: draft from the form contents; no data is stored or sent
 * through our servers. (A routed contact endpoint can be added later.)
 */
export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reference, setReference] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in your name, email, and message.");
      return;
    }
    setError(null);
    const subject = encodeURIComponent(
      `AnglerPermit support${reference.trim() ? ` — ${reference.trim()}` : ""}`,
    );
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nReference: ${reference || "—"}\n\n${message}`,
    );
    window.location.href = `mailto:support@anglerpermit.com?subject=${subject}&body=${body}`;
  }

  return (
    <Card className="lg:col-span-3">
      <form onSubmit={handleSubmit} noValidate className="space-y-5 px-6 py-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Your name"
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Input
          label="Application reference (optional)"
          name="reference"
          placeholder="AP-…"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          helpText="Found in your confirmation screen after submitting an application."
        />
        <Textarea
          label="Message"
          name="message"
          rows={6}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        {error && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {error}
          </p>
        )}
        <Button type="submit" variant="accent">
          <Send className="h-4 w-4" aria-hidden="true" />
          Compose email
        </Button>
        <p className="text-xs leading-relaxed text-slate-500">
          This form opens a draft in your own email program — nothing is sent to or
          stored on our servers from this page.
        </p>
      </form>
    </Card>
  );
}
