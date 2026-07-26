import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "Admin · AnglerPermit",
  robots: { index: false, follow: false },
};

/** System fonts only — avoids Google Fonts blocking first paint. */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: "ui-sans-serif, system-ui, Segoe UI, sans-serif" }}>{children}</div>;
}
