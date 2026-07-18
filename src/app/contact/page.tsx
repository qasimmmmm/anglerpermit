"use client";

import { useState } from "react";
import { Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";

/**
 * Contact page — presentational only.
 * Builds a mailto: draft from the form contents; no data is stored or sent
 * through our servers. (A routed contact endpoint can be added later.)
 */
export default function ContactPage() {
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
    <>
      <section className="bg-navy py-16 text-white sm:py-20">
        <div className="container-site max-w-3xl">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Contact us</h1>
          <p className="mt-4 text-lg text-slate-300">
            Questions about an application, a license, or our service? We typically reply
            within one business day.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container-site grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold">Reach us directly</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Email is the fastest way to reach the team. If your question is about an
              existing application, include your reference number (it starts with
              &ldquo;AP-&rdquo;).
            </p>
            <a
              href="mailto:support@anglerpermit.com"
              className="mt-5 inline-flex items-center gap-2 font-semibold text-forest-700 hover:text-forest-500"
            >
              <Mail className="h-5 w-5" aria-hidden="true" />
              support@anglerpermit.com
            </a>
            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
              <h3 className="text-sm font-semibold text-navy">Before you write</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-600">
                <li>
                  Many answers are in our{" "}
                  <a href="/faq" className="font-medium text-forest-700 underline">
                    FAQ
                  </a>
                  .
                </li>
                <li>
                  Never email full Social Security numbers or payment card details — we
                  will never ask for them by email.
                </li>
                <li>
                  For urgent licensing questions you can also contact your state agency
                  directly via the official portal linked on each state page.
                </li>
              </ul>
            </div>
          </div>

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
        </div>
      </section>
    </>
  );
}
