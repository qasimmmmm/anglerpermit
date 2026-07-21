import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://anglerpermit.com"),
  title: {
    default: "AnglerPermit — Fishing licenses without the paperwork",
    template: "%s | AnglerPermit",
  },
  description:
    "AnglerPermit is a private license-assistance service. Fill out one simple form and our team purchases your fishing license from the official state portal on your behalf.",
  openGraph: {
    type: "website",
    siteName: "AnglerPermit",
    // Images come from the opengraph-image.png convention in this directory.
  },
  twitter: {
    card: "summary_large_image",
  },
  // PWA manifest (static file in /public). Icon <link> tags are injected by
  // the App Router file conventions: app/favicon.ico, app/icon.png and
  // app/apple-icon.png — so no explicit `icons` entry here (avoids dupes).
  manifest: "/site.webmanifest",
  other: {
    // Microsoft tile support — config lives in /public/browserconfig.xml.
    "msapplication-config": "/browserconfig.xml",
    "msapplication-TileColor": "#0A2540",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-navy focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>
        <Header />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
